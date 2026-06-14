# Chain of Responsibility Pattern

## Intent

Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along until an object handles it.

## The Problem

Hardcoded handler logic:
- Sender must know which handler to call
- Adding new handlers requires modifying sender
- Complex if/else or switch chains
- Tight coupling between request and handler

```typescript
// Without Chain - hardcoded handling
class SupportTicketHandler {
  handleTicket(ticket: Ticket): void {
    if (ticket.type === 'billing') {
      // Handle billing
      this.billingDepartment.handle(ticket);
    } else if (ticket.type === 'technical' && ticket.severity === 'critical') {
      // Handle critical tech issues
      this.seniorEngineer.handle(ticket);
    } else if (ticket.type === 'technical') {
      // Handle regular tech issues
      this.techSupport.handle(ticket);
    } else if (ticket.type === 'general') {
      // Handle general inquiries
      this.customerService.handle(ticket);
    } else {
      // Fallback
      this.manager.handle(ticket);
    }
    // Adding new type requires modifying this class
  }
}
```

## The Solution

Create a chain of handlers, each deciding whether to process or pass along:

```typescript
// Handler interface
interface Handler<T> {
  setNext(handler: Handler<T>): Handler<T>;
  handle(request: T): void;
}

// Base handler with chaining logic
abstract class BaseHandler<T> implements Handler<T> {
  private nextHandler: Handler<T> | null = null;

  setNext(handler: Handler<T>): Handler<T> {
    this.nextHandler = handler;
    return handler;
  }

  handle(request: T): void {
    if (this.canHandle(request)) {
      this.process(request);
    } else if (this.nextHandler) {
      this.nextHandler.handle(request);
    } else {
      this.handleUnprocessed(request);
    }
  }

  protected abstract canHandle(request: T): boolean;
  protected abstract process(request: T): void;

  protected handleUnprocessed(request: T): void {
    console.log('No handler found for request');
  }
}

// Concrete handlers
class BillingHandler extends BaseHandler<Ticket> {
  protected canHandle(ticket: Ticket): boolean {
    return ticket.type === 'billing';
  }

  protected process(ticket: Ticket): void {
    console.log(`Billing department handling ticket: ${ticket.id}`);
    // Process billing issue
  }
}

class CriticalTechHandler extends BaseHandler<Ticket> {
  protected canHandle(ticket: Ticket): boolean {
    return ticket.type === 'technical' && ticket.severity === 'critical';
  }

  protected process(ticket: Ticket): void {
    console.log(`Senior engineer handling critical ticket: ${ticket.id}`);
    // Escalate to senior engineer
  }
}

class TechSupportHandler extends BaseHandler<Ticket> {
  protected canHandle(ticket: Ticket): boolean {
    return ticket.type === 'technical';
  }

  protected process(ticket: Ticket): void {
    console.log(`Tech support handling ticket: ${ticket.id}`);
    // Handle technical issue
  }
}

class GeneralSupportHandler extends BaseHandler<Ticket> {
  protected canHandle(ticket: Ticket): boolean {
    return ticket.type === 'general';
  }

  protected process(ticket: Ticket): void {
    console.log(`Customer service handling ticket: ${ticket.id}`);
    // Handle general inquiry
  }
}

class ManagerHandler extends BaseHandler<Ticket> {
  protected canHandle(ticket: Ticket): boolean {
    return true; // Handles everything that falls through
  }

  protected process(ticket: Ticket): void {
    console.log(`Manager handling unhandled ticket: ${ticket.id}`);
    // Escalate to manager
  }
}

// Build the chain
const billing = new BillingHandler();
const criticalTech = new CriticalTechHandler();
const techSupport = new TechSupportHandler();
const general = new GeneralSupportHandler();
const manager = new ManagerHandler();

billing
  .setNext(criticalTech)
  .setNext(techSupport)
  .setNext(general)
  .setNext(manager);

// Use the chain
billing.handle({ id: '1', type: 'billing', severity: 'normal' });
billing.handle({ id: '2', type: 'technical', severity: 'critical' });
billing.handle({ id: '3', type: 'unknown', severity: 'normal' });
```

## Middleware Pattern (Express-style)

```typescript
type NextFunction = () => void;
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

class MiddlewareChain {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  handle(req: Request, res: Response): void {
    let index = 0;

    const next = (): void => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware(req, res, next);
      }
    };

    next();
  }
}

// Middleware implementations
const logging: Middleware = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

const authentication: Middleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return; // Don't call next - stop chain
  }
  req.user = verifyToken(token);
  next();
};

const authorization: Middleware = (req, res, next) => {
  if (!req.user.hasPermission(req.requiredPermission)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};

const errorHandler: Middleware = (req, res, next) => {
  try {
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Build middleware chain
const chain = new MiddlewareChain()
  .use(logging)
  .use(authentication)
  .use(authorization)
  .use(errorHandler);
```

## Validation Chain

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface Validator<T> {
  setNext(validator: Validator<T>): Validator<T>;
  validate(data: T): ValidationResult;
}

abstract class BaseValidator<T> implements Validator<T> {
  private next: Validator<T> | null = null;

  setNext(validator: Validator<T>): Validator<T> {
    this.next = validator;
    return validator;
  }

  validate(data: T): ValidationResult {
    const result = this.check(data);

    if (!result.valid) {
      return result;
    }

    if (this.next) {
      return this.next.validate(data);
    }

    return { valid: true, errors: [] };
  }

  protected abstract check(data: T): ValidationResult;
}

interface UserData {
  email: string;
  password: string;
  age: number;
}

class EmailValidator extends BaseValidator<UserData> {
  protected check(data: UserData): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, errors: ['Invalid email format'] };
    }
    return { valid: true, errors: [] };
  }
}

class PasswordValidator extends BaseValidator<UserData> {
  protected check(data: UserData): ValidationResult {
    const errors: string[] = [];

    if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(data.password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[0-9]/.test(data.password)) {
      errors.push('Password must contain a number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class AgeValidator extends BaseValidator<UserData> {
  protected check(data: UserData): ValidationResult {
    if (data.age < 18) {
      return { valid: false, errors: ['Must be at least 18 years old'] };
    }
    if (data.age > 120) {
      return { valid: false, errors: ['Invalid age'] };
    }
    return { valid: true, errors: [] };
  }
}

// Build validation chain
const validator = new EmailValidator();
validator
  .setNext(new PasswordValidator())
  .setNext(new AgeValidator());

// Validate
const result = validator.validate({
  email: 'test@example.com',
  password: 'weak',
  age: 25
});
// { valid: false, errors: ['Password must be at least 8 characters', ...] }
```

## Event Bubbling

```typescript
interface UIComponent {
  parent: UIComponent | null;
  handleEvent(event: UIEvent): boolean;
}

class BaseComponent implements UIComponent {
  parent: UIComponent | null = null;
  private eventHandlers: Map<string, (event: UIEvent) => boolean> = new Map();

  on(eventType: string, handler: (event: UIEvent) => boolean): void {
    this.eventHandlers.set(eventType, handler);
  }

  handleEvent(event: UIEvent): boolean {
    const handler = this.eventHandlers.get(event.type);

    if (handler) {
      const handled = handler(event);
      if (handled) {
        return true; // Event consumed, stop bubbling
      }
    }

    // Bubble to parent
    if (this.parent) {
      return this.parent.handleEvent(event);
    }

    return false;
  }
}

class Button extends BaseComponent {
  constructor(private label: string) {
    super();
  }
}

class Panel extends BaseComponent {
  private children: UIComponent[] = [];

  addChild(child: UIComponent): void {
    child.parent = this;
    this.children.push(child);
  }
}

class Window extends BaseComponent {
  private panels: Panel[] = [];

  addPanel(panel: Panel): void {
    panel.parent = this;
    this.panels.push(panel);
  }
}

// Usage
const window = new Window();
window.on('click', (e) => {
  console.log('Window caught unhandled click');
  return true;
});

const panel = new Panel();
panel.on('click', (e) => {
  if (e.target === 'close') {
    console.log('Panel closing');
    return true;
  }
  return false; // Let it bubble
});

const button = new Button('Submit');
button.on('click', (e) => {
  console.log('Button clicked');
  return false; // Let it bubble to panel
});

window.addPanel(panel);
panel.addChild(button);

// Event bubbles: button -> panel -> window
button.handleEvent({ type: 'click', target: 'submit' });
```

## Approval Workflow

```typescript
interface PurchaseRequest {
  id: string;
  amount: number;
  requester: string;
  description: string;
  approvals: Approval[];
}

interface Approval {
  approver: string;
  approved: boolean;
  comment?: string;
  timestamp: Date;
}

abstract class Approver {
  protected successor: Approver | null = null;
  protected approvalLimit: number;
  protected name: string;

  constructor(name: string, limit: number) {
    this.name = name;
    this.approvalLimit = limit;
  }

  setSuccessor(approver: Approver): Approver {
    this.successor = approver;
    return approver;
  }

  async process(request: PurchaseRequest): Promise<PurchaseRequest> {
    if (request.amount <= this.approvalLimit) {
      return this.approve(request);
    } else if (this.successor) {
      // Add partial approval and pass up the chain
      request.approvals.push({
        approver: this.name,
        approved: true,
        comment: 'Approved, escalating for final approval',
        timestamp: new Date()
      });
      return this.successor.process(request);
    } else {
      return this.reject(request, 'Exceeds maximum approval limit');
    }
  }

  protected approve(request: PurchaseRequest): PurchaseRequest {
    request.approvals.push({
      approver: this.name,
      approved: true,
      timestamp: new Date()
    });
    return request;
  }

  protected reject(request: PurchaseRequest, reason: string): PurchaseRequest {
    request.approvals.push({
      approver: this.name,
      approved: false,
      comment: reason,
      timestamp: new Date()
    });
    return request;
  }
}

class Manager extends Approver {
  constructor() {
    super('Department Manager', 1000);
  }
}

class Director extends Approver {
  constructor() {
    super('Director', 10000);
  }
}

class VP extends Approver {
  constructor() {
    super('Vice President', 100000);
  }
}

class CEO extends Approver {
  constructor() {
    super('CEO', Infinity);
  }
}

// Build approval chain
const manager = new Manager();
manager
  .setSuccessor(new Director())
  .setSuccessor(new VP())
  .setSuccessor(new CEO());

// Process requests
await manager.process({ id: '1', amount: 500, ... });    // Manager approves
await manager.process({ id: '2', amount: 5000, ... });   // Director approves
await manager.process({ id: '3', amount: 50000, ... });  // VP approves
await manager.process({ id: '4', amount: 500000, ... }); // CEO approves
```

## When to Use

**Use Chain of Responsibility when:**
- Multiple objects may handle a request
- Handler should be determined at runtime
- You want to decouple senders and receivers
- Request should be passed along until handled

**Don't use Chain of Responsibility when:**
- There's always exactly one handler
- Handler selection is simple and static
- Performance is critical (chain traversal overhead)

## Related Patterns

- **Composite:** Chain can follow composite structure
- **Command:** Commands can be passed through a chain
- **Decorator:** Similar structure, different intent (add behavior vs. handle request)
