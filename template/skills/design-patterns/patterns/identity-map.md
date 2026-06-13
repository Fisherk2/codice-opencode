# Identity Map Pattern

## Intent

Ensure that each object gets loaded only once by keeping every loaded object in a map. Look up objects using the map when referring to them.

## The Problem

Same entity loaded multiple times:
- Multiple instances of same database row
- Inconsistent state between instances
- Wasted database queries
- Update anomalies

```typescript
// Without Identity Map - multiple instances of same entity
async function processOrder(orderId: string) {
  // Load order
  const order = await orderRepository.findById(orderId);

  // Somewhere else, load same order
  const orderAgain = await orderRepository.findById(orderId);

  // These are different objects!
  order.status = 'processing';
  console.log(orderAgain.status); // Still 'pending' - inconsistent!

  // Save order
  await orderRepository.save(order);
  // orderAgain is now stale
}
```

## The Solution

Maintain a map of loaded objects by their identity:

```typescript
class IdentityMap<T extends { id: string }> {
  private entities: Map<string, T> = new Map();

  get(id: string): T | undefined {
    return this.entities.get(id);
  }

  add(entity: T): void {
    this.entities.set(entity.id, entity);
  }

  has(id: string): boolean {
    return this.entities.has(id);
  }

  remove(id: string): void {
    this.entities.delete(id);
  }

  clear(): void {
    this.entities.clear();
  }
}

// Repository with Identity Map
class UserRepository {
  private identityMap = new IdentityMap<User>();

  async findById(id: string): Promise<User | null> {
    // Check identity map first
    const cached = this.identityMap.get(id);
    if (cached) {
      return cached;
    }

    // Load from database
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!row) return null;

    const user = this.mapToEntity(row);
    this.identityMap.add(user);

    return user;
  }

  async save(user: User): Promise<void> {
    await this.db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3',
      [user.name, user.email, user.id]
    );
    // Entity already in map, no need to re-add
  }

  // Clear map at end of unit of work
  clear(): void {
    this.identityMap.clear();
  }

  private mapToEntity(row: any): User {
    return new User(row.id, row.name, row.email);
  }
}

// Now both references are the same object
async function processUser(userId: string) {
  const user = await userRepository.findById(userId);
  const userAgain = await userRepository.findById(userId);

  console.log(user === userAgain); // true - same instance!

  user.name = 'Updated';
  console.log(userAgain.name); // 'Updated' - consistent!
}
```

## Generic Identity Map

```typescript
type EntityType = string;

class GlobalIdentityMap {
  private maps: Map<EntityType, Map<string, any>> = new Map();

  private getMap(type: EntityType): Map<string, any> {
    if (!this.maps.has(type)) {
      this.maps.set(type, new Map());
    }
    return this.maps.get(type)!;
  }

  get<T>(type: EntityType, id: string): T | undefined {
    return this.getMap(type).get(id);
  }

  add<T extends { id: string }>(type: EntityType, entity: T): void {
    this.getMap(type).set(entity.id, entity);
  }

  has(type: EntityType, id: string): boolean {
    return this.getMap(type).has(id);
  }

  remove(type: EntityType, id: string): void {
    this.getMap(type).delete(id);
  }

  clearType(type: EntityType): void {
    this.maps.delete(type);
  }

  clearAll(): void {
    this.maps.clear();
  }
}

// Base repository using global identity map
abstract class BaseRepository<T extends { id: string }> {
  constructor(
    protected db: Database,
    protected identityMap: GlobalIdentityMap,
    protected entityType: string
  ) {}

  async findById(id: string): Promise<T | null> {
    // Check identity map
    const cached = this.identityMap.get<T>(this.entityType, id);
    if (cached) return cached;

    // Load from database
    const entity = await this.loadFromDb(id);
    if (entity) {
      this.identityMap.add(this.entityType, entity);
    }

    return entity;
  }

  protected abstract loadFromDb(id: string): Promise<T | null>;
}

// Concrete repository
class OrderRepository extends BaseRepository<Order> {
  constructor(db: Database, identityMap: GlobalIdentityMap) {
    super(db, identityMap, 'Order');
  }

  protected async loadFromDb(id: string): Promise<Order | null> {
    const row = await this.db.query('SELECT * FROM orders WHERE id = $1', [id]);
    return row ? this.mapToEntity(row) : null;
  }
}
```

## Request-Scoped Identity Map

```typescript
// Identity map scoped to a request/transaction
class UnitOfWork {
  private identityMaps: Map<string, IdentityMap<any>> = new Map();
  private newEntities: Set<any> = new Set();
  private dirtyEntities: Set<any> = new Set();
  private deletedEntities: Set<any> = new Set();

  getIdentityMap<T extends { id: string }>(type: string): IdentityMap<T> {
    if (!this.identityMaps.has(type)) {
      this.identityMaps.set(type, new IdentityMap<T>());
    }
    return this.identityMaps.get(type)!;
  }

  registerNew<T extends { id: string }>(type: string, entity: T): void {
    this.getIdentityMap<T>(type).add(entity);
    this.newEntities.add(entity);
  }

  registerDirty<T>(entity: T): void {
    if (!this.newEntities.has(entity)) {
      this.dirtyEntities.add(entity);
    }
  }

  registerDeleted<T extends { id: string }>(type: string, entity: T): void {
    this.getIdentityMap(type).remove(entity.id);
    this.deletedEntities.add(entity);
    this.dirtyEntities.delete(entity);
  }

  async commit(): Promise<void> {
    // Insert new entities
    for (const entity of this.newEntities) {
      await this.insert(entity);
    }

    // Update dirty entities
    for (const entity of this.dirtyEntities) {
      await this.update(entity);
    }

    // Delete removed entities
    for (const entity of this.deletedEntities) {
      await this.delete(entity);
    }

    this.clear();
  }

  clear(): void {
    this.identityMaps.clear();
    this.newEntities.clear();
    this.dirtyEntities.clear();
    this.deletedEntities.clear();
  }

  private async insert(entity: any): Promise<void> { /* ... */ }
  private async update(entity: any): Promise<void> { /* ... */ }
  private async delete(entity: any): Promise<void> { /* ... */ }
}

// Express middleware to create request-scoped unit of work
function unitOfWorkMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    req.unitOfWork = new UnitOfWork();

    // Commit on successful response
    res.on('finish', async () => {
      if (res.statusCode < 400) {
        await req.unitOfWork.commit();
      }
    });

    next();
  };
}

// Repository uses request-scoped identity map
class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string, uow: UnitOfWork): Promise<User | null> {
    const identityMap = uow.getIdentityMap<User>('User');

    const cached = identityMap.get(id);
    if (cached) return cached;

    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!row) return null;

    const user = this.mapToEntity(row);
    identityMap.add(user);

    return user;
  }
}
```

## With Change Tracking

```typescript
class TrackedEntity<T extends { id: string }> {
  private original: T;
  private current: T;
  private _isDirty = false;

  constructor(entity: T) {
    this.original = JSON.parse(JSON.stringify(entity));
    this.current = entity;
  }

  get entity(): T {
    return this.current;
  }

  get isDirty(): boolean {
    return JSON.stringify(this.original) !== JSON.stringify(this.current);
  }

  markClean(): void {
    this.original = JSON.parse(JSON.stringify(this.current));
  }
}

class TrackingIdentityMap<T extends { id: string }> {
  private tracked: Map<string, TrackedEntity<T>> = new Map();

  get(id: string): T | undefined {
    return this.tracked.get(id)?.entity;
  }

  add(entity: T): void {
    this.tracked.set(entity.id, new TrackedEntity(entity));
  }

  getDirtyEntities(): T[] {
    return Array.from(this.tracked.values())
      .filter(t => t.isDirty)
      .map(t => t.entity);
  }

  markAllClean(): void {
    this.tracked.forEach(t => t.markClean());
  }

  remove(id: string): void {
    this.tracked.delete(id);
  }

  clear(): void {
    this.tracked.clear();
  }
}

// Auto-detect dirty entities at commit
class AutoTrackingUnitOfWork {
  private identityMap = new TrackingIdentityMap<any>();

  async commit(): Promise<void> {
    const dirtyEntities = this.identityMap.getDirtyEntities();

    for (const entity of dirtyEntities) {
      await this.update(entity);
    }

    this.identityMap.markAllClean();
  }
}
```

## WeakMap-Based Identity Map

```typescript
// For cases where you don't want to prevent garbage collection
class WeakIdentityMap {
  private entityToId = new WeakMap<object, string>();
  private idToEntity = new Map<string, WeakRef<object>>();
  private registry = new FinalizationRegistry<string>((id) => {
    this.idToEntity.delete(id);
  });

  get<T extends object>(id: string): T | undefined {
    const ref = this.idToEntity.get(id);
    return ref?.deref() as T | undefined;
  }

  add<T extends object & { id: string }>(entity: T): void {
    this.entityToId.set(entity, entity.id);
    this.idToEntity.set(entity.id, new WeakRef(entity));
    this.registry.register(entity, entity.id);
  }

  has(id: string): boolean {
    const ref = this.idToEntity.get(id);
    return ref?.deref() !== undefined;
  }
}
```

## Related Entity Handling

```typescript
class OrderRepository {
  constructor(
    private db: Database,
    private customerRepository: CustomerRepository,
    private identityMap: GlobalIdentityMap
  ) {}

  async findById(id: string): Promise<Order | null> {
    // Check identity map
    const cached = this.identityMap.get<Order>('Order', id);
    if (cached) return cached;

    // Load from database
    const row = await this.db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!row) return null;

    // Load related customer (also uses identity map)
    const customer = await this.customerRepository.findById(row.customer_id);

    const order = new Order(
      row.id,
      row.status,
      row.total,
      customer!
    );

    this.identityMap.add('Order', order);
    return order;
  }
}

// Both orders reference the same customer instance
const order1 = await orderRepository.findById('order-1');
const order2 = await orderRepository.findById('order-2');

// If both orders belong to same customer
console.log(order1.customer === order2.customer); // true
```

## When to Use

**Use Identity Map when:**
- Same entity may be loaded multiple times
- You need consistent object identity
- Multiple parts of code reference same entity
- Using Unit of Work pattern

**Don't use Identity Map when:**
- Entities are immutable/read-only
- Each load should be fresh (no caching)
- Simple CRUD without relationships
- Memory constraints prevent caching

## Related Patterns

- **Unit of Work:** Often uses Identity Map to track changes
- **Repository:** Implements Identity Map lookup
- **Lazy Load:** Works with Identity Map for related entities
- **Data Mapper:** Loads entities into Identity Map
