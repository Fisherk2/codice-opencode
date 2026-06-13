# Service Layer Pattern

## Intent

Define an application's boundary with a layer of services that establishes a set of available operations and coordinates the application's response in each operation.

## The Problem

Application logic scattered across:
- Controllers handling business logic
- Domain objects containing workflow logic
- Direct calls between subsystems

No clear boundary between presentation and domain.

```typescript
// Without Service Layer - controller does too much
class OrderController {
  async createOrder(req: Request, res: Response) {
    // Validation
    if (!req.body.items?.length) {
      return res.status(400).json({ error: 'No items' });
    }

    // Authorization
    const user = await User.findById(req.userId);
    if (!user.canPlaceOrders) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Business logic
    let total = 0;
    for (const item of req.body.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      total += product.price * item.quantity;
    }

    // Apply discounts
    if (user.membershipLevel === 'gold') {
      total *= 0.9;
    }

    // Create order
    const order = await Order.create({
      userId: user.id,
      items: req.body.items,
      total
    });

    // Update inventory
    for (const item of req.body.items) {
      await Product.decrement(item.productId, 'stock', item.quantity);
    }

    // Send notification
    await sendEmail(user.email, 'Order Confirmation', `Order ${order.id}`);

    // Response
    res.json(order);
  }
}
// This controller knows too much and does too much
```

## The Solution

Create a service layer that:
- Defines the application's boundary
- Encapsulates business logic
- Orchestrates domain objects
- Handles transactions

```typescript
// Service Layer
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
    private userRepository: UserRepository,
    private inventoryService: InventoryService,
    private pricingService: PricingService,
    private notificationService: NotificationService,
    private unitOfWork: UnitOfWork
  ) {}

  async createOrder(userId: string, items: OrderItemDTO[]): Promise<Order> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate items and check inventory
    const validatedItems = await this.validateItems(items);

    // Calculate pricing
    const pricing = await this.pricingService.calculate(validatedItems, user);

    // Reserve inventory
    const reservation = await this.inventoryService.reserve(validatedItems);

    try {
      // Create order
      const order = Order.create({
        userId: user.id,
        items: validatedItems,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        tax: pricing.tax,
        total: pricing.total
      });

      this.unitOfWork.registerNew(order);

      // Commit all changes
      await this.unitOfWork.commit();

      // Confirm inventory reservation
      await this.inventoryService.confirm(reservation);

      // Send notification (async - don't await)
      this.notificationService
        .sendOrderConfirmation(order, user)
        .catch(console.error);

      return order;

    } catch (error) {
      // Release reservation on failure
      await this.inventoryService.release(reservation);
      throw error;
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('Cannot cancel another user\'s order');
    }

    if (!order.canBeCancelled()) {
      throw new BusinessRuleError('Order cannot be cancelled in current status');
    }

    order.cancel();

    // Restore inventory
    await this.inventoryService.restore(order.items);

    await this.orderRepository.save(order);

    // Notify user
    this.notificationService
      .sendOrderCancellation(order)
      .catch(console.error);

    return order;
  }

  async getOrderHistory(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findByUser(userId, options);
  }

  private async validateItems(items: OrderItemDTO[]): Promise<ValidatedItem[]> {
    const validated: ValidatedItem[] = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);

      if (!product) {
        throw new ValidationError(`Product ${item.productId} not found`);
      }

      if (!product.isAvailable()) {
        throw new ValidationError(`Product ${product.name} is not available`);
      }

      if (item.quantity <= 0) {
        throw new ValidationError('Quantity must be positive');
      }

      validated.push({
        product,
        quantity: item.quantity,
        unitPrice: product.price
      });
    }

    return validated;
  }
}

// Controller is now thin
class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response) {
    try {
      const order = await this.orderService.createOrder(
        req.userId,
        req.body.items
      );
      res.status(201).json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async cancelOrder(req: Request, res: Response) {
    try {
      const order = await this.orderService.cancelOrder(
        req.params.id,
        req.userId
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: Error, res: Response) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

## Service Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (Controllers, GraphQL Resolvers, CLI Commands)              │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      Service Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  OrderService   │  │   UserService   │  │ PaymentSvc  │ │
│  │                 │  │                 │  │             │ │
│  │ + createOrder() │  │ + register()    │  │ + charge()  │ │
│  │ + cancelOrder() │  │ + updateProfile │  │ + refund()  │ │
│  │ + getHistory()  │  │ + changePassword│  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
└───────────┼────────────────────┼─────────────────┼─────────┘
            │                    │                 │
┌───────────▼────────────────────▼─────────────────▼─────────┐
│                       Domain Layer                          │
│   (Entities, Value Objects, Domain Services, Repositories)  │
└─────────────────────────────────────────────────────────────┘
```

## Service Types

### Application Service

Orchestrates domain operations for use cases:

```typescript
class UserRegistrationService {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private eventBus: EventBus
  ) {}

  async register(dto: RegisterUserDTO): Promise<User> {
    // Validate email uniqueness
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new DuplicateEmailError(dto.email);
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(dto.password);

    // Create user
    const user = User.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword
    });

    // Save
    await this.userRepository.save(user);

    // Publish event
    await this.eventBus.publish(new UserRegisteredEvent(user));

    // Send welcome email (don't block)
    this.emailService.sendWelcome(user).catch(console.error);

    return user;
  }
}
```

### Domain Service

Contains domain logic that doesn't belong to a single entity:

```typescript
// Domain service - pure domain logic
class PricingService {
  calculateTotal(items: OrderItem[], customer: Customer): PricingResult {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Apply membership discount
    const membershipDiscount = this.calculateMembershipDiscount(
      subtotal,
      customer.membershipLevel
    );

    // Apply volume discount
    const volumeDiscount = this.calculateVolumeDiscount(items);

    const discount = Math.max(membershipDiscount, volumeDiscount);
    const afterDiscount = subtotal - discount;

    // Calculate tax
    const tax = this.calculateTax(afterDiscount, customer.address);

    return {
      subtotal,
      discount,
      tax,
      total: afterDiscount + tax
    };
  }

  private calculateMembershipDiscount(subtotal: number, level: string): number {
    const rates: Record<string, number> = {
      bronze: 0.05,
      silver: 0.10,
      gold: 0.15,
      platinum: 0.20
    };
    return subtotal * (rates[level] || 0);
  }

  private calculateVolumeDiscount(items: OrderItem[]): number {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity >= 100) return 0.20;
    if (totalQuantity >= 50) return 0.15;
    if (totalQuantity >= 20) return 0.10;
    return 0;
  }

  private calculateTax(amount: number, address: Address): number {
    // Tax calculation based on jurisdiction
    const taxRates: Record<string, number> = {
      CA: 0.0725,
      NY: 0.08,
      TX: 0.0625
    };
    return amount * (taxRates[address.state] || 0);
  }
}
```

### Infrastructure Service

Handles external integrations:

```typescript
class PaymentGatewayService {
  constructor(private stripe: Stripe) {}

  async charge(
    amount: number,
    currency: string,
    paymentMethodId: string,
    customerId: string
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        payment_method: paymentMethodId,
        customer: customerId,
        confirm: true
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }
      throw error;
    }
  }

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: transactionId,
      amount: amount ? Math.round(amount * 100) : undefined
    });

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id
    };
  }
}
```

## Transaction Handling

```typescript
class TransferService {
  constructor(
    private accountRepository: AccountRepository,
    private transactionManager: TransactionManager
  ) {}

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<Transfer> {
    return this.transactionManager.runInTransaction(async (tx) => {
      // Get accounts with row locking
      const fromAccount = await this.accountRepository.findByIdForUpdate(
        fromAccountId,
        tx
      );
      const toAccount = await this.accountRepository.findByIdForUpdate(
        toAccountId,
        tx
      );

      if (!fromAccount || !toAccount) {
        throw new NotFoundError('Account');
      }

      // Business validation
      if (fromAccount.balance < amount) {
        throw new InsufficientFundsError();
      }

      // Perform transfer
      fromAccount.debit(amount);
      toAccount.credit(amount);

      // Save both
      await this.accountRepository.save(fromAccount, tx);
      await this.accountRepository.save(toAccount, tx);

      // Create transfer record
      const transfer = Transfer.create({
        fromAccountId,
        toAccountId,
        amount,
        status: 'completed'
      });

      return transfer;
    });
  }
}
```

## Service Composition

```typescript
// Compose services for complex workflows
class CheckoutService {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private shippingService: ShippingService,
    private notificationService: NotificationService
  ) {}

  async checkout(
    userId: string,
    paymentMethodId: string,
    shippingAddressId: string
  ): Promise<CheckoutResult> {
    // Get cart
    const cart = await this.cartService.getCart(userId);
    if (cart.isEmpty()) {
      throw new EmptyCartError();
    }

    // Calculate shipping
    const shippingOptions = await this.shippingService.calculateOptions(
      cart.items,
      shippingAddressId
    );
    const selectedShipping = shippingOptions[0]; // Default cheapest

    // Create order
    const order = await this.orderService.createOrder(userId, {
      items: cart.items,
      shippingAddressId,
      shippingMethod: selectedShipping.method,
      shippingCost: selectedShipping.cost
    });

    try {
      // Process payment
      const payment = await this.paymentService.charge(
        order.total,
        'USD',
        paymentMethodId,
        userId
      );

      if (!payment.success) {
        await this.orderService.failOrder(order.id, payment.error);
        throw new PaymentFailedError(payment.error);
      }

      // Confirm order
      await this.orderService.confirmOrder(order.id, payment.transactionId);

      // Clear cart
      await this.cartService.clear(userId);

      // Create shipment
      const shipment = await this.shippingService.createShipment(order);

      // Send notifications
      this.notificationService.sendOrderConfirmation(order);

      return {
        order,
        payment,
        shipment
      };

    } catch (error) {
      // Handle failure - may need to refund
      await this.handleCheckoutFailure(order, error);
      throw error;
    }
  }

  private async handleCheckoutFailure(order: Order, error: Error): Promise<void> {
    // Implementation of compensation logic
  }
}
```

## When to Use

**Use Service Layer when:**
- Application has complex business logic
- Multiple presentation channels (web, mobile, CLI)
- Need clear application boundary
- Business operations span multiple domain objects
- Need transaction management

**Don't use Service Layer when:**
- Simple CRUD application
- Business logic is minimal
- Single presentation layer with simple operations

## Related Patterns

- **Repository:** Service layer uses repositories for data access
- **Unit of Work:** Coordinates transactions in service methods
- **Facade:** Service layer is a facade over domain
- **Domain Model:** Service layer orchestrates domain objects
