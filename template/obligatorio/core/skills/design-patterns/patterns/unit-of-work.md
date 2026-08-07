# Unit of Work Pattern

## Intent

Maintain a list of objects affected by a business transaction and coordinate the writing out of changes and the resolution of concurrency problems.

## The Problem

Multiple repository operations need to happen atomically:
- Creating an order requires saving order, order items, and updating inventory
- If one save fails, others may have already committed
- No way to roll back partial changes
- Inconsistent data state

```typescript
// Without Unit of Work - partial commits possible
class OrderService {
  async createOrder(userId: string, items: CartItem[]) {
    // What if this succeeds...
    const order = await this.orderRepository.save(new Order(userId));

    // ...but this fails?
    for (const item of items) {
      await this.orderItemRepository.save(new OrderItem(order.id, item));
      // If this throws on item 3, items 1-2 are orphaned
    }

    // Inventory never updated
    await this.inventoryRepository.decrementStock(items);
  }
}
```

## The Solution

Track all changes and commit them together in a single transaction:

```typescript
// Unit of Work interface
interface UnitOfWork {
  registerNew<T>(entity: T): void;
  registerDirty<T>(entity: T): void;
  registerDeleted<T>(entity: T): void;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Implementation
class DatabaseUnitOfWork implements UnitOfWork {
  private newEntities: Map<string, any[]> = new Map();
  private dirtyEntities: Map<string, any[]> = new Map();
  private deletedEntities: Map<string, any[]> = new Map();
  private transaction: Transaction | null = null;

  constructor(private db: Database) {}

  registerNew<T>(entity: T): void {
    const type = entity.constructor.name;
    if (!this.newEntities.has(type)) {
      this.newEntities.set(type, []);
    }
    this.newEntities.get(type)!.push(entity);
  }

  registerDirty<T>(entity: T): void {
    const type = entity.constructor.name;
    if (!this.dirtyEntities.has(type)) {
      this.dirtyEntities.set(type, []);
    }
    this.dirtyEntities.get(type)!.push(entity);
  }

  registerDeleted<T>(entity: T): void {
    const type = entity.constructor.name;
    if (!this.deletedEntities.has(type)) {
      this.deletedEntities.set(type, []);
    }
    this.deletedEntities.get(type)!.push(entity);
  }

  async commit(): Promise<void> {
    this.transaction = await this.db.beginTransaction();

    try {
      // Insert new entities
      for (const [type, entities] of this.newEntities) {
        await this.insertEntities(type, entities);
      }

      // Update dirty entities
      for (const [type, entities] of this.dirtyEntities) {
        await this.updateEntities(type, entities);
      }

      // Delete removed entities
      for (const [type, entities] of this.deletedEntities) {
        await this.deleteEntities(type, entities);
      }

      await this.transaction.commit();
      this.clear();

    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (this.transaction) {
      await this.transaction.rollback();
      this.transaction = null;
    }
    this.clear();
  }

  private clear(): void {
    this.newEntities.clear();
    this.dirtyEntities.clear();
    this.deletedEntities.clear();
  }

  private async insertEntities(type: string, entities: any[]): Promise<void> {
    const table = this.getTableName(type);
    for (const entity of entities) {
      await this.transaction!.query(
        `INSERT INTO ${table} (${this.getColumns(entity)}) VALUES (${this.getPlaceholders(entity)})`,
        this.getValues(entity)
      );
    }
  }

  private async updateEntities(type: string, entities: any[]): Promise<void> {
    const table = this.getTableName(type);
    for (const entity of entities) {
      await this.transaction!.query(
        `UPDATE ${table} SET ${this.getSetClause(entity)} WHERE id = $1`,
        [entity.id, ...this.getUpdateValues(entity)]
      );
    }
  }

  private async deleteEntities(type: string, entities: any[]): Promise<void> {
    const table = this.getTableName(type);
    const ids = entities.map(e => e.id);
    await this.transaction!.query(
      `DELETE FROM ${table} WHERE id = ANY($1)`,
      [ids]
    );
  }

  private getTableName(type: string): string {
    // Convert PascalCase to snake_case plural
    return type.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1) + 's';
  }

  // Helper methods for SQL generation...
  private getColumns(entity: any): string { /* ... */ }
  private getPlaceholders(entity: any): string { /* ... */ }
  private getValues(entity: any): any[] { /* ... */ }
  private getSetClause(entity: any): string { /* ... */ }
  private getUpdateValues(entity: any): any[] { /* ... */ }
}
```

## Usage with Services

```typescript
class OrderService {
  constructor(
    private unitOfWork: UnitOfWork,
    private orderRepository: OrderRepository,
    private inventoryRepository: InventoryRepository
  ) {}

  async createOrder(userId: string, items: CartItem[]): Promise<Order> {
    // Create order
    const order = Order.create({
      userId,
      status: 'pending',
      total: this.calculateTotal(items)
    });
    this.unitOfWork.registerNew(order);

    // Create order items
    for (const item of items) {
      const orderItem = OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
      this.unitOfWork.registerNew(orderItem);
    }

    // Update inventory
    for (const item of items) {
      const inventory = await this.inventoryRepository.findByProductId(item.productId);
      inventory.decrementStock(item.quantity);
      this.unitOfWork.registerDirty(inventory);
    }

    // All changes committed atomically
    await this.unitOfWork.commit();

    return order;
  }
}
```

## Identity Map Integration

Prevent duplicate object instances and track changes:

```typescript
class UnitOfWorkWithIdentityMap implements UnitOfWork {
  private identityMap: Map<string, Map<string, any>> = new Map();
  private newEntities: Set<any> = new Set();
  private dirtyEntities: Set<any> = new Set();
  private deletedEntities: Set<any> = new Set();

  // Get or create entity instance
  getIdentity<T>(type: string, id: string): T | undefined {
    return this.identityMap.get(type)?.get(id);
  }

  registerIdentity<T>(entity: T & { id: string }): void {
    const type = entity.constructor.name;
    if (!this.identityMap.has(type)) {
      this.identityMap.set(type, new Map());
    }
    this.identityMap.get(type)!.set(entity.id, entity);
  }

  registerNew<T>(entity: T & { id: string }): void {
    this.registerIdentity(entity);
    this.newEntities.add(entity);
  }

  registerDirty<T>(entity: T): void {
    if (!this.newEntities.has(entity)) {
      this.dirtyEntities.add(entity);
    }
  }

  registerDeleted<T>(entity: T): void {
    if (this.newEntities.has(entity)) {
      this.newEntities.delete(entity);
    } else {
      this.dirtyEntities.delete(entity);
      this.deletedEntities.add(entity);
    }
  }

  // Commit and rollback implementations...
}

// Repository uses identity map
class UserRepository {
  constructor(
    private db: Database,
    private unitOfWork: UnitOfWorkWithIdentityMap
  ) {}

  async findById(id: string): Promise<User | null> {
    // Check identity map first
    const cached = this.unitOfWork.getIdentity<User>('User', id);
    if (cached) return cached;

    // Load from database
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!row) return null;

    const user = this.mapToEntity(row);
    this.unitOfWork.registerIdentity(user);
    return user;
  }
}
```

## Automatic Dirty Tracking

Use Proxy to automatically detect changes:

```typescript
function createTrackedEntity<T extends object>(
  entity: T,
  unitOfWork: UnitOfWork
): T {
  return new Proxy(entity, {
    set(target, property, value, receiver) {
      const oldValue = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value, receiver);

      if (oldValue !== value) {
        unitOfWork.registerDirty(target);
      }

      return result;
    }
  });
}

// Usage
const user = createTrackedEntity(
  await userRepository.findById('123'),
  unitOfWork
);

user.name = 'New Name'; // Automatically marked dirty
await unitOfWork.commit(); // Saves change
```

## Scoped Unit of Work

Create per-request unit of work:

```typescript
// Factory for creating scoped units of work
class UnitOfWorkFactory {
  constructor(private db: Database) {}

  create(): UnitOfWork {
    return new DatabaseUnitOfWork(this.db);
  }
}

// Express middleware
function unitOfWorkMiddleware(factory: UnitOfWorkFactory) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.unitOfWork = factory.create();

    // Auto-commit on success, rollback on error
    const originalEnd = res.end;
    res.end = async function(...args) {
      try {
        if (res.statusCode < 400) {
          await req.unitOfWork.commit();
        } else {
          await req.unitOfWork.rollback();
        }
      } catch (error) {
        await req.unitOfWork.rollback();
        throw error;
      }
      return originalEnd.apply(res, args);
    };

    next();
  };
}

// Controller uses request-scoped unit of work
class OrderController {
  async createOrder(req: Request, res: Response) {
    const orderService = new OrderService(req.unitOfWork);
    const order = await orderService.createOrder(req.userId, req.body.items);
    res.json(order);
    // Unit of work commits automatically on response
  }
}
```

## Nested Units of Work

Support savepoints for partial rollbacks:

```typescript
class NestedUnitOfWork implements UnitOfWork {
  private savepoints: string[] = [];
  private savepointCounter = 0;

  async beginNested(): Promise<string> {
    const savepoint = `sp_${++this.savepointCounter}`;
    await this.transaction!.query(`SAVEPOINT ${savepoint}`);
    this.savepoints.push(savepoint);
    return savepoint;
  }

  async rollbackTo(savepoint: string): Promise<void> {
    await this.transaction!.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);

    // Remove all savepoints after this one
    const index = this.savepoints.indexOf(savepoint);
    if (index !== -1) {
      this.savepoints = this.savepoints.slice(0, index);
    }
  }

  async releaseSavepoint(savepoint: string): Promise<void> {
    await this.transaction!.query(`RELEASE SAVEPOINT ${savepoint}`);
    this.savepoints = this.savepoints.filter(sp => sp !== savepoint);
  }
}

// Usage
async function processOrders(orders: OrderInput[], unitOfWork: NestedUnitOfWork) {
  const results: ProcessResult[] = [];

  for (const order of orders) {
    const savepoint = await unitOfWork.beginNested();

    try {
      const result = await processOrder(order, unitOfWork);
      await unitOfWork.releaseSavepoint(savepoint);
      results.push({ success: true, order: result });
    } catch (error) {
      // Rollback just this order, continue with others
      await unitOfWork.rollbackTo(savepoint);
      results.push({ success: false, error: error.message });
    }
  }

  // Commit all successful orders
  await unitOfWork.commit();
  return results;
}
```

## When to Use

**Use Unit of Work when:**
- Multiple entities must be saved atomically
- You need transaction management across repositories
- You want to batch database operations for performance
- You need to track entity changes automatically

**Don't use Unit of Work when:**
- Single entity operations only
- Using a database that doesn't support transactions
- Simple CRUD without business logic

## Related Patterns

- **Repository:** Unit of Work coordinates multiple repositories
- **Identity Map:** Often combined to prevent duplicate instances
- **Domain Model:** Unit of Work manages domain object persistence
- **Service Layer:** Services use Unit of Work for transaction boundaries
