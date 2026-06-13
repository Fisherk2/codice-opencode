# Proxy Pattern

## Intent

Provide a surrogate or placeholder for another object to control access to it.

## The Problem

You need to control access to an object because:
- It's expensive to create (lazy initialization)
- It needs access control
- It's remote and needs network handling
- You want to cache results
- You need to log access

Direct instantiation doesn't allow any of these controls.

## Proxy Types

| Type | Purpose | Example |
|------|---------|---------|
| **Virtual Proxy** | Lazy loading expensive objects | Load image only when displayed |
| **Protection Proxy** | Access control | Check permissions before operation |
| **Remote Proxy** | Local representative of remote object | API client |
| **Caching Proxy** | Cache expensive operation results | Memoization |
| **Logging Proxy** | Log all operations | Audit trail |

## The Solution

Create a proxy class that implements the same interface as the real object:

```typescript
// Subject interface
interface Image {
  display(): void;
  getInfo(): ImageInfo;
}

// Real subject - expensive to create
class HighResolutionImage implements Image {
  private data: Buffer;
  private info: ImageInfo;

  constructor(private path: string) {
    // Expensive operation - loads entire image into memory
    console.log(`Loading image from ${path}...`);
    this.data = this.loadFromDisk(path);
    this.info = this.extractMetadata();
    console.log(`Loaded ${this.info.width}x${this.info.height} image`);
  }

  display(): void {
    console.log(`Displaying image: ${this.path}`);
    // Render the image...
  }

  getInfo(): ImageInfo {
    return this.info;
  }

  private loadFromDisk(path: string): Buffer {
    // Simulate expensive load
    return fs.readFileSync(path);
  }

  private extractMetadata(): ImageInfo {
    return {
      width: 4096,
      height: 2160,
      format: 'png',
      size: this.data.length
    };
  }
}

// Virtual Proxy - lazy loading
class ImageProxy implements Image {
  private realImage: HighResolutionImage | null = null;
  private cachedInfo: ImageInfo | null = null;

  constructor(private path: string) {
    // Lightweight - doesn't load image yet
    console.log(`Created proxy for ${path}`);
  }

  display(): void {
    // Load real image only when needed
    if (!this.realImage) {
      this.realImage = new HighResolutionImage(this.path);
    }
    this.realImage.display();
  }

  getInfo(): ImageInfo {
    // Can get basic info without loading full image
    if (!this.cachedInfo) {
      this.cachedInfo = this.getQuickInfo();
    }
    return this.cachedInfo;
  }

  private getQuickInfo(): ImageInfo {
    // Read just the header for metadata
    const header = fs.readFileSync(this.path, { start: 0, end: 100 });
    // Parse header for dimensions...
    return {
      width: 4096,
      height: 2160,
      format: 'png',
      size: fs.statSync(this.path).size
    };
  }
}

// Usage
const gallery: Image[] = [
  new ImageProxy('/images/photo1.png'),
  new ImageProxy('/images/photo2.png'),
  new ImageProxy('/images/photo3.png'),
  // Images not loaded yet - just proxies created
];

// Only loads the first image
gallery[0].display();

// Can get info without loading
console.log(gallery[1].getInfo());
```

## Structure

```
┌─────────────────┐         ┌─────────────────────┐
│     Client      │────────▶│       Subject       │
└─────────────────┘         │    <<interface>>    │
                            ├─────────────────────┤
                            │ + request()         │
                            └─────────────────────┘
                                      △
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
            ┌───────┴───────┐                   ┌───────┴───────┐
            │     Proxy     │──────────────────▶│  RealSubject  │
            │               │   references      │               │
            │ + request()   │                   │ + request()   │
            └───────────────┘                   └───────────────┘
```

## JavaScript/TypeScript Implementations

### Using ES6 Proxy

JavaScript has a built-in `Proxy` object that's perfect for this pattern:

```typescript
// Target object
const user = {
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',
  role: 'user'
};

// Logging Proxy
const loggingProxy = new Proxy(user, {
  get(target, property, receiver) {
    console.log(`Accessing property: ${String(property)}`);
    return Reflect.get(target, property, receiver);
  },

  set(target, property, value, receiver) {
    console.log(`Setting property: ${String(property)} = ${value}`);
    return Reflect.set(target, property, value, receiver);
  }
});

loggingProxy.name; // Logs: Accessing property: name
loggingProxy.name = 'Jane'; // Logs: Setting property: name = Jane

// Protection Proxy - hide sensitive fields
const protectionProxy = new Proxy(user, {
  get(target, property) {
    const sensitiveFields = ['password', 'email'];
    if (sensitiveFields.includes(property as string)) {
      throw new Error(`Access denied to ${String(property)}`);
    }
    return Reflect.get(target, property);
  }
});

protectionProxy.name; // 'John'
protectionProxy.password; // Error: Access denied to password

// Validation Proxy
interface UserData {
  name: string;
  age: number;
  email: string;
}

function createValidatedUser(data: UserData): UserData {
  return new Proxy(data, {
    set(target, property, value) {
      if (property === 'age' && (typeof value !== 'number' || value < 0)) {
        throw new Error('Age must be a positive number');
      }
      if (property === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error('Invalid email format');
      }
      return Reflect.set(target, property, value);
    }
  });
}

const validatedUser = createValidatedUser({ name: 'John', age: 30, email: 'john@test.com' });
validatedUser.age = -5; // Error: Age must be a positive number
```

### Caching Proxy

```typescript
interface DataService {
  fetchUser(id: string): Promise<User>;
  fetchPosts(userId: string): Promise<Post[]>;
  fetchComments(postId: string): Promise<Comment[]>;
}

class APIService implements DataService {
  async fetchUser(id: string): Promise<User> {
    console.log(`Fetching user ${id} from API...`);
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  async fetchPosts(userId: string): Promise<Post[]> {
    console.log(`Fetching posts for user ${userId} from API...`);
    const response = await fetch(`/api/users/${userId}/posts`);
    return response.json();
  }

  async fetchComments(postId: string): Promise<Comment[]> {
    console.log(`Fetching comments for post ${postId} from API...`);
    const response = await fetch(`/api/posts/${postId}/comments`);
    return response.json();
  }
}

class CachingProxy implements DataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number;

  constructor(
    private service: DataService,
    ttlMs: number = 60000 // 1 minute default
  ) {
    this.ttl = ttlMs;
  }

  async fetchUser(id: string): Promise<User> {
    return this.withCache(`user:${id}`, () => this.service.fetchUser(id));
  }

  async fetchPosts(userId: string): Promise<Post[]> {
    return this.withCache(`posts:${userId}`, () => this.service.fetchPosts(userId));
  }

  async fetchComments(postId: string): Promise<Comment[]> {
    return this.withCache(`comments:${postId}`, () => this.service.fetchComments(postId));
  }

  private async withCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Cache hit for ${key}`);
      return cached.data;
    }

    console.log(`Cache miss for ${key}`);
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Usage
const apiService = new APIService();
const cachedService = new CachingProxy(apiService, 30000); // 30 second TTL

await cachedService.fetchUser('123'); // API call
await cachedService.fetchUser('123'); // Cache hit
await cachedService.fetchUser('456'); // API call (different user)
```

### Protection Proxy with Roles

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  owner: string;
}

interface DocumentService {
  read(id: string): Promise<Document>;
  write(id: string, content: string): Promise<void>;
  delete(id: string): Promise<void>;
}

class DocumentRepository implements DocumentService {
  private documents: Map<string, Document> = new Map();

  async read(id: string): Promise<Document> {
    const doc = this.documents.get(id);
    if (!doc) throw new NotFoundError('Document');
    return doc;
  }

  async write(id: string, content: string): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      doc.content = content;
    }
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }
}

interface User {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
}

class ProtectedDocumentService implements DocumentService {
  constructor(
    private service: DocumentService,
    private currentUser: User
  ) {}

  async read(id: string): Promise<Document> {
    // Everyone can read
    return this.service.read(id);
  }

  async write(id: string, content: string): Promise<void> {
    const doc = await this.service.read(id);

    // Only admin, editor, or owner can write
    if (
      this.currentUser.role === 'admin' ||
      this.currentUser.role === 'editor' ||
      doc.owner === this.currentUser.id
    ) {
      return this.service.write(id, content);
    }

    throw new ForbiddenError('You do not have permission to edit this document');
  }

  async delete(id: string): Promise<void> {
    const doc = await this.service.read(id);

    // Only admin or owner can delete
    if (
      this.currentUser.role === 'admin' ||
      doc.owner === this.currentUser.id
    ) {
      return this.service.delete(id);
    }

    throw new ForbiddenError('You do not have permission to delete this document');
  }
}

// Usage
const repository = new DocumentRepository();

// Different users get different access
const adminService = new ProtectedDocumentService(repository, { id: '1', role: 'admin' });
const viewerService = new ProtectedDocumentService(repository, { id: '2', role: 'viewer' });

await adminService.delete('doc1'); // OK
await viewerService.delete('doc1'); // ForbiddenError
```

### Remote Proxy (API Client)

```typescript
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// Remote proxy - handles all network concerns
class UserServiceProxy implements UserService {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>('GET', `/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>('PUT', `/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.request<void>('DELETE', `/users/${id}`);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, error.message || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}

// Client code doesn't know it's talking to a remote service
const userService: UserService = new UserServiceProxy(
  'https://api.example.com',
  'token123'
);

const user = await userService.getUser('123');
```

### Reactive Proxy (Vue.js style)

```typescript
type EffectFn = () => void;

let activeEffect: EffectFn | null = null;
const targetMap = new WeakMap<object, Map<string | symbol, Set<EffectFn>>>();

function track(target: object, key: string | symbol) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
}

function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (deps) {
    deps.forEach(effect => effect());
  }
}

function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key);

      // Recursively make nested objects reactive
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }

      return result;
    },

    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key);
      return result;
    }
  });
}

function effect(fn: EffectFn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

// Usage
const state = reactive({
  count: 0,
  user: {
    name: 'John'
  }
});

// This effect re-runs when state.count changes
effect(() => {
  console.log(`Count is: ${state.count}`);
});

state.count++; // Logs: Count is: 1
state.count++; // Logs: Count is: 2

// Nested reactivity
effect(() => {
  console.log(`User name is: ${state.user.name}`);
});

state.user.name = 'Jane'; // Logs: User name is: Jane
```

## Real-World Applications

### Rate Limiting Proxy

```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

function createRateLimitedProxy<T extends object>(
  target: T,
  config: RateLimitConfig
): T {
  const requests: number[] = [];

  return new Proxy(target, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      if (typeof value !== 'function') {
        return value;
      }

      return async function(...args: any[]) {
        const now = Date.now();

        // Remove old requests outside window
        while (requests.length && requests[0] < now - config.windowMs) {
          requests.shift();
        }

        if (requests.length >= config.maxRequests) {
          const waitTime = requests[0] + config.windowMs - now;
          throw new RateLimitError(`Rate limit exceeded. Retry after ${waitTime}ms`);
        }

        requests.push(now);
        return value.apply(target, args);
      };
    }
  });
}

// Usage
const apiClient = {
  async fetchData(id: string) {
    return fetch(`/api/data/${id}`).then(r => r.json());
  },

  async postData(data: any) {
    return fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(r => r.json());
  }
};

const rateLimitedClient = createRateLimitedProxy(apiClient, {
  maxRequests: 10,
  windowMs: 60000 // 10 requests per minute
});

await rateLimitedClient.fetchData('123'); // OK
// After 10 requests...
await rateLimitedClient.fetchData('456'); // RateLimitError
```

## When to Use

**Use Proxy when:**
- You need lazy initialization (Virtual Proxy)
- You need access control (Protection Proxy)
- You need a local object representing a remote service (Remote Proxy)
- You need to cache expensive operations (Caching Proxy)
- You need to log or audit access (Logging Proxy)

**Don't use Proxy when:**
- Direct access is sufficient
- The overhead isn't justified
- You're just wrapping without adding behavior

## Related Patterns

- **Adapter:** Changes interface; Proxy provides same interface
- **Decorator:** Adds responsibilities; Proxy controls access
- **Facade:** Simplifies multiple interfaces; Proxy controls single object
