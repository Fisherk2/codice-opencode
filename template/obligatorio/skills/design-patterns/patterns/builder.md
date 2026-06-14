# Builder Pattern

## Intent

Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

## The Problem

Complex object construction with many optional parameters:
- Constructor with 10+ parameters
- Unclear which parameters are required
- Boolean parameters with unclear meaning
- Can't validate until all parameters set

```typescript
// Without Builder - constructor hell
const email = new Email(
  'Welcome!',                    // subject
  'Hello, welcome to our app',   // body
  'user@example.com',            // to
  'noreply@app.com',             // from
  null,                          // cc - what does null mean?
  null,                          // bcc
  true,                          // isHtml - which true is this?
  false,                         // requestReceipt
  'high',                        // priority
  [],                            // attachments
  null,                          // replyTo
  { 'X-Campaign': 'welcome' }    // headers
);
// Impossible to read, easy to get wrong
```

## The Solution

Create a builder with fluent interface:

```typescript
// Email built with fluent builder
const email = new EmailBuilder()
  .to('user@example.com')
  .from('noreply@app.com')
  .subject('Welcome!')
  .htmlBody('<h1>Hello!</h1><p>Welcome to our app.</p>')
  .priority('high')
  .header('X-Campaign', 'welcome')
  .build();
```

## Implementation

```typescript
interface Email {
  to: string[];
  cc: string[];
  bcc: string[];
  from: string;
  replyTo: string | null;
  subject: string;
  body: string;
  isHtml: boolean;
  priority: 'low' | 'normal' | 'high';
  attachments: Attachment[];
  headers: Record<string, string>;
}

class EmailBuilder {
  private email: Partial<Email> = {
    to: [],
    cc: [],
    bcc: [],
    isHtml: false,
    priority: 'normal',
    attachments: [],
    headers: {}
  };

  to(...addresses: string[]): this {
    this.email.to = [...this.email.to!, ...addresses];
    return this;
  }

  cc(...addresses: string[]): this {
    this.email.cc = [...this.email.cc!, ...addresses];
    return this;
  }

  bcc(...addresses: string[]): this {
    this.email.bcc = [...this.email.bcc!, ...addresses];
    return this;
  }

  from(address: string): this {
    this.email.from = address;
    return this;
  }

  replyTo(address: string): this {
    this.email.replyTo = address;
    return this;
  }

  subject(text: string): this {
    this.email.subject = text;
    return this;
  }

  textBody(text: string): this {
    this.email.body = text;
    this.email.isHtml = false;
    return this;
  }

  htmlBody(html: string): this {
    this.email.body = html;
    this.email.isHtml = true;
    return this;
  }

  priority(level: 'low' | 'normal' | 'high'): this {
    this.email.priority = level;
    return this;
  }

  attach(attachment: Attachment): this {
    this.email.attachments!.push(attachment);
    return this;
  }

  header(name: string, value: string): this {
    this.email.headers![name] = value;
    return this;
  }

  build(): Email {
    // Validate required fields
    if (!this.email.to?.length) {
      throw new Error('Email must have at least one recipient');
    }
    if (!this.email.from) {
      throw new Error('Email must have a sender');
    }
    if (!this.email.subject) {
      throw new Error('Email must have a subject');
    }
    if (!this.email.body) {
      throw new Error('Email must have a body');
    }

    return this.email as Email;
  }
}
```

## Query Builder

Common use in database queries:

```typescript
class QueryBuilder {
  private query: {
    select: string[];
    from: string;
    joins: string[];
    where: string[];
    orderBy: string[];
    limit: number | null;
    offset: number | null;
    params: any[];
  };

  constructor(table: string) {
    this.query = {
      select: ['*'],
      from: table,
      joins: [],
      where: [],
      orderBy: [],
      limit: null,
      offset: null,
      params: []
    };
  }

  select(...columns: string[]): this {
    this.query.select = columns;
    return this;
  }

  join(table: string, condition: string): this {
    this.query.joins.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): this {
    this.query.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  where(condition: string, ...params: any[]): this {
    this.query.where.push(condition);
    this.query.params.push(...params);
    return this;
  }

  andWhere(condition: string, ...params: any[]): this {
    return this.where(condition, ...params);
  }

  orWhere(condition: string, ...params: any[]): this {
    if (this.query.where.length > 0) {
      const last = this.query.where.pop()!;
      this.query.where.push(`(${last} OR ${condition})`);
    } else {
      this.query.where.push(condition);
    }
    this.query.params.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  offset(count: number): this {
    this.query.offset = count;
    return this;
  }

  toSQL(): { sql: string; params: any[] } {
    let sql = `SELECT ${this.query.select.join(', ')} FROM ${this.query.from}`;

    if (this.query.joins.length > 0) {
      sql += ` ${this.query.joins.join(' ')}`;
    }

    if (this.query.where.length > 0) {
      sql += ` WHERE ${this.query.where.join(' AND ')}`;
    }

    if (this.query.orderBy.length > 0) {
      sql += ` ORDER BY ${this.query.orderBy.join(', ')}`;
    }

    if (this.query.limit !== null) {
      sql += ` LIMIT ${this.query.limit}`;
    }

    if (this.query.offset !== null) {
      sql += ` OFFSET ${this.query.offset}`;
    }

    return { sql, params: this.query.params };
  }

  async execute<T>(db: Database): Promise<T[]> {
    const { sql, params } = this.toSQL();
    return db.query<T>(sql, params);
  }
}

// Usage
const users = await new QueryBuilder('users')
  .select('users.id', 'users.name', 'orders.total')
  .leftJoin('orders', 'orders.user_id = users.id')
  .where('users.active = $1', true)
  .andWhere('users.created_at > $2', lastMonth)
  .orderBy('users.name', 'ASC')
  .limit(20)
  .execute<UserWithOrders>(db);
```

## Request Builder (HTTP Client)

```typescript
class RequestBuilder {
  private config: RequestConfig = {
    method: 'GET',
    headers: {},
    timeout: 30000
  };

  constructor(private baseUrl: string) {}

  get(path: string): this {
    this.config.method = 'GET';
    this.config.path = path;
    return this;
  }

  post(path: string): this {
    this.config.method = 'POST';
    this.config.path = path;
    return this;
  }

  put(path: string): this {
    this.config.method = 'PUT';
    this.config.path = path;
    return this;
  }

  delete(path: string): this {
    this.config.method = 'DELETE';
    this.config.path = path;
    return this;
  }

  header(name: string, value: string): this {
    this.config.headers[name] = value;
    return this;
  }

  bearerToken(token: string): this {
    return this.header('Authorization', `Bearer ${token}`);
  }

  contentType(type: string): this {
    return this.header('Content-Type', type);
  }

  json(data: any): this {
    this.config.body = JSON.stringify(data);
    return this.contentType('application/json');
  }

  formData(data: Record<string, string>): this {
    const form = new URLSearchParams(data);
    this.config.body = form.toString();
    return this.contentType('application/x-www-form-urlencoded');
  }

  query(params: Record<string, string | number>): this {
    this.config.queryParams = params;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  async send<T>(): Promise<T> {
    let url = `${this.baseUrl}${this.config.path}`;

    if (this.config.queryParams) {
      const params = new URLSearchParams(
        Object.entries(this.config.queryParams).map(([k, v]) => [k, String(v)])
      );
      url += `?${params}`;
    }

    const response = await fetch(url, {
      method: this.config.method,
      headers: this.config.headers,
      body: this.config.body,
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }
}

// Usage
const api = new RequestBuilder('https://api.example.com');

const user = await api
  .post('/users')
  .bearerToken(token)
  .json({ name: 'John', email: 'john@example.com' })
  .send<User>();

const products = await api
  .get('/products')
  .query({ category: 'electronics', limit: 10 })
  .send<Product[]>();
```

## Test Data Builder

```typescript
class UserBuilder {
  private user: Partial<User> = {
    id: generateId(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    verified: true,
    createdAt: new Date()
  };

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  asMember(): this {
    this.user.role = 'member';
    return this;
  }

  unverified(): this {
    this.user.verified = false;
    return this;
  }

  createdDaysAgo(days: number): this {
    const date = new Date();
    date.setDate(date.getDate() - days);
    this.user.createdAt = date;
    return this;
  }

  build(): User {
    return new User(
      this.user.id!,
      this.user.email!,
      this.user.name!,
      this.user.role!,
      this.user.verified!,
      this.user.createdAt!
    );
  }
}

// Usage in tests
describe('UserService', () => {
  it('should allow admin to delete users', async () => {
    const admin = new UserBuilder().asAdmin().build();
    const target = new UserBuilder().asMember().build();

    await userService.deleteUser(admin.id, target.id);
    expect(await userRepository.findById(target.id)).toBeNull();
  });

  it('should reject unverified users', async () => {
    const user = new UserBuilder().unverified().build();

    await expect(
      orderService.placeOrder(user.id, items)
    ).rejects.toThrow('User not verified');
  });
});
```

## Director Pattern

When same build steps are reused:

```typescript
class EmailDirector {
  constructor(private builder: EmailBuilder) {}

  createWelcomeEmail(user: User): Email {
    return this.builder
      .to(user.email)
      .from('welcome@app.com')
      .subject('Welcome to Our App!')
      .htmlBody(welcomeTemplate(user.name))
      .priority('normal')
      .header('X-Campaign', 'welcome')
      .build();
  }

  createPasswordResetEmail(user: User, resetLink: string): Email {
    return this.builder
      .to(user.email)
      .from('security@app.com')
      .subject('Password Reset Request')
      .htmlBody(passwordResetTemplate(user.name, resetLink))
      .priority('high')
      .header('X-Campaign', 'password-reset')
      .build();
  }

  createOrderConfirmation(user: User, order: Order): Email {
    return this.builder
      .to(user.email)
      .from('orders@app.com')
      .subject(`Order Confirmation #${order.id}`)
      .htmlBody(orderConfirmationTemplate(order))
      .attach(generateInvoicePdf(order))
      .build();
  }
}

// Usage
const director = new EmailDirector(new EmailBuilder());
const welcomeEmail = director.createWelcomeEmail(user);
await emailService.send(welcomeEmail);
```

## When to Use

**Use Builder when:**
- Object has many optional parameters
- Construction requires multiple steps
- You want readable, self-documenting code
- Same construction process for different representations

**Don't use Builder when:**
- Object is simple with few required parameters
- No optional parameters or variations
- Object can be created in one step

## Related Patterns

- **Factory:** Creates object in one step; Builder is multi-step
- **Prototype:** Clones existing objects instead of building
- **Fluent Interface:** Often used with Builder for chaining
