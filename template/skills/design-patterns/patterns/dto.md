# Data Transfer Object (DTO) Pattern

## Intent

Carry data between processes to reduce the number of method calls and provide a clear contract between layers.

## The Problem

Domain objects exposed directly to clients:
- Leak internal structure
- Over-fetch data (entire entity when only name needed)
- Under-fetch data (multiple calls to get related data)
- Circular references break serialization
- Sensitive fields exposed accidentally

```typescript
// Without DTO - domain object exposed directly
class User {
  id: string;
  email: string;
  passwordHash: string;    // Sensitive! Should never be exposed
  name: string;
  createdAt: Date;
  orders: Order[];         // Circular reference, large data
  internalNotes: string;   // Internal only
}

// Controller returns raw domain object
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(user); // Exposes passwordHash, internalNotes, everything!
});
```

## The Solution

Create dedicated objects for data transfer:

```typescript
// Domain entity - internal representation
class User {
  constructor(
    public readonly id: string,
    public email: string,
    public passwordHash: string,
    public name: string,
    public role: UserRole,
    public createdAt: Date,
    public lastLoginAt: Date | null,
    public internalNotes: string
  ) {}

  verifyPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.passwordHash);
  }

  updateEmail(email: string): void {
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
    this.email = email;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Response DTO - what clients see
interface UserResponseDTO {
  id: string;
  email: string;
  name: string;
  role: string;
  memberSince: string;
}

// Request DTO - what clients send
interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

interface UpdateUserDTO {
  email?: string;
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Mapper - converts between domain and DTO
class UserMapper {
  static toDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toString(),
      memberSince: user.createdAt.toISOString()
    };
  }

  static toEntity(dto: CreateUserDTO): User {
    return new User(
      generateId(),
      dto.email,
      bcrypt.hashSync(dto.password, 10),
      dto.name,
      UserRole.Member,
      new Date(),
      null,
      ''
    );
  }
}

// Controller uses DTOs
app.get('/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(UserMapper.toDTO(user)); // Safe, controlled output
});

app.post('/users', async (req, res) => {
  const dto: CreateUserDTO = req.body;
  const user = UserMapper.toEntity(dto);
  await userRepository.save(user);
  res.status(201).json(UserMapper.toDTO(user));
});
```

## DTO Variations

### List DTO (Summary)

```typescript
// Full DTO for detail views
interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryDTO;
  images: ImageDTO[];
  specifications: Record<string, string>;
  reviews: ReviewDTO[];
  averageRating: number;
  inStock: boolean;
}

// Summary DTO for list views
interface ProductSummaryDTO {
  id: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  averageRating: number;
  inStock: boolean;
}

// Mapper handles both
class ProductMapper {
  static toDTO(product: Product): ProductDTO {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: CategoryMapper.toDTO(product.category),
      images: product.images.map(ImageMapper.toDTO),
      specifications: product.specifications,
      reviews: product.reviews.map(ReviewMapper.toDTO),
      averageRating: product.getAverageRating(),
      inStock: product.stock > 0
    };
  }

  static toSummaryDTO(product: Product): ProductSummaryDTO {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnailUrl: product.images[0]?.thumbnailUrl ?? '/placeholder.png',
      averageRating: product.getAverageRating(),
      inStock: product.stock > 0
    };
  }

  static toSummaryDTOList(products: Product[]): ProductSummaryDTO[] {
    return products.map(this.toSummaryDTO);
  }
}
```

### Composite DTO

Aggregate data from multiple sources:

```typescript
// Dashboard needs data from multiple domains
interface DashboardDTO {
  user: UserSummaryDTO;
  recentOrders: OrderSummaryDTO[];
  notifications: NotificationDTO[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
  };
}

class DashboardAssembler {
  constructor(
    private userRepository: UserRepository,
    private orderRepository: OrderRepository,
    private notificationService: NotificationService,
    private statsService: StatsService
  ) {}

  async assemble(userId: string): Promise<DashboardDTO> {
    // Fetch all data in parallel
    const [user, orders, notifications, stats] = await Promise.all([
      this.userRepository.findById(userId),
      this.orderRepository.findRecentByUser(userId, 5),
      this.notificationService.getUnread(userId),
      this.statsService.getUserStats(userId)
    ]);

    return {
      user: UserMapper.toSummaryDTO(user),
      recentOrders: orders.map(OrderMapper.toSummaryDTO),
      notifications: notifications.map(NotificationMapper.toDTO),
      stats: {
        totalOrders: stats.orderCount,
        totalSpent: stats.totalSpent,
        loyaltyPoints: stats.points
      }
    };
  }
}
```

### Request Validation

```typescript
import { z } from 'zod';

// Define schema with validation
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(1, 'Name is required').max(100)
});

type CreateUserDTO = z.infer<typeof CreateUserSchema>;

// Validate in controller or middleware
app.post('/users', async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  const dto: CreateUserDTO = result.data;
  // Process validated DTO...
});

// Reusable validation middleware
function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

app.post('/users', validateBody(CreateUserSchema), async (req, res) => {
  const dto = req.validatedBody as CreateUserDTO;
  // Already validated
});
```

### Nested DTOs

```typescript
interface OrderDTO {
  id: string;
  status: string;
  placedAt: string;
  customer: CustomerDTO;
  items: OrderItemDTO[];
  shipping: ShippingDTO;
  payment: PaymentDTO;
  totals: TotalsDTO;
}

interface OrderItemDTO {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ShippingDTO {
  method: string;
  address: AddressDTO;
  estimatedDelivery: string;
  trackingNumber: string | null;
}

interface PaymentDTO {
  method: string;
  status: string;
  last4?: string;  // Only for cards
}

interface TotalsDTO {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

class OrderMapper {
  static toDTO(order: Order): OrderDTO {
    return {
      id: order.id,
      status: order.status,
      placedAt: order.createdAt.toISOString(),
      customer: CustomerMapper.toDTO(order.customer),
      items: order.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice
      })),
      shipping: {
        method: order.shippingMethod.name,
        address: AddressMapper.toDTO(order.shippingAddress),
        estimatedDelivery: order.estimatedDelivery.toISOString(),
        trackingNumber: order.trackingNumber
      },
      payment: {
        method: order.paymentMethod.type,
        status: order.paymentStatus,
        last4: order.paymentMethod.type === 'card'
          ? order.paymentMethod.last4
          : undefined
      },
      totals: {
        subtotal: order.subtotal,
        shipping: order.shippingCost,
        tax: order.tax,
        discount: order.discount,
        total: order.total
      }
    };
  }
}
```

## Class-based DTOs with Decorators

```typescript
import { Expose, Exclude, Transform, Type } from 'class-transformer';

// Response DTO with transformation rules
class UserResponseDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Exclude()
  passwordHash: string;  // Never included

  @Expose()
  @Transform(({ value }) => value.toString())
  role: string;

  @Expose({ name: 'memberSince' })
  @Transform(({ value }) => value.toISOString())
  createdAt: string;

  @Expose()
  @Type(() => AddressDTO)
  addresses: AddressDTO[];
}

// Usage with class-transformer
import { plainToClass, classToPlain } from 'class-transformer';

const user = await userRepository.findById(id);
const dto = plainToClass(UserResponseDTO, user, {
  excludeExtraneousValues: true
});
```

## API Response Wrappers

```typescript
// Standard API response structure
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Response builder
class ResponseBuilder {
  static success<T>(data: T): ApiResponse<T> {
    return { success: true, data };
  }

  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static error(
    code: string,
    message: string,
    details?: Record<string, string[]>
  ): ApiErrorResponse {
    return {
      success: false,
      error: { code, message, details }
    };
  }
}

// Usage
app.get('/products', async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const result = await productRepository.findPaginated({ page, pageSize });

  res.json(ResponseBuilder.paginated(
    result.data.map(ProductMapper.toSummaryDTO),
    result.page,
    result.pageSize,
    result.total
  ));
});
```

## Versioned DTOs

```typescript
// Version 1
namespace V1 {
  export interface UserDTO {
    id: string;
    fullName: string;  // Combined name
    email: string;
  }

  export class UserMapper {
    static toDTO(user: User): UserDTO {
      return {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      };
    }
  }
}

// Version 2 - breaking change
namespace V2 {
  export interface UserDTO {
    id: string;
    firstName: string;  // Split names
    lastName: string;
    email: string;
    avatarUrl: string;  // New field
  }

  export class UserMapper {
    static toDTO(user: User): UserDTO {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl ?? '/default-avatar.png'
      };
    }
  }
}

// Router selects version
app.get('/v1/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(V1.UserMapper.toDTO(user));
});

app.get('/v2/users/:id', async (req, res) => {
  const user = await userRepository.findById(req.params.id);
  res.json(V2.UserMapper.toDTO(user));
});
```

## When to Use

**Use DTOs when:**
- API responses need different shape than domain objects
- Sensitive data must be excluded
- You need to aggregate data from multiple sources
- API versioning requires different response formats
- Request validation is complex

**Don't use DTOs when:**
- Domain object is already the perfect API shape
- Internal service-to-service calls (same trust boundary)
- Simple CRUD with no sensitive fields

## Related Patterns

- **Service Layer:** Uses DTOs for input/output
- **Repository:** Returns domain objects, not DTOs
- **Facade:** Often uses DTOs to simplify complex interfaces
- **Mapper:** Handles DTO ↔ Domain conversion
