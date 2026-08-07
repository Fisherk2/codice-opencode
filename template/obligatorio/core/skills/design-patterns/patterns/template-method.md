# Template Method Pattern

## Intent

Define the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure.

## The Problem

Similar algorithms with slight variations:
- Duplicate code across implementations
- Changes to shared steps require multiple updates
- Inconsistent behavior between implementations

```typescript
// Without Template Method - duplicated structure
class CSVExporter {
  export(data: any[]): string {
    // Validate - duplicated
    if (!data.length) throw new Error('No data');

    // Format header - specific
    const header = Object.keys(data[0]).join(',');

    // Format rows - specific
    const rows = data.map(row =>
      Object.values(row).join(',')
    );

    // Combine - duplicated
    return [header, ...rows].join('\n');
  }
}

class JSONExporter {
  export(data: any[]): string {
    // Validate - duplicated
    if (!data.length) throw new Error('No data');

    // Format - specific
    return JSON.stringify(data, null, 2);

    // No header needed, different structure
  }
}

class XMLExporter {
  export(data: any[]): string {
    // Validate - duplicated
    if (!data.length) throw new Error('No data');

    // Format - specific but similar pattern
    const items = data.map(row => {
      const fields = Object.entries(row)
        .map(([k, v]) => `<${k}>${v}</${k}>`)
        .join('');
      return `<item>${fields}</item>`;
    });

    return `<?xml version="1.0"?><data>${items.join('')}</data>`;
  }
}
```

## The Solution

Extract the algorithm skeleton to a base class:

```typescript
// Base class defines the template
abstract class DataExporter {
  // Template method - defines the algorithm structure
  export(data: any[]): string {
    this.validate(data);
    const formatted = this.format(data);
    return this.postProcess(formatted);
  }

  // Common step - can be overridden
  protected validate(data: any[]): void {
    if (!data.length) {
      throw new Error('No data to export');
    }
  }

  // Abstract step - must be implemented
  protected abstract format(data: any[]): string;

  // Hook - optional override
  protected postProcess(content: string): string {
    return content;
  }
}

// Concrete implementations
class CSVExporter extends DataExporter {
  protected format(data: any[]): string {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row)
        .map(v => this.escapeCSV(String(v)))
        .join(',')
    );
    return [header, ...rows].join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

class JSONExporter extends DataExporter {
  protected format(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }
}

class XMLExporter extends DataExporter {
  protected format(data: any[]): string {
    const items = data.map(row => {
      const fields = Object.entries(row)
        .map(([k, v]) => `<${k}>${this.escapeXML(String(v))}</${k}>`)
        .join('');
      return `<item>${fields}</item>`;
    });
    return `<?xml version="1.0"?><data>${items.join('')}</data>`;
  }

  private escapeXML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  protected postProcess(content: string): string {
    // Pretty print XML
    return this.formatXML(content);
  }

  private formatXML(xml: string): string {
    // Simple XML formatting
    return xml;
  }
}

// Usage
const data = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
];

const csvExporter = new CSVExporter();
console.log(csvExporter.export(data));

const jsonExporter = new JSONExporter();
console.log(jsonExporter.export(data));
```

## Data Processing Pipeline

```typescript
abstract class DataProcessor<TInput, TOutput> {
  // Template method
  async process(input: TInput): Promise<TOutput> {
    await this.beforeProcess(input);

    const validated = await this.validate(input);
    const transformed = await this.transform(validated);
    const result = await this.finalize(transformed);

    await this.afterProcess(result);

    return result;
  }

  // Hooks - optional overrides
  protected async beforeProcess(input: TInput): Promise<void> {}
  protected async afterProcess(output: TOutput): Promise<void> {}

  // Abstract steps - must implement
  protected abstract validate(input: TInput): Promise<TInput>;
  protected abstract transform(input: TInput): Promise<TOutput>;

  // Default implementation - can override
  protected async finalize(output: TOutput): Promise<TOutput> {
    return output;
  }
}

// Image processor implementation
class ImageProcessor extends DataProcessor<ImageInput, ProcessedImage> {
  protected async validate(input: ImageInput): Promise<ImageInput> {
    if (!input.buffer || input.buffer.length === 0) {
      throw new ValidationError('Empty image buffer');
    }

    const metadata = await sharp(input.buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid image format');
    }

    return { ...input, metadata };
  }

  protected async transform(input: ImageInput): Promise<ProcessedImage> {
    const processed = await sharp(input.buffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    return {
      buffer: processed,
      format: 'jpeg',
      width: 800,
      height: 600
    };
  }

  protected async afterProcess(output: ProcessedImage): Promise<void> {
    console.log(`Processed image: ${output.width}x${output.height}`);
  }
}

// Order processor implementation
class OrderProcessor extends DataProcessor<OrderInput, ProcessedOrder> {
  constructor(
    private inventoryService: InventoryService,
    private pricingService: PricingService
  ) {
    super();
  }

  protected async validate(input: OrderInput): Promise<OrderInput> {
    if (!input.items.length) {
      throw new ValidationError('Order must have items');
    }

    // Check inventory
    for (const item of input.items) {
      const available = await this.inventoryService.checkStock(item.productId);
      if (available < item.quantity) {
        throw new ValidationError(`Insufficient stock for ${item.productId}`);
      }
    }

    return input;
  }

  protected async transform(input: OrderInput): Promise<ProcessedOrder> {
    const pricing = await this.pricingService.calculate(input.items);

    return {
      items: input.items,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      status: 'pending'
    };
  }

  protected async finalize(order: ProcessedOrder): Promise<ProcessedOrder> {
    // Reserve inventory
    for (const item of order.items) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }

    return { ...order, status: 'confirmed' };
  }
}
```

## Test Framework Example

```typescript
abstract class TestCase {
  // Template method
  async run(): Promise<TestResult> {
    const result: TestResult = {
      name: this.getName(),
      passed: false,
      duration: 0,
      error: null
    };

    const startTime = Date.now();

    try {
      await this.setUp();
      await this.runTest();
      result.passed = true;
    } catch (error) {
      result.passed = false;
      result.error = error as Error;
    } finally {
      try {
        await this.tearDown();
      } catch (tearDownError) {
        console.error('TearDown failed:', tearDownError);
      }
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  // Hooks with default implementations
  protected async setUp(): Promise<void> {}
  protected async tearDown(): Promise<void> {}

  // Must implement
  protected abstract getName(): string;
  protected abstract runTest(): Promise<void>;
}

// Concrete test
class UserServiceTest extends TestCase {
  private userService!: UserService;
  private testUser!: User;

  protected getName(): string {
    return 'UserService.createUser';
  }

  protected async setUp(): Promise<void> {
    this.userService = new UserService(new InMemoryUserRepository());
  }

  protected async runTest(): Promise<void> {
    this.testUser = await this.userService.createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    assert(this.testUser.id, 'User should have an ID');
    assert.equal(this.testUser.email, 'test@example.com');
  }

  protected async tearDown(): Promise<void> {
    if (this.testUser) {
      await this.userService.deleteUser(this.testUser.id);
    }
  }
}

// Database test with shared setup
abstract class DatabaseTestCase extends TestCase {
  protected db!: Database;

  protected async setUp(): Promise<void> {
    this.db = await Database.connect(process.env.TEST_DB_URL);
    await this.db.beginTransaction();
    await this.setUpTest();
  }

  protected async tearDown(): Promise<void> {
    await this.db.rollbackTransaction();
    await this.db.disconnect();
  }

  // Subclasses implement this instead of setUp
  protected async setUpTest(): Promise<void> {}
}
```

## HTTP Handler Template

```typescript
abstract class HTTPHandler {
  // Template method
  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Common authentication
      const user = await this.authenticate(req);

      // Common authorization
      await this.authorize(user, req);

      // Specific handling
      const result = await this.process(req, user);

      // Common response formatting
      this.sendResponse(res, result);

    } catch (error) {
      this.handleError(error as Error, res);
    }
  }

  // Default authentication - can override
  protected async authenticate(req: Request): Promise<User | null> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    return this.verifyToken(token);
  }

  // Default authorization - can override
  protected async authorize(user: User | null, req: Request): Promise<void> {
    if (this.requiresAuth() && !user) {
      throw new UnauthorizedError('Authentication required');
    }
  }

  // Must implement
  protected abstract process(req: Request, user: User | null): Promise<any>;

  // Hooks
  protected requiresAuth(): boolean {
    return true;
  }

  protected sendResponse(res: Response, data: any): void {
    res.json({ success: true, data });
  }

  protected handleError(error: Error, res: Response): void {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async verifyToken(token: string): Promise<User> {
    // Token verification logic
    return {} as User;
  }
}

// Public endpoint - no auth required
class GetProductsHandler extends HTTPHandler {
  protected requiresAuth(): boolean {
    return false;
  }

  protected async process(req: Request): Promise<Product[]> {
    return this.productRepository.findAll();
  }
}

// Protected endpoint
class CreateOrderHandler extends HTTPHandler {
  protected async authorize(user: User | null, req: Request): Promise<void> {
    await super.authorize(user, req);

    if (!user!.canCreateOrders) {
      throw new ForbiddenError('Not authorized to create orders');
    }
  }

  protected async process(req: Request, user: User): Promise<Order> {
    return this.orderService.createOrder(user.id, req.body);
  }
}
```

## Functional Alternative

```typescript
// Using higher-order functions instead of inheritance
type Step<T, U> = (input: T) => Promise<U>;

function createPipeline<TInput, TOutput>(
  validate: Step<TInput, TInput>,
  transform: Step<TInput, TOutput>,
  options: {
    beforeProcess?: (input: TInput) => Promise<void>;
    afterProcess?: (output: TOutput) => Promise<void>;
    finalize?: (output: TOutput) => Promise<TOutput>;
  } = {}
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    if (options.beforeProcess) {
      await options.beforeProcess(input);
    }

    const validated = await validate(input);
    const transformed = await transform(validated);
    const finalized = options.finalize
      ? await options.finalize(transformed)
      : transformed;

    if (options.afterProcess) {
      await options.afterProcess(finalized);
    }

    return finalized;
  };
}

// Usage
const processImage = createPipeline<ImageInput, ProcessedImage>(
  async (input) => {
    if (!input.buffer.length) throw new Error('Empty buffer');
    return input;
  },
  async (input) => {
    return await sharp(input.buffer).resize(800).toBuffer();
  },
  {
    afterProcess: async (output) => {
      console.log('Image processed');
    }
  }
);
```

## When to Use

**Use Template Method when:**
- Multiple classes share an algorithm structure
- You want to enforce a sequence of steps
- Subclasses should customize specific steps only
- Common behavior should be centralized

**Don't use Template Method when:**
- Algorithm doesn't have a fixed structure
- Variations are in the overall flow, not individual steps
- You prefer composition over inheritance

## Related Patterns

- **Strategy:** Varies entire algorithm; Template Method varies steps
- **Factory Method:** Often called within Template Method
- **Hook Methods:** Allow optional customization points
