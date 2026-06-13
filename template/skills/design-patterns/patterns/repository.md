# Repository Pattern

## Intent

Mediate between the domain and data mapping layers using a collection-like interface for accessing domain objects. Repository encapsulates the logic to access data sources.

## The Problem

Data access code scattered throughout the application:
- Business logic mixed with database queries
- Hard to test without a real database
- Changing data source requires changes everywhere
- No consistent interface for data operations

```typescript
// Without Repository - data access scattered in business logic
class OrderService {
  async processOrder(userId: string, items: CartItem[]) {
    // SQL directly in business logic
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    // Business logic
    if (!user.verified) {
      throw new Error('User not verified');
    }

    // More SQL
    const inventory = await db.query(
      'SELECT * FROM inventory WHERE product_id IN ($1)',
      [items.map(i => i.productId)]
    );

    // Validation logic with DB calls mixed together
    for (const item of items) {
      const stock = inventory.find(i => i.product_id === item.productId);
      if (!stock || stock.quantity < item.quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // More SQL...
    await db.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2)',
      [userId, calculateTotal(items)]
    );
  }
}
```

## The Solution

Create repository classes that encapsulate all data access:

```typescript
// Repository interface
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: FindOptions): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

// Domain entity
class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public verified: boolean,
    public createdAt: Date
  ) {}

  verify(): void {
    this.verified = true;
  }
}

// Concrete implementation - PostgreSQL
class PostgresUserRepository implements UserRepository {
  constructor(private db: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findAll(options?: FindOptions): Promise<User[]> {
    let query = 'SELECT * FROM users';
    const params: any[] = [];

    if (options?.where) {
      const conditions = Object.entries(options.where)
        .map(([key, value], i) => {
          params.push(value);
          return `${key} = $${i + 1}`;
        });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      params.push(options.limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async save(user: User): Promise<User> {
    const result = await this.db.query(
      `INSERT INTO users (id, email, name, verified, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET email = $2, name = $3, verified = $4
       RETURNING *`,
      [user.id, user.email, user.name, user.verified, user.createdAt]
    );

    return this.mapToEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM users WHERE id = $1',
      [id]
    );
    return result.rows.length > 0;
  }

  private mapToEntity(row: any): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.verified,
      new Date(row.created_at)
    );
  }
}

// In-memory implementation for testing
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(u => u.email === email) || null;
  }

  async findAll(options?: FindOptions): Promise<User[]> {
    let users = Array.from(this.users.values());

    if (options?.where) {
      users = users.filter(user =>
        Object.entries(options.where!).every(
          ([key, value]) => (user as any)[key] === value
        )
      );
    }

    if (options?.orderBy) {
      users.sort((a, b) => {
        const aVal = (a as any)[options.orderBy!];
        const bVal = (b as any)[options.orderBy!];
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    }

    if (options?.limit) {
      users = users.slice(0, options.limit);
    }

    return users;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }

  // Test helpers
  clear(): void {
    this.users.clear();
  }

  seed(users: User[]): void {
    users.forEach(u => this.users.set(u.id, u));
  }
}

// Service uses repository interface - doesn't know the implementation
class UserService {
  constructor(private userRepository: UserRepository) {}

  async registerUser(email: string, name: string): Promise<User> {
    // Business logic only - no data access details
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateEmailError(email);
    }

    const user = new User(
      generateId(),
      email,
      name,
      false,
      new Date()
    );

    return this.userRepository.save(user);
  }

  async verifyUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    user.verify();
    return this.userRepository.save(user);
  }
}

// Usage in production
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const userRepository = new PostgresUserRepository(db);
const userService = new UserService(userRepository);

// Usage in tests
const testRepository = new InMemoryUserRepository();
const testUserService = new UserService(testRepository);
```

## Advanced Repository Features

### Specification Pattern

```typescript
// Specification for complex queries
interface Specification<T> {
  isSatisfiedBy(entity: T): boolean;
  toSQL(): { where: string; params: any[] };
}

class ActiveUserSpecification implements Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.verified && user.lastLoginAt > thirtyDaysAgo();
  }

  toSQL() {
    return {
      where: 'verified = true AND last_login_at > $1',
      params: [thirtyDaysAgo()]
    };
  }
}

class PremiumUserSpecification implements Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.subscriptionTier === 'premium';
  }

  toSQL() {
    return {
      where: 'subscription_tier = $1',
      params: ['premium']
    };
  }
}

// Composite specifications
class AndSpecification<T> implements Specification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {}

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }

  toSQL() {
    const leftSql = this.left.toSQL();
    const rightSql = this.right.toSQL();
    return {
      where: `(${leftSql.where}) AND (${rightSql.where})`,
      params: [...leftSql.params, ...rightSql.params]
    };
  }
}

// Repository with specification support
interface UserRepository {
  findBySpecification(spec: Specification<User>): Promise<User[]>;
}

// Usage
const activePremiumSpec = new AndSpecification(
  new ActiveUserSpecification(),
  new PremiumUserSpecification()
);

const activePremiumUsers = await userRepository.findBySpecification(activePremiumSpec);
```

### Paginated Results

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

interface UserRepository {
  findPaginated(options: PaginationOptions): Promise<PaginatedResult<User>>;
}

class PostgresUserRepository implements UserRepository {
  async findPaginated(options: PaginationOptions): Promise<PaginatedResult<User>> {
    const { page, pageSize, orderBy = 'created_at', orderDir = 'desc' } = options;
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await this.db.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    // Get page data
    const result = await this.db.query(
      `SELECT * FROM users ORDER BY ${orderBy} ${orderDir} LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: result.rows.map(row => this.mapToEntity(row)),
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
}
```

### Generic Repository Base

```typescript
// Generic repository interface
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

// Base implementation
abstract class PostgresRepository<T, ID> implements Repository<T, ID> {
  constructor(
    protected db: Pool,
    protected tableName: string
  ) {}

  async findById(id: ID): Promise<T | null> {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findAll(): Promise<T[]> {
    const result = await this.db.query(`SELECT * FROM ${this.tableName}`);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async delete(id: ID): Promise<void> {
    await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  async exists(id: ID): Promise<boolean> {
    const result = await this.db.query(
      `SELECT 1 FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0;
  }

  abstract save(entity: T): Promise<T>;
  protected abstract mapToEntity(row: any): T;
}

// Specific repository extends base
class PostgresProductRepository extends PostgresRepository<Product, string> {
  constructor(db: Pool) {
    super(db, 'products');
  }

  async save(product: Product): Promise<Product> {
    const result = await this.db.query(
      `INSERT INTO products (id, name, price, category_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = $2, price = $3, category_id = $4
       RETURNING *`,
      [product.id, product.name, product.price, product.categoryId]
    );
    return this.mapToEntity(result.rows[0]);
  }

  // Domain-specific queries
  async findByCategory(categoryId: string): Promise<Product[]> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE category_id = $1',
      [categoryId]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findInPriceRange(min: number, max: number): Promise<Product[]> {
    const result = await this.db.query(
      'SELECT * FROM products WHERE price BETWEEN $1 AND $2',
      [min, max]
    );
    return result.rows.map(row => this.mapToEntity(row));
  }

  protected mapToEntity(row: any): Product {
    return new Product(row.id, row.name, row.price, row.category_id);
  }
}
```

## Testing with Repositories

```typescript
describe('UserService', () => {
  let userRepository: InMemoryUserRepository;
  let userService: UserService;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    userService = new UserService(userRepository);
  });

  describe('registerUser', () => {
    it('should create new user', async () => {
      const user = await userService.registerUser('test@example.com', 'Test User');

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.verified).toBe(false);

      // Verify persisted
      const found = await userRepository.findById(user.id);
      expect(found).toEqual(user);
    });

    it('should reject duplicate email', async () => {
      // Seed existing user
      userRepository.seed([
        new User('1', 'existing@example.com', 'Existing', true, new Date())
      ]);

      await expect(
        userService.registerUser('existing@example.com', 'New User')
      ).rejects.toThrow(DuplicateEmailError);
    });
  });

  describe('verifyUser', () => {
    it('should mark user as verified', async () => {
      userRepository.seed([
        new User('1', 'test@example.com', 'Test', false, new Date())
      ]);

      const user = await userService.verifyUser('1');

      expect(user.verified).toBe(true);
    });

    it('should throw if user not found', async () => {
      await expect(
        userService.verifyUser('nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

## When to Use

**Use Repository when:**
- You want to decouple domain from data access
- You need to test business logic without database
- You might change data sources
- You want a consistent data access interface

**Don't use Repository when:**
- Simple CRUD with no business logic
- Tight coupling to specific database is acceptable
- Performance requires direct database access

## Related Patterns

- **Unit of Work:** Coordinates multiple repository operations
- **Data Mapper:** Handles object-relational mapping (often used inside repository)
- **Specification:** Encapsulates query criteria
- **Identity Map:** Ensures entity uniqueness within session
