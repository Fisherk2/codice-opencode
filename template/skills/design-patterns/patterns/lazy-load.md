# Lazy Load Pattern

## Intent

Defer initialization of an object until the point at which it is needed. Improves performance by avoiding unnecessary computation.

## The Problem

Eager loading everything:
- Loading related data that may never be used
- Long initial load times
- Excessive memory usage
- Unnecessary database queries

```typescript
// Without Lazy Load - loads everything immediately
class Order {
  constructor(data: OrderData) {
    this.id = data.id;
    this.total = data.total;
    // Loads ALL items even if just checking order status
    this.items = data.items.map(i => new OrderItem(i));
    // Loads full customer even if just need order ID
    this.customer = new Customer(data.customerId);
    // Loads shipping even if order not shipped yet
    this.shipping = new ShippingInfo(data.shippingId);
  }
}

// Every order load fetches tons of data
const order = await orderRepository.findById('123');
// Just needed: order.status
// Actually loaded: all items, customer details, shipping info
```

## Lazy Load Strategies

### 1. Lazy Initialization

```typescript
class Order {
  private _items: OrderItem[] | null = null;
  private _customer: Customer | null = null;

  constructor(
    public id: string,
    public status: string,
    public total: number,
    private customerId: string,
    private orderRepository: OrderRepository
  ) {}

  // Lazy property - loads on first access
  async getItems(): Promise<OrderItem[]> {
    if (this._items === null) {
      this._items = await this.orderRepository.getOrderItems(this.id);
    }
    return this._items;
  }

  async getCustomer(): Promise<Customer> {
    if (this._customer === null) {
      this._customer = await this.orderRepository.getCustomer(this.customerId);
    }
    return this._customer;
  }
}

// Usage
const order = await orderRepository.findById('123');
console.log(order.status); // No extra queries

// Items loaded only when needed
const items = await order.getItems();
```

### 2. Virtual Proxy

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  orders: Order[];
}

class CustomerProxy implements Customer {
  private realCustomer: Customer | null = null;
  private loaded = false;

  constructor(
    public id: string,
    private loader: (id: string) => Promise<Customer>
  ) {}

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.realCustomer = await this.loader(this.id);
      this.loaded = true;
    }
  }

  get name(): string {
    if (!this.loaded) {
      throw new Error('Customer not loaded. Use getName() for async access');
    }
    return this.realCustomer!.name;
  }

  async getName(): Promise<string> {
    await this.ensureLoaded();
    return this.realCustomer!.name;
  }

  async getEmail(): Promise<string> {
    await this.ensureLoaded();
    return this.realCustomer!.email;
  }

  async getOrders(): Promise<Order[]> {
    await this.ensureLoaded();
    return this.realCustomer!.orders;
  }
}

// Factory creates proxies instead of full objects
class OrderMapper {
  mapToEntity(row: any): Order {
    return {
      id: row.id,
      total: row.total,
      // Create proxy instead of loading full customer
      customer: new CustomerProxy(row.customer_id, this.customerLoader)
    };
  }
}
```

### 3. Value Holder

```typescript
class Lazy<T> {
  private value: T | undefined;
  private loaded = false;

  constructor(private loader: () => Promise<T>) {}

  async get(): Promise<T> {
    if (!this.loaded) {
      this.value = await this.loader();
      this.loaded = true;
    }
    return this.value!;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  // Get synchronously if loaded, undefined otherwise
  peek(): T | undefined {
    return this.value;
  }

  // Force reload
  async refresh(): Promise<T> {
    this.loaded = false;
    return this.get();
  }
}

// Usage
class Product {
  readonly reviews: Lazy<Review[]>;
  readonly relatedProducts: Lazy<Product[]>;

  constructor(
    public id: string,
    public name: string,
    public price: number,
    private productService: ProductService
  ) {
    this.reviews = new Lazy(() =>
      this.productService.getReviews(this.id)
    );

    this.relatedProducts = new Lazy(() =>
      this.productService.getRelatedProducts(this.id)
    );
  }
}

// Usage
const product = await productService.getProduct('123');
console.log(product.name); // No extra queries

// Reviews loaded only when needed
const reviews = await product.reviews.get();

// Second call returns cached value
const sameReviews = await product.reviews.get(); // No query
```

### 4. Ghost Object

```typescript
enum LoadState {
  Ghost,    // Only ID loaded
  Partial,  // Some fields loaded
  Full      // Everything loaded
}

class User {
  private loadState: LoadState = LoadState.Ghost;
  private _name: string | undefined;
  private _email: string | undefined;
  private _profile: UserProfile | undefined;

  constructor(
    public readonly id: string,
    private loader: UserLoader
  ) {}

  async getName(): Promise<string> {
    if (this.loadState === LoadState.Ghost) {
      await this.loadPartial();
    }
    return this._name!;
  }

  async getEmail(): Promise<string> {
    if (this.loadState === LoadState.Ghost) {
      await this.loadPartial();
    }
    return this._email!;
  }

  async getProfile(): Promise<UserProfile> {
    if (this.loadState !== LoadState.Full) {
      await this.loadFull();
    }
    return this._profile!;
  }

  private async loadPartial(): Promise<void> {
    const data = await this.loader.loadBasic(this.id);
    this._name = data.name;
    this._email = data.email;
    this.loadState = LoadState.Partial;
  }

  private async loadFull(): Promise<void> {
    const data = await this.loader.loadFull(this.id);
    this._name = data.name;
    this._email = data.email;
    this._profile = data.profile;
    this.loadState = LoadState.Full;
  }
}
```

## Collection Lazy Loading

```typescript
class LazyCollection<T> implements Iterable<T> {
  private items: T[] | null = null;
  private loaded = false;

  constructor(private loader: () => Promise<T[]>) {}

  async load(): Promise<void> {
    if (!this.loaded) {
      this.items = await this.loader();
      this.loaded = true;
    }
  }

  async getAll(): Promise<T[]> {
    await this.load();
    return this.items!;
  }

  async count(): Promise<number> {
    await this.load();
    return this.items!.length;
  }

  async first(): Promise<T | undefined> {
    await this.load();
    return this.items![0];
  }

  async find(predicate: (item: T) => boolean): Promise<T | undefined> {
    await this.load();
    return this.items!.find(predicate);
  }

  // Synchronous iteration after loading
  *[Symbol.iterator](): Iterator<T> {
    if (!this.loaded) {
      throw new Error('Collection not loaded. Call load() first.');
    }
    yield* this.items!;
  }
}

// Usage
class Category {
  readonly products: LazyCollection<Product>;

  constructor(
    public id: string,
    public name: string,
    productRepository: ProductRepository
  ) {
    this.products = new LazyCollection(() =>
      productRepository.findByCategory(this.id)
    );
  }
}

const category = await categoryRepository.findById('electronics');
console.log(category.name); // No product query

// Products loaded when accessed
const allProducts = await category.products.getAll();
const firstProduct = await category.products.first();
```

## Module Lazy Loading

```typescript
// Lazy import for code splitting
async function loadEditor(): Promise<typeof import('./editor')> {
  return import('./editor');
}

async function loadChartLibrary(): Promise<typeof import('chart.js')> {
  return import('chart.js');
}

// Component with lazy dependencies
class Dashboard {
  private chartLibrary: typeof import('chart.js') | null = null;

  async renderChart(data: ChartData): Promise<void> {
    // Load chart library only when needed
    if (!this.chartLibrary) {
      this.chartLibrary = await loadChartLibrary();
    }

    const chart = new this.chartLibrary.Chart(this.canvas, {
      type: 'bar',
      data
    });
  }
}

// React lazy loading
const LazyEditor = React.lazy(() => import('./Editor'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyEditor />
    </Suspense>
  );
}
```

## Database Query Optimization

```typescript
class OrderRepository {
  // Eager loading when you know you need related data
  async findWithItems(id: string): Promise<Order> {
    const result = await this.db.query(`
      SELECT o.*, i.*
      FROM orders o
      LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.id = $1
    `, [id]);

    return this.mapOrderWithItems(result);
  }

  // Lazy loading for basic order info
  async findById(id: string): Promise<Order> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    return this.mapOrder(result, {
      // Items will be loaded lazily
      itemsLoader: () => this.getOrderItems(id)
    });
  }

  // Batch loading to avoid N+1
  async findByIds(ids: string[]): Promise<Order[]> {
    const result = await this.db.query(
      'SELECT * FROM orders WHERE id = ANY($1)',
      [ids]
    );

    return result.rows.map(row => this.mapOrder(row));
  }
}

// DataLoader for batching (common in GraphQL)
class OrderItemsLoader {
  private loader: DataLoader<string, OrderItem[]>;

  constructor(private repository: OrderRepository) {
    this.loader = new DataLoader(async (orderIds: string[]) => {
      const items = await this.repository.getItemsByOrderIds(orderIds);
      // Group by order ID
      return orderIds.map(id => items.filter(item => item.orderId === id));
    });
  }

  load(orderId: string): Promise<OrderItem[]> {
    return this.loader.load(orderId);
  }
}
```

## When to Use

**Use Lazy Load when:**
- Related data is expensive to load
- Related data often isn't needed
- Initial load time is important
- Memory usage is a concern

**Don't use Lazy Load when:**
- Data is always needed together
- Lazy loading would cause N+1 queries
- Synchronous access is required
- The complexity isn't justified

## Related Patterns

- **Proxy:** Virtual Proxy is a form of Lazy Load
- **Repository:** Often implements lazy loading strategies
- **Identity Map:** Works with Lazy Load to cache loaded objects
- **DataLoader:** Batches lazy load requests to avoid N+1
