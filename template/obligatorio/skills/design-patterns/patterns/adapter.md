# Adapter Pattern

## Intent

Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.

## The Problem

You need to use an existing class, but its interface doesn't match what your code expects:
- Integrating third-party libraries
- Working with legacy systems
- Using APIs with different conventions
- Swapping implementations without changing client code

### Real Scenario

```typescript
// Your application expects this interface
interface PaymentGateway {
  charge(amount: number, currency: string, cardToken: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}

// But Stripe's SDK has a different interface
class Stripe {
  paymentIntents = {
    create: async (params: {
      amount: number;
      currency: string;
      payment_method: string;
      confirm: boolean;
    }) => { /* ... */ }
  };

  refunds = {
    create: async (params: {
      payment_intent: string;
      amount?: number;
    }) => { /* ... */ }
  };
}

// And PayPal has yet another interface
class PayPalClient {
  async createOrder(body: { purchase_units: Array<{ amount: { value: string } }> }) { /* ... */ }
  async captureOrder(orderId: string) { /* ... */ }
  async refundCapture(captureId: string, body: { amount: { value: string } }) { /* ... */ }
}
```

## The Solution

Create adapters that convert each external interface to your expected interface:

```typescript
// Your application's interface
interface PaymentGateway {
  charge(amount: number, currency: string, cardToken: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  error?: string;
}

interface RefundResult {
  success: boolean;
  refundId: string;
  error?: string;
}

// Stripe Adapter
class StripeAdapter implements PaymentGateway {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey);
  }

  async charge(amount: number, currency: string, cardToken: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
        payment_method: cardToken,
        confirm: true
      });

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id
      };
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        error: (error as Error).message
      };
    }
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: Math.round(amount * 100)
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        error: (error as Error).message
      };
    }
  }
}

// PayPal Adapter
class PayPalAdapter implements PaymentGateway {
  private client: PayPalClient;
  private captureIds: Map<string, string> = new Map(); // orderId -> captureId

  constructor(clientId: string, clientSecret: string) {
    this.client = new PayPalClient(clientId, clientSecret);
  }

  async charge(amount: number, currency: string, _cardToken: string): Promise<PaymentResult> {
    try {
      // PayPal flow is different - create order then capture
      const order = await this.client.createOrder({
        purchase_units: [{
          amount: {
            value: amount.toFixed(2),
            currency_code: currency.toUpperCase()
          }
        }]
      });

      const capture = await this.client.captureOrder(order.id);
      const captureId = capture.purchase_units[0].payments.captures[0].id;

      // Store mapping for refunds
      this.captureIds.set(order.id, captureId);

      return {
        success: capture.status === 'COMPLETED',
        transactionId: order.id
      };
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        error: (error as Error).message
      };
    }
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    try {
      const captureId = this.captureIds.get(transactionId);
      if (!captureId) {
        throw new Error('Capture ID not found for transaction');
      }

      const refund = await this.client.refundCapture(captureId, {
        amount: { value: amount.toFixed(2) }
      });

      return {
        success: refund.status === 'COMPLETED',
        refundId: refund.id
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        error: (error as Error).message
      };
    }
  }
}

// Usage - client code doesn't know or care which provider
class CheckoutService {
  constructor(private paymentGateway: PaymentGateway) {}

  async processPayment(cart: Cart, paymentMethod: string): Promise<Order> {
    const result = await this.paymentGateway.charge(
      cart.total,
      'USD',
      paymentMethod
    );

    if (!result.success) {
      throw new PaymentError(result.error);
    }

    return this.createOrder(cart, result.transactionId);
  }
}

// Configuration determines which adapter
const paymentGateway = process.env.PAYMENT_PROVIDER === 'stripe'
  ? new StripeAdapter(process.env.STRIPE_KEY!)
  : new PayPalAdapter(process.env.PAYPAL_ID!, process.env.PAYPAL_SECRET!);

const checkoutService = new CheckoutService(paymentGateway);
```

## Structure

```
┌─────────────────┐         ┌─────────────────┐
│     Client      │────────▶│     Target      │
└─────────────────┘         │   <<interface>> │
                            │ + request()     │
                            └────────┬────────┘
                                     △
                                     │
                            ┌────────┴────────┐
                            │     Adapter     │
                            │                 │
                            │ - adaptee       │──────┐
                            │ + request()     │      │
                            └─────────────────┘      │
                                                     ▼
                                            ┌─────────────────┐
                                            │     Adaptee     │
                                            │                 │
                                            │ + specificReq() │
                                            └─────────────────┘
```

## JavaScript/TypeScript Patterns

### Function Adapter

```typescript
// Old callback-based API
function readFileCallback(
  path: string,
  callback: (err: Error | null, data: string | null) => void
): void {
  fs.readFile(path, 'utf-8', callback);
}

// Adapt to Promise-based
function adaptToPromise<T>(
  callbackFn: (callback: (err: Error | null, result: T | null) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    callbackFn((err, result) => {
      if (err) reject(err);
      else resolve(result!);
    });
  });
}

// Usage
const readFileAsync = (path: string) =>
  adaptToPromise<string>((cb) => readFileCallback(path, cb));

// Generic promisify adapter
function promisify<T>(
  fn: (...args: [...any[], (err: Error | null, result: T) => void]) => void
): (...args: any[]) => Promise<T> {
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result: T) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

const readFile = promisify(fs.readFile);
const data = await readFile('file.txt', 'utf-8');
```

### Class Adapter (using inheritance)

```typescript
// Legacy logger with different interface
class LegacyLogger {
  writeLog(level: number, msg: string): void {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    console.log(`[${levels[level]}] ${msg}`);
  }
}

// Modern interface
interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// Class adapter - extends adaptee, implements target
class LoggerAdapter extends LegacyLogger implements Logger {
  debug(message: string): void {
    this.writeLog(0, message);
  }

  info(message: string): void {
    this.writeLog(1, message);
  }

  warn(message: string): void {
    this.writeLog(2, message);
  }

  error(message: string): void {
    this.writeLog(3, message);
  }
}
```

### Object Adapter (using composition - preferred)

```typescript
// Same scenario but using composition
class LoggerAdapter implements Logger {
  constructor(private legacyLogger: LegacyLogger) {}

  debug(message: string): void {
    this.legacyLogger.writeLog(0, message);
  }

  info(message: string): void {
    this.legacyLogger.writeLog(1, message);
  }

  warn(message: string): void {
    this.legacyLogger.writeLog(2, message);
  }

  error(message: string): void {
    this.legacyLogger.writeLog(3, message);
  }
}

// Usage
const legacyLogger = new LegacyLogger();
const logger: Logger = new LoggerAdapter(legacyLogger);
logger.info('This works with modern interface');
```

## Real-World Applications

### 1. Database Driver Adapter

```typescript
// Your application's interface
interface Database {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
  beginTransaction(): Promise<Transaction>;
}

interface Transaction {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// PostgreSQL Adapter (using pg library)
import { Pool, PoolClient } from 'pg';

class PostgresAdapter implements Database {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number }> {
    const result = await this.pool.query(sql, params);
    return { affectedRows: result.rowCount ?? 0 };
  }

  async beginTransaction(): Promise<Transaction> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return new PostgresTransaction(client);
  }
}

class PostgresTransaction implements Transaction {
  constructor(private client: PoolClient) {}

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number }> {
    const result = await this.client.query(sql, params);
    return { affectedRows: result.rowCount ?? 0 };
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT');
    this.client.release();
  }

  async rollback(): Promise<void> {
    await this.client.query('ROLLBACK');
    this.client.release();
  }
}

// MySQL Adapter (using mysql2)
import mysql from 'mysql2/promise';

class MySQLAdapter implements Database {
  private pool: mysql.Pool;

  constructor(config: mysql.PoolOptions) {
    this.pool = mysql.createPool(config);
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number }> {
    const [result] = await this.pool.execute(sql, params) as [mysql.ResultSetHeader, any];
    return { affectedRows: result.affectedRows };
  }

  async beginTransaction(): Promise<Transaction> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return new MySQLTransaction(connection);
  }
}

// Usage - swap databases without changing business logic
const db: Database = process.env.DB_TYPE === 'postgres'
  ? new PostgresAdapter(process.env.POSTGRES_URL!)
  : new MySQLAdapter({ uri: process.env.MYSQL_URL });

const users = await db.query<User>('SELECT * FROM users WHERE active = ?', [true]);
```

### 2. HTTP Client Adapter

```typescript
// Your application's HTTP interface
interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

// Fetch API Adapter
class FetchAdapter implements HttpClient {
  constructor(private baseURL: string = '') {}

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const fullUrl = new URL(url, this.baseURL);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        fullUrl.searchParams.append(key, value);
      });
    }

    const controller = new AbortController();
    const timeoutId = config?.timeout
      ? setTimeout(() => controller.abort(), config.timeout)
      : null;

    try {
      const response = await fetch(fullUrl.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new HttpError(response.status, await response.text());
      }

      return response.json();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

// Axios Adapter
import axios, { AxiosInstance } from 'axios';

class AxiosAdapter implements HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '') {
    this.client = axios.create({ baseURL });
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout
    });
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, {
      headers: config?.headers,
      timeout: config?.timeout
    });
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, {
      headers: config?.headers,
      timeout: config?.timeout
    });
    return response.data;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, {
      headers: config?.headers,
      timeout: config?.timeout
    });
    return response.data;
  }
}

// Usage
const httpClient: HttpClient = process.env.USE_AXIOS
  ? new AxiosAdapter('https://api.example.com')
  : new FetchAdapter('https://api.example.com');
```

### 3. Event System Adapter

```typescript
// Your application's event interface
interface EventBus {
  on<T>(event: string, handler: (data: T) => void): () => void;
  emit<T>(event: string, data: T): void;
  once<T>(event: string, handler: (data: T) => void): () => void;
}

// Adapt Node.js EventEmitter
import { EventEmitter } from 'events';

class NodeEventAdapter implements EventBus {
  private emitter = new EventEmitter();

  on<T>(event: string, handler: (data: T) => void): () => void {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }

  emit<T>(event: string, data: T): void {
    this.emitter.emit(event, data);
  }

  once<T>(event: string, handler: (data: T) => void): () => void {
    this.emitter.once(event, handler);
    return () => this.emitter.off(event, handler);
  }
}

// Adapt browser's window events
class BrowserEventAdapter implements EventBus {
  private handlers = new Map<string, Map<Function, EventListener>>();

  on<T>(event: string, handler: (data: T) => void): () => void {
    const listener = ((e: CustomEvent<T>) => handler(e.detail)) as EventListener;

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Map());
    }
    this.handlers.get(event)!.set(handler, listener);

    window.addEventListener(event, listener);
    return () => {
      window.removeEventListener(event, listener);
      this.handlers.get(event)?.delete(handler);
    };
  }

  emit<T>(event: string, data: T): void {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  once<T>(event: string, handler: (data: T) => void): () => void {
    const unsubscribe = this.on<T>(event, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }
}

// Adapt Redis Pub/Sub
import Redis from 'ioredis';

class RedisEventAdapter implements EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers = new Map<string, Set<Function>>();

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.subscriber.on('message', (channel, message) => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        const data = JSON.parse(message);
        handlers.forEach(handler => handler(data));
      }
    });
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
      this.subscriber.subscribe(event);
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
          this.subscriber.unsubscribe(event);
        }
      }
    };
  }

  emit<T>(event: string, data: T): void {
    this.publisher.publish(event, JSON.stringify(data));
  }

  once<T>(event: string, handler: (data: T) => void): () => void {
    const unsubscribe = this.on<T>(event, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }
}
```

## When to Use

**Use Adapter when:**
- You want to use an existing class with an incompatible interface
- You need to create a reusable class that cooperates with unrelated classes
- You're integrating third-party libraries
- You need to swap implementations without changing client code

**Don't use Adapter when:**
- The interfaces are similar enough to not need adaptation
- You can modify the source class directly
- The adaptation is trivial and doesn't justify a new class

## Related Patterns

- **Bridge:** Separates abstraction from implementation upfront; Adapter retrofits
- **Decorator:** Enhances without changing interface; Adapter changes interface
- **Facade:** Defines a new simpler interface; Adapter makes existing interface usable
- **Proxy:** Same interface; Adapter different interface
