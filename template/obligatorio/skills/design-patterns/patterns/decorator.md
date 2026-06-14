# Decorator Pattern

## Intent

Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

## The Problem

You need to add behavior to objects, but:
- Inheritance is static and applies to entire class
- You want to add/remove behavior at runtime
- Combining behaviors leads to class explosion

### The Class Explosion Problem

```typescript
// Base class
class Coffee {
  cost(): number { return 2; }
  description(): string { return 'Coffee'; }
}

// Now we need variations...
class CoffeeWithMilk extends Coffee {
  cost() { return super.cost() + 0.5; }
  description() { return super.description() + ', Milk'; }
}

class CoffeeWithSugar extends Coffee {
  cost() { return super.cost() + 0.25; }
  description() { return super.description() + ', Sugar'; }
}

// Combinations start exploding
class CoffeeWithMilkAndSugar extends Coffee { /* ... */ }
class CoffeeWithMilkAndWhip extends Coffee { /* ... */ }
class CoffeeWithMilkAndSugarAndWhip extends Coffee { /* ... */ }
class CoffeeWithDoubleMilk extends Coffee { /* ... */ }
// 🔥 This doesn't scale!
```

## The Solution

Wrap objects with decorator objects that add behavior:

```typescript
// Component interface
interface Coffee {
  cost(): number;
  description(): string;
}

// Concrete component
class SimpleCoffee implements Coffee {
  cost() { return 2; }
  description() { return 'Coffee'; }
}

class Espresso implements Coffee {
  cost() { return 2.5; }
  description() { return 'Espresso'; }
}

// Base decorator
abstract class CoffeeDecorator implements Coffee {
  constructor(protected coffee: Coffee) {}

  cost(): number {
    return this.coffee.cost();
  }

  description(): string {
    return this.coffee.description();
  }
}

// Concrete decorators
class MilkDecorator extends CoffeeDecorator {
  cost() { return this.coffee.cost() + 0.5; }
  description() { return `${this.coffee.description()}, Milk`; }
}

class SugarDecorator extends CoffeeDecorator {
  cost() { return this.coffee.cost() + 0.25; }
  description() { return `${this.coffee.description()}, Sugar`; }
}

class WhipDecorator extends CoffeeDecorator {
  cost() { return this.coffee.cost() + 0.75; }
  description() { return `${this.coffee.description()}, Whipped Cream`; }
}

class VanillaDecorator extends CoffeeDecorator {
  cost() { return this.coffee.cost() + 0.4; }
  description() { return `${this.coffee.description()}, Vanilla`; }
}

// Usage - compose any combination!
let coffee: Coffee = new Espresso();
coffee = new MilkDecorator(coffee);
coffee = new MilkDecorator(coffee);  // Double milk!
coffee = new VanillaDecorator(coffee);
coffee = new WhipDecorator(coffee);

console.log(coffee.description()); // Espresso, Milk, Milk, Vanilla, Whipped Cream
console.log(coffee.cost());        // 2.5 + 0.5 + 0.5 + 0.4 + 0.75 = 4.65
```

## Structure

```
┌─────────────────────┐
│     Component       │◄─────────────────────────────┐
│   <<interface>>     │                              │
├─────────────────────┤                              │
│ + operation()       │                              │
└─────────────────────┘                              │
          △                                          │
          │                                          │
    ┌─────┴─────┐                                   │
    │           │                                   │
┌───┴───┐  ┌────┴────────────┐                     │
│Concrete│  │   Decorator     │─────────────────────┘
│Component│ │                 │ wraps component
└─────────┘ │ - component     │
            │ + operation()   │
            └─────────────────┘
                    △
                    │
          ┌─────────┴─────────┐
          │                   │
   ┌──────┴──────┐    ┌───────┴─────┐
   │ DecoratorA  │    │ DecoratorB  │
   │+ operation()│    │+ operation()│
   └─────────────┘    └─────────────┘
```

## JavaScript/TypeScript Implementations

### Function Decorators (Most Idiomatic JS)

```typescript
// Higher-order function that adds behavior
type AsyncFunction<T> = (...args: any[]) => Promise<T>;

// Retry decorator
function withRetry<T>(
  fn: AsyncFunction<T>,
  maxRetries: number = 3,
  delay: number = 1000
): AsyncFunction<T> {
  return async (...args: any[]): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError!;
  };
}

// Logging decorator
function withLogging<T>(
  fn: AsyncFunction<T>,
  name: string
): AsyncFunction<T> {
  return async (...args: any[]): Promise<T> => {
    console.log(`[${name}] Called with:`, args);
    const start = Date.now();

    try {
      const result = await fn(...args);
      console.log(`[${name}] Completed in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.error(`[${name}] Failed after ${Date.now() - start}ms:`, error);
      throw error;
    }
  };
}

// Cache decorator
function withCache<T>(
  fn: AsyncFunction<T>,
  keyFn: (...args: any[]) => string,
  ttlMs: number = 60000
): AsyncFunction<T> {
  const cache = new Map<string, { value: T; expires: number }>();

  return async (...args: any[]): Promise<T> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const result = await fn(...args);
    cache.set(key, { value: result, expires: Date.now() + ttlMs });
    return result;
  };
}

// Timeout decorator
function withTimeout<T>(
  fn: AsyncFunction<T>,
  timeoutMs: number
): AsyncFunction<T> {
  return async (...args: any[]): Promise<T> => {
    return Promise.race([
      fn(...args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
  };
}

// Compose decorators
async function fetchUserById(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Stack decorators - order matters!
const fetchUser = withLogging(
  withRetry(
    withTimeout(
      withCache(
        fetchUserById,
        (id) => `user:${id}`,
        5 * 60 * 1000  // 5 min cache
      ),
      5000  // 5 sec timeout
    ),
    3  // 3 retries
  ),
  'fetchUser'
);

// Usage
const user = await fetchUser('123');
```

### TypeScript Decorators (ES Decorators)

```typescript
// Method decorators using TypeScript's decorator syntax

// Logging decorator
function Log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    console.log(`[${propertyKey}] Called with:`, args);
    const start = Date.now();

    try {
      const result = await originalMethod.apply(this, args);
      console.log(`[${propertyKey}] Returned:`, result);
      return result;
    } catch (error) {
      console.error(`[${propertyKey}] Threw:`, error);
      throw error;
    } finally {
      console.log(`[${propertyKey}] Duration: ${Date.now() - start}ms`);
    }
  };

  return descriptor;
}

// Memoization decorator
function Memoize(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

// Debounce decorator
function Debounce(ms: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let timeoutId: NodeJS.Timeout;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, ms);
    };

    return descriptor;
  };
}

// Validate decorator
function Validate(schema: Schema) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const validation = schema.validate(args[0]);
      if (validation.error) {
        throw new ValidationError(validation.error.message);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Usage with class
class UserService {
  @Log
  @Validate(userSchema)
  async createUser(data: CreateUserDTO): Promise<User> {
    // Implementation
  }

  @Log
  @Memoize
  async getUserById(id: string): Promise<User> {
    // Implementation
  }

  @Debounce(300)
  onSearchInput(query: string): void {
    // Implementation
  }
}
```

### Middleware Pattern (Decorator for HTTP)

```typescript
// Express-style middleware is essentially the decorator pattern

type Request = { body: any; headers: Record<string, string>; user?: User };
type Response = { json: (data: any) => void; status: (code: number) => Response };
type NextFunction = () => Promise<void>;
type Middleware = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type Handler = (req: Request, res: Response) => Promise<void>;

// Decorators as middleware
const authenticate: Middleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    req.user = await verifyToken(token);
    await next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const rateLimit = (maxRequests: number, windowMs: number): Middleware => {
  const requests = new Map<string, number[]>();

  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    const userRequests = (requests.get(ip) || [])
      .filter(time => time > windowStart);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    userRequests.push(now);
    requests.set(ip, userRequests);
    await next();
  };
};

const validateBody = (schema: Schema): Middleware => {
  return async (req, res, next) => {
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    await next();
  };
};

const logRequest: Middleware = async (req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.path}`);
  await next();
  console.log(`← ${req.method} ${req.path} ${Date.now() - start}ms`);
};

// Compose middleware
function compose(...middlewares: Middleware[]): (handler: Handler) => Handler {
  return (handler: Handler): Handler => {
    return async (req: Request, res: Response) => {
      let index = 0;

      const next = async (): Promise<void> => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          await middleware(req, res, next);
        } else {
          await handler(req, res);
        }
      };

      await next();
    };
  };
}

// Usage
const createUserHandler: Handler = async (req, res) => {
  const user = await userService.create(req.body);
  res.json(user);
};

// Decorated handler
const decoratedHandler = compose(
  logRequest,
  rateLimit(100, 60000),
  authenticate,
  validateBody(createUserSchema)
)(createUserHandler);

// Register route
app.post('/users', decoratedHandler);
```

## Real-World Applications

### 1. Stream Decorators

```typescript
interface DataStream {
  read(): Promise<Buffer | null>;
  write(data: Buffer): Promise<void>;
  close(): Promise<void>;
}

class FileStream implements DataStream {
  private handle: fs.promises.FileHandle | null = null;

  constructor(private path: string, private mode: 'r' | 'w') {}

  async read(): Promise<Buffer | null> {
    if (!this.handle) {
      this.handle = await fs.promises.open(this.path, this.mode);
    }
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await this.handle.read(buffer, 0, 4096, null);
    return bytesRead > 0 ? buffer.slice(0, bytesRead) : null;
  }

  async write(data: Buffer): Promise<void> {
    if (!this.handle) {
      this.handle = await fs.promises.open(this.path, this.mode);
    }
    await this.handle.write(data);
  }

  async close(): Promise<void> {
    await this.handle?.close();
    this.handle = null;
  }
}

// Base decorator
abstract class StreamDecorator implements DataStream {
  constructor(protected stream: DataStream) {}

  async read(): Promise<Buffer | null> {
    return this.stream.read();
  }

  async write(data: Buffer): Promise<void> {
    return this.stream.write(data);
  }

  async close(): Promise<void> {
    return this.stream.close();
  }
}

// Compression decorator
class GzipStream extends StreamDecorator {
  async read(): Promise<Buffer | null> {
    const data = await this.stream.read();
    if (!data) return null;
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async write(data: Buffer): Promise<void> {
    const compressed = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    return this.stream.write(compressed);
  }
}

// Encryption decorator
class EncryptedStream extends StreamDecorator {
  constructor(
    stream: DataStream,
    private key: Buffer,
    private iv: Buffer
  ) {
    super(stream);
  }

  async read(): Promise<Buffer | null> {
    const data = await this.stream.read();
    if (!data) return null;

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }

  async write(data: Buffer): Promise<void> {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return this.stream.write(encrypted);
  }
}

// Buffered decorator
class BufferedStream extends StreamDecorator {
  private buffer: Buffer[] = [];
  private bufferSize: number;

  constructor(stream: DataStream, bufferSize: number = 8192) {
    super(stream);
    this.bufferSize = bufferSize;
  }

  async write(data: Buffer): Promise<void> {
    this.buffer.push(data);
    const totalSize = this.buffer.reduce((sum, b) => sum + b.length, 0);

    if (totalSize >= this.bufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length > 0) {
      await this.stream.write(Buffer.concat(this.buffer));
      this.buffer = [];
    }
  }

  async close(): Promise<void> {
    await this.flush();
    await this.stream.close();
  }
}

// Usage - compose stream behaviors
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Writing: buffer → compress → encrypt → file
let writeStream: DataStream = new FileStream('data.enc', 'w');
writeStream = new EncryptedStream(writeStream, key, iv);
writeStream = new GzipStream(writeStream);
writeStream = new BufferedStream(writeStream);

await writeStream.write(Buffer.from('Hello, World!'));
await writeStream.close();

// Reading: file → decrypt → decompress
let readStream: DataStream = new FileStream('data.enc', 'r');
readStream = new EncryptedStream(readStream, key, iv);
readStream = new GzipStream(readStream);

const data = await readStream.read();
console.log(data?.toString()); // Hello, World!
```

### 2. React Higher-Order Components

```tsx
// HOC is the decorator pattern for React components

interface WithLoadingProps {
  isLoading: boolean;
}

// Loading decorator
function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithLoadingProps> {
  return function WithLoadingComponent({ isLoading, ...props }: P & WithLoadingProps) {
    if (isLoading) {
      return <div className="spinner">Loading...</div>;
    }
    return <WrappedComponent {...(props as P)} />;
  };
}

// Error boundary decorator
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<{ error: Error }>
): React.FC<P> {
  return class ErrorBoundary extends React.Component<P, { error: Error | null }> {
    state = { error: null };

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    render() {
      if (this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
}

// Auth decorator
function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (requiredRole && user?.role !== requiredRole) {
      return <div>Access Denied</div>;
    }

    return <WrappedComponent {...props} />;
  };
}

// Analytics decorator
function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  eventName: string
): React.FC<P> {
  return function WithAnalyticsComponent(props: P) {
    useEffect(() => {
      analytics.track(`${eventName}_viewed`);
      return () => analytics.track(`${eventName}_left`);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// Usage - compose HOCs
const UserDashboard: React.FC<DashboardProps> = ({ data }) => {
  return <div>{/* Dashboard content */}</div>;
};

// Apply decorators
export default withAnalytics(
  withErrorBoundary(
    withAuth(
      withLoading(UserDashboard),
      'admin'
    ),
    ErrorFallback
  ),
  'admin_dashboard'
);
```

### 3. API Response Decorators

```typescript
interface APIResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// Base transformer
type ResponseTransformer<T, U> = (response: APIResponse<T>) => APIResponse<U>;

// Decorator: Add pagination metadata
function withPagination<T>(
  page: number,
  pageSize: number,
  total: number
): ResponseTransformer<T[], T[]> {
  return (response) => ({
    ...response,
    meta: {
      ...response.meta,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      }
    }
  });
}

// Decorator: Add timing info
function withTiming<T>(startTime: number): ResponseTransformer<T, T> {
  return (response) => ({
    ...response,
    meta: {
      ...response.meta,
      timing: {
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  });
}

// Decorator: Transform data shape
function withFieldSelection<T extends Record<string, unknown>>(
  fields: (keyof T)[]
): ResponseTransformer<T[], Partial<T>[]> {
  return (response) => ({
    ...response,
    data: response.data.map(item =>
      fields.reduce((acc, field) => {
        acc[field] = item[field];
        return acc;
      }, {} as Partial<T>)
    )
  });
}

// Decorator: Add HATEOAS links
function withLinks<T>(
  linkGenerator: (data: T) => Record<string, string>
): ResponseTransformer<T, T & { _links: Record<string, string> }> {
  return (response) => ({
    ...response,
    data: {
      ...response.data,
      _links: linkGenerator(response.data)
    }
  });
}

// Compose transformers
function compose<T>(...transformers: ResponseTransformer<any, any>[]) {
  return (initial: APIResponse<T>): APIResponse<any> => {
    return transformers.reduce(
      (response, transformer) => transformer(response),
      initial
    );
  };
}

// Usage in API handler
async function getUsers(req: Request, res: Response) {
  const startTime = Date.now();
  const { page = 1, pageSize = 20, fields } = req.query;

  const [users, total] = await Promise.all([
    userRepo.findPaginated(page, pageSize),
    userRepo.count()
  ]);

  let response: APIResponse<User[]> = { data: users };

  // Apply decorators
  const transform = compose<User[]>(
    withPagination(page, pageSize, total),
    withTiming(startTime),
    ...(fields ? [withFieldSelection(fields.split(','))] : [])
  );

  res.json(transform(response));
}
```

## When to Use

**Use Decorator when:**
- You need to add responsibilities to objects without affecting others
- Extension by subclassing is impractical (class explosion)
- You want to add/remove behavior at runtime
- You need to combine behaviors in various ways

**Don't use Decorator when:**
- The component interface is complex (many methods to delegate)
- You only need one fixed combination
- Order of decoration matters and is confusing

## Related Patterns

- **Composite:** Decorator is a degenerate composite with one child
- **Strategy:** Changes the guts; Decorator changes the skin
- **Proxy:** Controls access; Decorator adds behavior
- **Chain of Responsibility:** Similar chaining, different intent
