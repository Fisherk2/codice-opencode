# Factory Pattern

## Intent

Encapsulate object creation, allowing subclasses or configuration to determine which class to instantiate. Factory patterns decouple the code that uses objects from the code that creates them.

## Factory Variants

There are three levels of factory patterns:

1. **Simple Factory** - A function/class that creates objects (not a true GoF pattern, but useful)
2. **Factory Method** - Subclasses decide which class to instantiate
3. **Abstract Factory** - Create families of related objects

## The Problem

Object creation is scattered and coupled:

```typescript
class OrderProcessor {
  processOrder(order: Order) {
    let notification;

    // Creation logic scattered everywhere
    if (order.customer.prefersEmail) {
      notification = new EmailNotification(
        order.customer.email,
        this.getEmailTemplate(),
        this.getEmailConfig()
      );
    } else if (order.customer.prefersSMS) {
      notification = new SMSNotification(
        order.customer.phone,
        this.getSMSGateway()
      );
    } else if (order.customer.prefersPush) {
      notification = new PushNotification(
        order.customer.deviceToken,
        this.getPushService()
      );
    }

    notification.send(`Order ${order.id} confirmed!`);
  }
}

// Same creation logic duplicated in ShippingService, RefundService, etc.
```

**Problems:**
- Creation logic duplicated across codebase
- Adding Slack notifications means editing multiple classes
- Hard to test - can't easily swap in mock notifications
- OrderProcessor knows too much about notification details

## Simple Factory

Extract creation into a dedicated function or class:

```typescript
// Simple factory function
function createNotification(customer: Customer): Notification {
  if (customer.prefersEmail) {
    return new EmailNotification(customer.email);
  }
  if (customer.prefersSMS) {
    return new SMSNotification(customer.phone);
  }
  if (customer.prefersPush) {
    return new PushNotification(customer.deviceToken);
  }
  // Default
  return new EmailNotification(customer.email);
}

// Or as a class with static method
class NotificationFactory {
  static create(customer: Customer, config: NotificationConfig): Notification {
    switch (customer.preferredChannel) {
      case 'email':
        return new EmailNotification(customer.email, config.email);
      case 'sms':
        return new SMSNotification(customer.phone, config.sms);
      case 'push':
        return new PushNotification(customer.deviceToken, config.push);
      case 'slack':
        return new SlackNotification(customer.slackId, config.slack);
      default:
        throw new Error(`Unknown channel: ${customer.preferredChannel}`);
    }
  }
}

// Usage - creation centralized
class OrderProcessor {
  constructor(private notificationConfig: NotificationConfig) {}

  processOrder(order: Order) {
    const notification = NotificationFactory.create(
      order.customer,
      this.notificationConfig
    );
    notification.send(`Order ${order.id} confirmed!`);
  }
}
```

## Factory Method Pattern

Let subclasses decide which class to instantiate. The factory method is defined in a base class but implemented by subclasses.

```typescript
// Product interface
interface Document {
  open(): void;
  save(): void;
  render(): string;
}

// Concrete products
class PDFDocument implements Document {
  constructor(private content: string) {}

  open() { console.log('Opening PDF viewer...'); }
  save() { console.log('Saving as .pdf'); }
  render() { return `[PDF] ${this.content}`; }
}

class WordDocument implements Document {
  constructor(private content: string) {}

  open() { console.log('Opening Word processor...'); }
  save() { console.log('Saving as .docx'); }
  render() { return `[DOCX] ${this.content}`; }
}

class HTMLDocument implements Document {
  constructor(private content: string) {}

  open() { console.log('Opening browser...'); }
  save() { console.log('Saving as .html'); }
  render() { return `<html><body>${this.content}</body></html>`; }
}

// Creator with factory method
abstract class DocumentCreator {
  // Factory method - subclasses implement this
  abstract createDocument(content: string): Document;

  // Template method that uses the factory
  generateReport(data: ReportData): Document {
    const content = this.formatReportData(data);
    const doc = this.createDocument(content); // Factory method called here

    // Common operations
    console.log(`Created document: ${doc.render().substring(0, 50)}...`);
    return doc;
  }

  private formatReportData(data: ReportData): string {
    return `Report: ${data.title}\n${data.content}`;
  }
}

// Concrete creators
class PDFReportCreator extends DocumentCreator {
  createDocument(content: string): Document {
    return new PDFDocument(content);
  }
}

class WordReportCreator extends DocumentCreator {
  createDocument(content: string): Document {
    return new WordDocument(content);
  }
}

class WebReportCreator extends DocumentCreator {
  createDocument(content: string): Document {
    return new HTMLDocument(content);
  }
}

// Usage - client works with creator abstraction
function generateMonthlyReports(
  creator: DocumentCreator,
  data: ReportData[]
): Document[] {
  return data.map(d => creator.generateReport(d));
}

// Configuration determines which creator to use
const creator = process.env.OUTPUT_FORMAT === 'pdf'
  ? new PDFReportCreator()
  : new WebReportCreator();

const reports = generateMonthlyReports(creator, monthlyData);
```

## Abstract Factory Pattern

Create families of related objects without specifying their concrete classes.

```typescript
// Abstract products
interface Button {
  render(): string;
  onClick(handler: () => void): void;
}

interface Input {
  render(): string;
  getValue(): string;
  setValue(value: string): void;
}

interface Modal {
  render(): string;
  open(): void;
  close(): void;
}

// Abstract factory
interface UIComponentFactory {
  createButton(label: string): Button;
  createInput(placeholder: string): Input;
  createModal(title: string): Modal;
}

// Material Design family
class MaterialButton implements Button {
  constructor(private label: string) {}
  render() { return `<button class="mdc-button">${this.label}</button>`; }
  onClick(handler: () => void) { /* Material ripple effect + handler */ }
}

class MaterialInput implements Input {
  private value = '';
  constructor(private placeholder: string) {}
  render() { return `<input class="mdc-text-field" placeholder="${this.placeholder}">`; }
  getValue() { return this.value; }
  setValue(value: string) { this.value = value; }
}

class MaterialModal implements Modal {
  constructor(private title: string) {}
  render() { return `<div class="mdc-dialog"><h2>${this.title}</h2></div>`; }
  open() { console.log('Opening with Material animation'); }
  close() { console.log('Closing with Material animation'); }
}

class MaterialUIFactory implements UIComponentFactory {
  createButton(label: string) { return new MaterialButton(label); }
  createInput(placeholder: string) { return new MaterialInput(placeholder); }
  createModal(title: string) { return new MaterialModal(title); }
}

// Bootstrap family
class BootstrapButton implements Button {
  constructor(private label: string) {}
  render() { return `<button class="btn btn-primary">${this.label}</button>`; }
  onClick(handler: () => void) { /* Bootstrap click handling */ }
}

class BootstrapInput implements Input {
  private value = '';
  constructor(private placeholder: string) {}
  render() { return `<input class="form-control" placeholder="${this.placeholder}">`; }
  getValue() { return this.value; }
  setValue(value: string) { this.value = value; }
}

class BootstrapModal implements Modal {
  constructor(private title: string) {}
  render() { return `<div class="modal"><div class="modal-header">${this.title}</div></div>`; }
  open() { console.log('Opening with Bootstrap fade'); }
  close() { console.log('Closing with Bootstrap fade'); }
}

class BootstrapUIFactory implements UIComponentFactory {
  createButton(label: string) { return new BootstrapButton(label); }
  createInput(placeholder: string) { return new BootstrapInput(placeholder); }
  createModal(title: string) { return new BootstrapModal(title); }
}

// Client code works with abstract factory
class LoginForm {
  private usernameInput: Input;
  private passwordInput: Input;
  private submitButton: Button;
  private errorModal: Modal;

  constructor(factory: UIComponentFactory) {
    // All components from same family - consistent look and feel
    this.usernameInput = factory.createInput('Username');
    this.passwordInput = factory.createInput('Password');
    this.submitButton = factory.createButton('Login');
    this.errorModal = factory.createModal('Login Error');
  }

  render(): string {
    return `
      <form>
        ${this.usernameInput.render()}
        ${this.passwordInput.render()}
        ${this.submitButton.render()}
      </form>
      ${this.errorModal.render()}
    `;
  }
}

// Switch entire UI family with one change
const uiFactory = process.env.UI_FRAMEWORK === 'material'
  ? new MaterialUIFactory()
  : new BootstrapUIFactory();

const loginForm = new LoginForm(uiFactory);
```

## JavaScript/TypeScript Patterns

### Factory Functions (Most Common in JS)

```typescript
// Factory function - simple and effective
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

function createUser(
  name: string,
  email: string,
  role: User['role'] = 'user'
): User {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    createdAt: new Date()
  };
}

// With private state using closures
function createCounter(initialValue = 0) {
  let count = initialValue;

  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getValue() { return count; },
    reset() { count = initialValue; return count; }
  };
}

const counter = createCounter(10);
counter.increment(); // 11
counter.getValue();  // 11
// count is private - can't be accessed directly
```

### Async Factory

```typescript
// Factory that performs async initialization
interface DatabaseConnection {
  query(sql: string): Promise<any>;
  close(): Promise<void>;
}

async function createDatabaseConnection(
  config: DatabaseConfig
): Promise<DatabaseConnection> {
  const pool = new Pool(config);

  // Verify connection works
  await pool.query('SELECT 1');

  console.log('Database connection established');

  return {
    async query(sql: string) {
      return pool.query(sql);
    },
    async close() {
      await pool.end();
      console.log('Database connection closed');
    }
  };
}

// Usage
const db = await createDatabaseConnection({
  host: 'localhost',
  database: 'myapp'
});
```

### Registry-Based Factory

```typescript
// Extensible factory using registry pattern
type Constructor<T> = new (...args: any[]) => T;

class ShapeFactory {
  private static registry = new Map<string, Constructor<Shape>>();

  static register(name: string, constructor: Constructor<Shape>) {
    this.registry.set(name, constructor);
  }

  static create(name: string, ...args: any[]): Shape {
    const Constructor = this.registry.get(name);
    if (!Constructor) {
      throw new Error(`Unknown shape: ${name}`);
    }
    return new Constructor(...args);
  }

  static getRegisteredShapes(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Register shapes
ShapeFactory.register('circle', Circle);
ShapeFactory.register('rectangle', Rectangle);
ShapeFactory.register('triangle', Triangle);

// Plugin can add new shapes
ShapeFactory.register('star', StarShape);

// Usage
const shape = ShapeFactory.create('circle', { radius: 5 });
const star = ShapeFactory.create('star', { points: 5, size: 10 });
```

### Configuration-Driven Factory

```typescript
interface ServiceConfig {
  type: 'memory' | 'redis' | 'dynamodb';
  options?: Record<string, any>;
}

interface CacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class CacheFactory {
  static async create(config: ServiceConfig): Promise<CacheService> {
    switch (config.type) {
      case 'memory':
        return new MemoryCache();

      case 'redis':
        const redis = new RedisCache(config.options?.url);
        await redis.connect();
        return redis;

      case 'dynamodb':
        return new DynamoDBCache(
          config.options?.tableName,
          config.options?.region
        );

      default:
        throw new Error(`Unknown cache type: ${config.type}`);
    }
  }
}

// Config-driven instantiation
const cacheConfig: ServiceConfig = JSON.parse(
  process.env.CACHE_CONFIG || '{"type":"memory"}'
);

const cache = await CacheFactory.create(cacheConfig);
```

## Real-World Applications

### 1. API Client Factory

```typescript
interface APIClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: unknown): Promise<T>;
  put<T>(path: string, data: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    credentials: string;
  };
}

function createAPIClient(config: APIClientConfig): APIClient {
  const { baseURL, timeout = 30000, headers = {}, retries = 3, auth } = config;

  // Build auth header
  const authHeader: Record<string, string> = {};
  if (auth) {
    switch (auth.type) {
      case 'bearer':
        authHeader['Authorization'] = `Bearer ${auth.credentials}`;
        break;
      case 'basic':
        authHeader['Authorization'] = `Basic ${auth.credentials}`;
        break;
      case 'api-key':
        authHeader['X-API-Key'] = auth.credentials;
        break;
    }
  }

  const defaultHeaders = { ...headers, ...authHeader };

  async function request<T>(
    method: string,
    path: string,
    data?: unknown
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${baseURL}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new APIError(response.status, await response.text());
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, data: unknown) => request<T>('POST', path, data),
    put: <T>(path: string, data: unknown) => request<T>('PUT', path, data),
    delete: (path: string) => request<void>('DELETE', path)
  };
}

// Create specialized clients
const stripeClient = createAPIClient({
  baseURL: 'https://api.stripe.com/v1',
  auth: { type: 'bearer', credentials: process.env.STRIPE_SECRET! }
});

const githubClient = createAPIClient({
  baseURL: 'https://api.github.com',
  auth: { type: 'bearer', credentials: process.env.GITHUB_TOKEN! },
  headers: { 'Accept': 'application/vnd.github.v3+json' }
});

const internalAPI = createAPIClient({
  baseURL: process.env.API_URL!,
  auth: { type: 'api-key', credentials: process.env.API_KEY! },
  retries: 5
});
```

### 2. Logger Factory

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(message: string, meta?: object): void;
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
  child(context: object): Logger;
}

interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  destination: 'console' | 'file' | 'remote';
  context?: Record<string, unknown>;
}

function createLogger(config: LoggerConfig): Logger {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  const shouldLog = (level: LogLevel) =>
    levels[level] >= levels[config.level];

  const formatMessage = (
    level: LogLevel,
    message: string,
    meta?: object
  ): string => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...config.context,
      ...meta
    };

    if (config.format === 'json') {
      return JSON.stringify(entry);
    }

    // Pretty format
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  };

  const write = (formatted: string, level: LogLevel) => {
    switch (config.destination) {
      case 'console':
        if (level === 'error') console.error(formatted);
        else if (level === 'warn') console.warn(formatted);
        else console.log(formatted);
        break;
      case 'file':
        // Append to file
        fs.appendFileSync('app.log', formatted + '\n');
        break;
      case 'remote':
        // Send to logging service
        fetch(process.env.LOG_ENDPOINT!, {
          method: 'POST',
          body: formatted
        }).catch(() => {}); // Fire and forget
        break;
    }
  };

  const log = (level: LogLevel, message: string, meta?: object) => {
    if (shouldLog(level)) {
      write(formatMessage(level, message, meta), level);
    }
  };

  return {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    child: (context) => createLogger({
      ...config,
      context: { ...config.context, ...context }
    })
  };
}

// Create loggers
const logger = createLogger({
  level: process.env.LOG_LEVEL as LogLevel || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  destination: process.env.NODE_ENV === 'production' ? 'remote' : 'console'
});

// Child loggers with context
const requestLogger = logger.child({ component: 'http' });
const dbLogger = logger.child({ component: 'database' });

requestLogger.info('Request received', { method: 'GET', path: '/users' });
dbLogger.debug('Query executed', { sql: 'SELECT * FROM users', duration: 15 });
```

### 3. Test Data Factory (Builder + Factory)

```typescript
class UserFactory {
  private data: Partial<User> = {};

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withRole(role: User['role']): this {
    this.data.role = role;
    return this;
  }

  admin(): this {
    this.data.role = 'admin';
    return this;
  }

  verified(): this {
    this.data.emailVerified = true;
    return this;
  }

  build(): User {
    return {
      id: this.data.id ?? crypto.randomUUID(),
      name: this.data.name ?? faker.person.fullName(),
      email: this.data.email ?? faker.internet.email(),
      role: this.data.role ?? 'user',
      emailVerified: this.data.emailVerified ?? false,
      createdAt: this.data.createdAt ?? new Date()
    };
  }

  async create(): Promise<User> {
    const user = this.build();
    await db.users.insert(user);
    return user;
  }

  static make(): UserFactory {
    return new UserFactory();
  }
}

// Usage in tests
describe('UserService', () => {
  it('should allow admin to delete users', async () => {
    const admin = await UserFactory.make().admin().verified().create();
    const targetUser = await UserFactory.make().create();

    const result = await userService.deleteUser(admin.id, targetUser.id);

    expect(result.success).toBe(true);
  });

  it('should not allow regular users to delete others', async () => {
    const regularUser = await UserFactory.make().create();
    const targetUser = await UserFactory.make().create();

    await expect(
      userService.deleteUser(regularUser.id, targetUser.id)
    ).rejects.toThrow('Unauthorized');
  });
});
```

## When to Use

**Simple Factory:**
- Centralize creation logic that's duplicated
- Object creation involves complex logic
- You want to hide implementation details

**Factory Method:**
- A class can't anticipate the objects it needs to create
- Subclasses should specify what to create
- You want to localize knowledge of which class gets created

**Abstract Factory:**
- Create families of related objects
- Ensure objects from same family are used together
- Want to provide a library of products revealing only interfaces

## Related Patterns

- **Builder:** Step-by-step construction vs all-at-once
- **Prototype:** Clone instead of new
- **Singleton:** Factory that returns same instance
- **Dependency Injection:** Often uses factories internally
