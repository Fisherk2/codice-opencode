# Strategy Pattern

## Intent

Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.

## The Problem

You have multiple ways to perform an operation, and you need to:
- Switch between algorithms at runtime
- Avoid giant if/else or switch statements
- Add new algorithms without modifying existing code
- Test algorithms in isolation

### Before: The Mess

```typescript
class PaymentProcessor {
  processPayment(amount: number, method: string, details: any) {
    if (method === 'credit_card') {
      // 50 lines of credit card logic
      console.log(`Processing $${amount} via credit card ${details.cardNumber}`);
      // validate card, check expiry, call payment gateway...
    } else if (method === 'paypal') {
      // 40 lines of PayPal logic
      console.log(`Processing $${amount} via PayPal ${details.email}`);
      // redirect to PayPal, handle callback...
    } else if (method === 'crypto') {
      // 60 lines of crypto logic
      console.log(`Processing $${amount} via crypto wallet ${details.wallet}`);
      // validate wallet, check blockchain...
    } else if (method === 'bank_transfer') {
      // More logic...
    }
    // This class grows forever, violates Open-Closed Principle
  }
}
```

**Problems:**
- Adding Apple Pay means editing this class
- Can't test credit card logic without the whole class
- PaymentProcessor knows too much about each payment method
- Violations compound over time

## The Solution

Encapsulate each algorithm in its own class implementing a common interface.

```typescript
// Strategy interface
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
  validate(): boolean;
}

// Concrete strategies
class CreditCardStrategy implements PaymentStrategy {
  constructor(
    private cardNumber: string,
    private expiry: string,
    private cvv: string
  ) {}

  validate(): boolean {
    return this.luhnCheck(this.cardNumber) && this.isNotExpired();
  }

  async pay(amount: number): Promise<PaymentResult> {
    if (!this.validate()) {
      return { success: false, error: 'Invalid card' };
    }
    // Credit card specific logic isolated here
    const response = await this.callPaymentGateway(amount);
    return { success: true, transactionId: response.id };
  }

  private luhnCheck(cardNumber: string): boolean {
    // Luhn algorithm implementation
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  private isNotExpired(): boolean {
    const [month, year] = this.expiry.split('/');
    const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    return expDate > new Date();
  }

  private async callPaymentGateway(amount: number): Promise<{ id: string }> {
    // Stripe/Braintree API call
    return { id: `cc_${Date.now()}` };
  }
}

class PayPalStrategy implements PaymentStrategy {
  constructor(private email: string) {}

  validate(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  async pay(amount: number): Promise<PaymentResult> {
    // PayPal specific logic
    const redirectUrl = await this.initiatePayPalPayment(amount);
    return { success: true, redirectUrl };
  }

  private async initiatePayPalPayment(amount: number): Promise<string> {
    return `https://paypal.com/pay?amount=${amount}&merchant=xxx`;
  }
}

class CryptoStrategy implements PaymentStrategy {
  constructor(
    private walletAddress: string,
    private currency: 'BTC' | 'ETH' | 'USDC'
  ) {}

  validate(): boolean {
    // Wallet address validation per currency
    if (this.currency === 'ETH') {
      return /^0x[a-fA-F0-9]{40}$/.test(this.walletAddress);
    }
    return this.walletAddress.length > 20;
  }

  async pay(amount: number): Promise<PaymentResult> {
    const cryptoAmount = await this.convertToCrypto(amount);
    return {
      success: true,
      walletAddress: this.walletAddress,
      cryptoAmount,
      currency: this.currency
    };
  }

  private async convertToCrypto(usdAmount: number): Promise<number> {
    // Call exchange rate API
    const rates = { BTC: 0.000024, ETH: 0.00041, USDC: 1 };
    return usdAmount * rates[this.currency];
  }
}

// Context - uses strategies
class PaymentProcessor {
  async processPayment(
    amount: number,
    strategy: PaymentStrategy
  ): Promise<PaymentResult> {
    if (!strategy.validate()) {
      return { success: false, error: 'Validation failed' };
    }
    return strategy.pay(amount);
  }
}

// Usage
const processor = new PaymentProcessor();

// Credit card payment
const creditCard = new CreditCardStrategy('4111111111111111', '12/25', '123');
await processor.processPayment(99.99, creditCard);

// Switch to PayPal at runtime - no code changes to processor
const paypal = new PayPalStrategy('user@example.com');
await processor.processPayment(99.99, paypal);

// Add new payment method - just create new strategy class
const crypto = new CryptoStrategy('0x742d35Cc6634C0532925a3b844Bc9e7595f...', 'ETH');
await processor.processPayment(99.99, crypto);
```

## Structure

```
┌─────────────────┐         ┌──────────────────────┐
│     Context     │────────▶│   Strategy Interface │
│                 │         └──────────────────────┘
│ - strategy      │                    △
│ + setStrategy() │                    │
│ + execute()     │         ┌──────────┴──────────┐
└─────────────────┘         │                     │
                    ┌───────┴───────┐    ┌────────┴────────┐
                    │ ConcreteStratA │    │ ConcreteStratB  │
                    │ + algorithm()  │    │ + algorithm()   │
                    └────────────────┘    └─────────────────┘
```

## JavaScript/TypeScript Considerations

### Using Functions as Strategies

In JS/TS, you don't always need classes. Functions work great:

```typescript
// Strategy as function type
type SortStrategy<T> = (items: T[]) => T[];

// Concrete strategies as functions
const quickSort: SortStrategy<number> = (items) => {
  if (items.length <= 1) return items;
  const pivot = items[0];
  const left = items.slice(1).filter(x => x < pivot);
  const right = items.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
};

const bubbleSort: SortStrategy<number> = (items) => {
  const arr = [...items];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
};

// Context
class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}

  setStrategy(strategy: SortStrategy<T>) {
    this.strategy = strategy;
  }

  sort(items: T[]): T[] {
    return this.strategy(items);
  }
}

// Usage
const sorter = new Sorter(quickSort);
sorter.sort([3, 1, 4, 1, 5, 9, 2, 6]);

// Switch strategy
sorter.setStrategy(bubbleSort);
```

### Strategy with Dependency Injection

This is how Strategy naturally integrates with DI:

```typescript
// strategies/validation.ts
interface ValidationStrategy {
  validate(data: unknown): ValidationResult;
}

class StrictValidation implements ValidationStrategy {
  validate(data: unknown): ValidationResult {
    // Thorough validation
  }
}

class LenientValidation implements ValidationStrategy {
  validate(data: unknown): ValidationResult {
    // Basic validation only
  }
}

// service.ts
class UserService {
  constructor(private validator: ValidationStrategy) {} // Injected

  createUser(data: UserInput) {
    const result = this.validator.validate(data);
    if (!result.valid) throw new ValidationError(result.errors);
    // Create user...
  }
}

// Dependency injection container decides which strategy
// Production: StrictValidation
// Development: LenientValidation
```

### Strategy with Higher-Order Functions

```typescript
// Compression strategies
type CompressionStrategy = (data: Buffer) => Promise<Buffer>;

const gzipCompress: CompressionStrategy = async (data) => {
  const zlib = await import('zlib');
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const noCompress: CompressionStrategy = async (data) => data;

// Higher-order function that uses strategy
function createFileWriter(compress: CompressionStrategy) {
  return async function writeFile(path: string, data: Buffer) {
    const processed = await compress(data);
    await fs.promises.writeFile(path, processed);
  };
}

// Create specialized writers
const writeCompressed = createFileWriter(gzipCompress);
const writeRaw = createFileWriter(noCompress);
```

## Real-World Applications

### 1. Authentication Strategies (Passport.js style)

```typescript
interface AuthStrategy {
  authenticate(req: Request): Promise<User | null>;
}

class JWTStrategy implements AuthStrategy {
  constructor(private secret: string) {}

  async authenticate(req: Request): Promise<User | null> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const payload = jwt.verify(token, this.secret) as JWTPayload;
      return await User.findById(payload.userId);
    } catch {
      return null;
    }
  }
}

class OAuth2Strategy implements AuthStrategy {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private provider: 'google' | 'github'
  ) {}

  async authenticate(req: Request): Promise<User | null> {
    const code = req.query.code as string;
    const token = await this.exchangeCodeForToken(code);
    const profile = await this.fetchUserProfile(token);
    return await User.findOrCreateFromOAuth(this.provider, profile);
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    // OAuth token exchange
  }

  private async fetchUserProfile(token: string): Promise<OAuthProfile> {
    // Fetch from provider
  }
}

class APIKeyStrategy implements AuthStrategy {
  async authenticate(req: Request): Promise<User | null> {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) return null;
    return await User.findByAPIKey(apiKey);
  }
}

// Auth middleware uses strategies
class AuthMiddleware {
  private strategies: Map<string, AuthStrategy> = new Map();

  use(name: string, strategy: AuthStrategy) {
    this.strategies.set(name, strategy);
  }

  authenticate(strategyName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) throw new Error(`Unknown strategy: ${strategyName}`);

      const user = await strategy.authenticate(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      req.user = user;
      next();
    };
  }
}

// Setup
const auth = new AuthMiddleware();
auth.use('jwt', new JWTStrategy(process.env.JWT_SECRET!));
auth.use('google', new OAuth2Strategy(GOOGLE_ID, GOOGLE_SECRET, 'google'));
auth.use('api-key', new APIKeyStrategy());

// Routes use different strategies
app.get('/api/users', auth.authenticate('jwt'), usersController);
app.get('/auth/google/callback', auth.authenticate('google'), oauthCallback);
app.get('/api/webhook', auth.authenticate('api-key'), webhookHandler);
```

### 2. Pricing Strategies

```typescript
interface PricingStrategy {
  calculatePrice(basePrice: number, context: PricingContext): number;
}

interface PricingContext {
  quantity: number;
  customerType: 'regular' | 'premium' | 'wholesale';
  date: Date;
}

class RegularPricing implements PricingStrategy {
  calculatePrice(basePrice: number, ctx: PricingContext): number {
    return basePrice * ctx.quantity;
  }
}

class BulkDiscountPricing implements PricingStrategy {
  calculatePrice(basePrice: number, ctx: PricingContext): number {
    let discount = 0;
    if (ctx.quantity >= 100) discount = 0.2;
    else if (ctx.quantity >= 50) discount = 0.15;
    else if (ctx.quantity >= 10) discount = 0.1;

    return basePrice * ctx.quantity * (1 - discount);
  }
}

class SeasonalPricing implements PricingStrategy {
  constructor(
    private baseStrategy: PricingStrategy,
    private seasonalMultipliers: Map<number, number> // month -> multiplier
  ) {}

  calculatePrice(basePrice: number, ctx: PricingContext): number {
    const month = ctx.date.getMonth();
    const multiplier = this.seasonalMultipliers.get(month) ?? 1;
    const baseCalculation = this.baseStrategy.calculatePrice(basePrice, ctx);
    return baseCalculation * multiplier;
  }
}

// Combine strategies (Strategy + Decorator)
class PremiumCustomerPricing implements PricingStrategy {
  constructor(private baseStrategy: PricingStrategy) {}

  calculatePrice(basePrice: number, ctx: PricingContext): number {
    const base = this.baseStrategy.calculatePrice(basePrice, ctx);
    return ctx.customerType === 'premium' ? base * 0.9 : base;
  }
}

// Usage
const holidayMultipliers = new Map([[11, 1.2], [12, 1.3]]); // Nov, Dec markup

const pricingStrategy = new PremiumCustomerPricing(
  new SeasonalPricing(
    new BulkDiscountPricing(),
    holidayMultipliers
  )
);

const price = pricingStrategy.calculatePrice(10, {
  quantity: 50,
  customerType: 'premium',
  date: new Date('2024-12-15')
});
```

### 3. Data Export Strategies

```typescript
interface ExportStrategy {
  export(data: Record<string, unknown>[]): string;
  contentType: string;
  fileExtension: string;
}

class JSONExport implements ExportStrategy {
  contentType = 'application/json';
  fileExtension = 'json';

  export(data: Record<string, unknown>[]): string {
    return JSON.stringify(data, null, 2);
  }
}

class CSVExport implements ExportStrategy {
  contentType = 'text/csv';
  fileExtension = 'csv';

  export(data: Record<string, unknown>[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(h => this.escapeCSV(String(row[h] ?? ''))).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

class XMLExport implements ExportStrategy {
  contentType = 'application/xml';
  fileExtension = 'xml';

  export(data: Record<string, unknown>[]): string {
    const items = data.map(row => {
      const fields = Object.entries(row)
        .map(([key, value]) => `    <${key}>${this.escapeXML(String(value))}</${key}>`)
        .join('\n');
      return `  <item>\n${fields}\n  </item>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${items}\n</data>`;
  }

  private escapeXML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Export service
class DataExporter {
  private strategies: Map<string, ExportStrategy> = new Map([
    ['json', new JSONExport()],
    ['csv', new CSVExport()],
    ['xml', new XMLExport()],
  ]);

  export(format: string, data: Record<string, unknown>[]): ExportResult {
    const strategy = this.strategies.get(format);
    if (!strategy) {
      throw new Error(`Unsupported format: ${format}`);
    }

    return {
      content: strategy.export(data),
      contentType: strategy.contentType,
      filename: `export-${Date.now()}.${strategy.fileExtension}`
    };
  }

  // Easy to add new formats
  registerFormat(name: string, strategy: ExportStrategy) {
    this.strategies.set(name, strategy);
  }
}
```

## When to Use

**Use Strategy when:**
- You have multiple algorithms for a specific task
- You need to switch algorithms at runtime
- You want to avoid conditional statements for selecting behavior
- You want to isolate algorithm-specific code for testing

**Don't use Strategy when:**
- You have only one algorithm (YAGNI)
- The algorithms rarely change
- The overhead of extra classes isn't justified

## Related Patterns

- **State:** Similar structure, but State transitions automatically; Strategy is selected by client
- **Template Method:** Uses inheritance instead of composition
- **Decorator:** Can wrap strategies for additional behavior
- **Factory:** Often used to create appropriate strategy instances

## Testing Strategies

```typescript
describe('PaymentProcessor', () => {
  it('should process payment using provided strategy', async () => {
    // Mock strategy for testing
    const mockStrategy: PaymentStrategy = {
      validate: () => true,
      pay: jest.fn().mockResolvedValue({ success: true, transactionId: 'test123' })
    };

    const processor = new PaymentProcessor();
    const result = await processor.processPayment(100, mockStrategy);

    expect(result.success).toBe(true);
    expect(mockStrategy.pay).toHaveBeenCalledWith(100);
  });

  it('should fail if strategy validation fails', async () => {
    const invalidStrategy: PaymentStrategy = {
      validate: () => false,
      pay: jest.fn()
    };

    const processor = new PaymentProcessor();
    const result = await processor.processPayment(100, invalidStrategy);

    expect(result.success).toBe(false);
    expect(invalidStrategy.pay).not.toHaveBeenCalled();
  });
});

// Test strategies in isolation
describe('CreditCardStrategy', () => {
  it('should validate card numbers using Luhn algorithm', () => {
    const validCard = new CreditCardStrategy('4111111111111111', '12/30', '123');
    const invalidCard = new CreditCardStrategy('1234567890123456', '12/30', '123');

    expect(validCard.validate()).toBe(true);
    expect(invalidCard.validate()).toBe(false);
  });
});
```
