# Facade Pattern

## Intent

Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.

## The Problem

Complex subsystems have many classes with intricate interactions. Clients need to understand too much to use them:

```typescript
// Without facade - client must orchestrate everything
async function createUserAccount(userData: UserData) {
  // Step 1: Validate user data
  const validator = new UserValidator();
  const schemaValidator = new SchemaValidator(userSchema);
  const emailValidator = new EmailValidator();

  if (!schemaValidator.validate(userData)) {
    throw new Error('Invalid schema');
  }
  if (!emailValidator.isValid(userData.email)) {
    throw new Error('Invalid email');
  }
  if (!validator.validateBusinessRules(userData)) {
    throw new Error('Business rule violation');
  }

  // Step 2: Hash password
  const hasher = new PasswordHasher('argon2');
  const salt = await hasher.generateSalt();
  const hashedPassword = await hasher.hash(userData.password, salt);

  // Step 3: Create database record
  const db = DatabaseConnection.getInstance();
  const userRepo = new UserRepository(db);
  const user = await userRepo.create({
    ...userData,
    password: hashedPassword
  });

  // Step 4: Create initial settings
  const settingsRepo = new SettingsRepository(db);
  await settingsRepo.createDefaults(user.id);

  // Step 5: Send welcome email
  const emailService = new EmailService(smtpConfig);
  const templateEngine = new TemplateEngine();
  const html = await templateEngine.render('welcome', { name: user.name });
  await emailService.send({
    to: user.email,
    subject: 'Welcome!',
    html
  });

  // Step 6: Track analytics
  const analytics = new AnalyticsService(analyticsConfig);
  await analytics.track('user_created', { userId: user.id });

  return user;
}
```

## The Solution

Create a facade that provides a simple interface and handles the complexity:

```typescript
// Facade - simple interface, complex implementation hidden
class UserRegistrationFacade {
  private validator: UserValidator;
  private passwordService: PasswordService;
  private userRepository: UserRepository;
  private settingsRepository: SettingsRepository;
  private emailService: EmailService;
  private analytics: AnalyticsService;

  constructor(config: RegistrationConfig) {
    this.validator = new UserValidator(config.validation);
    this.passwordService = new PasswordService(config.password);
    this.userRepository = new UserRepository(config.database);
    this.settingsRepository = new SettingsRepository(config.database);
    this.emailService = new EmailService(config.email);
    this.analytics = new AnalyticsService(config.analytics);
  }

  async registerUser(data: UserRegistrationDTO): Promise<User> {
    // Validate
    await this.validator.validate(data);

    // Create user with hashed password
    const hashedPassword = await this.passwordService.hash(data.password);
    const user = await this.userRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword
    });

    // Setup defaults
    await this.settingsRepository.createDefaults(user.id);

    // Send welcome email (don't await - fire and forget)
    this.emailService.sendWelcome(user).catch(console.error);

    // Track
    this.analytics.track('user_registered', { userId: user.id });

    return user;
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return; // Don't reveal if email exists

    const token = await this.passwordService.createResetToken(user.id);
    await this.emailService.sendPasswordReset(user, token);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');

    const valid = await this.passwordService.verify(oldPassword, user.password);
    if (!valid) throw new InvalidCredentialsError();

    const hashed = await this.passwordService.hash(newPassword);
    await this.userRepository.updatePassword(userId, hashed);
  }
}

// Usage - client code is simple
const registration = new UserRegistrationFacade(config);

const user = await registration.registerUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securePassword123'
});
```

## Structure

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                        Facade                             │
│                                                           │
│  + simpleOperation()                                      │
│  + anotherSimpleOperation()                               │
└────────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Subsystem A   │  │   Subsystem B   │  │   Subsystem C   │
│                 │  │                 │  │                 │
│ + operationA1() │  │ + operationB1() │  │ + operationC1() │
│ + operationA2() │  │ + operationB2() │  │ + operationC2() │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Real-World Applications

### 1. Media Converter Facade

```typescript
// Complex subsystems
class VideoDecoder {
  async decode(input: Buffer, format: string): Promise<RawVideo> { /* ... */ }
  getSupportedFormats(): string[] { return ['mp4', 'avi', 'mkv', 'webm']; }
}

class AudioDecoder {
  async decode(input: Buffer, format: string): Promise<RawAudio> { /* ... */ }
  async extractFromVideo(video: RawVideo): Promise<RawAudio> { /* ... */ }
}

class VideoEncoder {
  async encode(video: RawVideo, options: VideoOptions): Promise<Buffer> { /* ... */ }
}

class AudioEncoder {
  async encode(audio: RawAudio, options: AudioOptions): Promise<Buffer> { /* ... */ }
}

class Muxer {
  async combine(video: Buffer, audio: Buffer, format: string): Promise<Buffer> { /* ... */ }
}

class ThumbnailGenerator {
  async generate(video: RawVideo, timestamp: number): Promise<Buffer> { /* ... */ }
}

class MetadataExtractor {
  async extract(input: Buffer): Promise<MediaMetadata> { /* ... */ }
}

// Facade provides simple interface
class MediaConverterFacade {
  private videoDecoder = new VideoDecoder();
  private audioDecoder = new AudioDecoder();
  private videoEncoder = new VideoEncoder();
  private audioEncoder = new AudioEncoder();
  private muxer = new Muxer();
  private thumbnailGen = new ThumbnailGenerator();
  private metadataExtractor = new MetadataExtractor();

  async convert(
    input: Buffer,
    inputFormat: string,
    outputFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    // Decode
    const rawVideo = await this.videoDecoder.decode(input, inputFormat);
    const rawAudio = await this.audioDecoder.extractFromVideo(rawVideo);

    // Process
    const processedVideo = options.resize
      ? await this.resizeVideo(rawVideo, options.resize)
      : rawVideo;

    // Encode
    const encodedVideo = await this.videoEncoder.encode(processedVideo, {
      codec: options.videoCodec || 'h264',
      bitrate: options.videoBitrate || '2M',
      ...options.videoOptions
    });

    const encodedAudio = await this.audioEncoder.encode(rawAudio, {
      codec: options.audioCodec || 'aac',
      bitrate: options.audioBitrate || '128k',
      ...options.audioOptions
    });

    // Combine
    const output = await this.muxer.combine(encodedVideo, encodedAudio, outputFormat);

    // Generate thumbnail if requested
    const thumbnail = options.generateThumbnail
      ? await this.thumbnailGen.generate(rawVideo, options.thumbnailTime || 0)
      : undefined;

    return { output, thumbnail };
  }

  async getMetadata(input: Buffer): Promise<MediaMetadata> {
    return this.metadataExtractor.extract(input);
  }

  async extractAudio(input: Buffer, inputFormat: string, outputFormat: string): Promise<Buffer> {
    const rawVideo = await this.videoDecoder.decode(input, inputFormat);
    const rawAudio = await this.audioDecoder.extractFromVideo(rawVideo);
    return this.audioEncoder.encode(rawAudio, {
      codec: outputFormat === 'mp3' ? 'mp3' : 'aac',
      bitrate: '192k'
    });
  }

  async generateThumbnails(
    input: Buffer,
    inputFormat: string,
    count: number
  ): Promise<Buffer[]> {
    const rawVideo = await this.videoDecoder.decode(input, inputFormat);
    const metadata = await this.getMetadata(input);
    const duration = metadata.duration;

    const timestamps = Array.from(
      { length: count },
      (_, i) => (duration / (count + 1)) * (i + 1)
    );

    return Promise.all(
      timestamps.map(ts => this.thumbnailGen.generate(rawVideo, ts))
    );
  }

  private async resizeVideo(video: RawVideo, size: { width: number; height: number }): Promise<RawVideo> {
    // Resize implementation
    return video;
  }
}

// Usage - simple API
const converter = new MediaConverterFacade();

// Convert video
const result = await converter.convert(inputBuffer, 'avi', 'mp4', {
  resize: { width: 1920, height: 1080 },
  videoCodec: 'h264',
  audioBitrate: '256k',
  generateThumbnail: true
});

// Extract audio
const audioOnly = await converter.extractAudio(inputBuffer, 'mp4', 'mp3');

// Get info
const metadata = await converter.getMetadata(inputBuffer);
```

### 2. E-Commerce Checkout Facade

```typescript
class CheckoutFacade {
  constructor(
    private cartService: CartService,
    private inventoryService: InventoryService,
    private pricingService: PricingService,
    private taxService: TaxService,
    private shippingService: ShippingService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService
  ) {}

  async processCheckout(
    userId: string,
    paymentMethod: PaymentMethod,
    shippingAddress: Address,
    billingAddress?: Address
  ): Promise<Order> {
    // Get cart
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new EmptyCartError();
    }

    // Check inventory
    const inventoryCheck = await this.inventoryService.checkAvailability(cart.items);
    if (!inventoryCheck.allAvailable) {
      throw new InsufficientInventoryError(inventoryCheck.unavailableItems);
    }

    // Calculate totals
    const subtotal = await this.pricingService.calculateSubtotal(cart.items);
    const discounts = await this.pricingService.applyDiscounts(cart.items, userId);
    const tax = await this.taxService.calculate(subtotal - discounts, shippingAddress);
    const shippingOptions = await this.shippingService.getOptions(cart.items, shippingAddress);
    const shipping = shippingOptions[0]; // Default to cheapest

    const total = subtotal - discounts + tax + shipping.cost;

    // Reserve inventory
    const reservation = await this.inventoryService.reserve(cart.items);

    try {
      // Process payment
      const payment = await this.paymentService.charge({
        amount: total,
        currency: 'USD',
        method: paymentMethod,
        billingAddress: billingAddress || shippingAddress
      });

      // Create order
      const order = await this.orderService.create({
        userId,
        items: cart.items,
        subtotal,
        discounts,
        tax,
        shipping: shipping.cost,
        total,
        paymentId: payment.id,
        shippingAddress,
        status: 'confirmed'
      });

      // Commit inventory
      await this.inventoryService.commit(reservation);

      // Clear cart
      await this.cartService.clear(userId);

      // Send confirmation (async)
      this.notificationService.sendOrderConfirmation(order).catch(console.error);

      // Track analytics (async)
      this.analyticsService.trackPurchase(order).catch(console.error);

      return order;

    } catch (error) {
      // Release inventory reservation
      await this.inventoryService.release(reservation);
      throw error;
    }
  }

  async getCheckoutSummary(userId: string, shippingAddress: Address): Promise<CheckoutSummary> {
    const cart = await this.cartService.getCart(userId);
    const subtotal = await this.pricingService.calculateSubtotal(cart.items);
    const discounts = await this.pricingService.applyDiscounts(cart.items, userId);
    const tax = await this.taxService.calculate(subtotal - discounts, shippingAddress);
    const shippingOptions = await this.shippingService.getOptions(cart.items, shippingAddress);

    return {
      items: cart.items,
      subtotal,
      discounts,
      tax,
      shippingOptions,
      estimatedTotal: subtotal - discounts + tax + shippingOptions[0].cost
    };
  }
}

// Usage
const checkout = new CheckoutFacade(/* dependencies */);

// Simple checkout flow
const summary = await checkout.getCheckoutSummary(userId, shippingAddress);
console.log(`Total: $${summary.estimatedTotal}`);

const order = await checkout.processCheckout(
  userId,
  { type: 'card', token: 'tok_xxx' },
  shippingAddress
);
```

### 3. Cloud Storage Facade

```typescript
interface StorageOptions {
  bucket?: string;
  path?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

class CloudStorageFacade {
  private s3: S3Client;
  private cloudfront: CloudFrontClient;
  private imageProcessor: ImageProcessor;
  private encryptionService: EncryptionService;

  constructor(config: StorageConfig) {
    this.s3 = new S3Client(config.s3);
    this.cloudfront = new CloudFrontClient(config.cloudfront);
    this.imageProcessor = new ImageProcessor();
    this.encryptionService = new EncryptionService(config.encryption);
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    options: StorageOptions = {}
  ): Promise<UploadResult> {
    const bucket = options.bucket || 'default-bucket';
    const key = options.path ? `${options.path}/${filename}` : filename;

    // Detect content type
    const contentType = options.contentType || this.detectContentType(filename);

    // Encrypt if sensitive
    const processedFile = options.metadata?.sensitive === 'true'
      ? await this.encryptionService.encrypt(file)
      : file;

    // Upload to S3
    await this.s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: processedFile,
      ContentType: contentType,
      Metadata: options.metadata,
      ACL: options.acl || 'private'
    });

    // Get URL (signed or public)
    const url = options.acl === 'public-read'
      ? `https://${bucket}.s3.amazonaws.com/${key}`
      : await this.getSignedUrl(bucket, key);

    return { key, url, bucket, contentType };
  }

  async uploadImage(
    file: Buffer,
    filename: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    const results: ImageUploadResult = {
      original: null as any,
      variants: {}
    };

    // Upload original
    results.original = await this.uploadFile(file, filename, options);

    // Generate and upload variants
    const variants = options.variants || ['thumbnail', 'medium', 'large'];

    for (const variant of variants) {
      const processed = await this.imageProcessor.resize(file, VARIANT_SIZES[variant]);
      const variantFilename = this.addVariantSuffix(filename, variant);
      results.variants[variant] = await this.uploadFile(processed, variantFilename, options);
    }

    // Invalidate CDN cache if updating existing file
    if (options.invalidateCache) {
      await this.cloudfront.createInvalidation({
        DistributionId: options.distributionId,
        InvalidationBatch: {
          Paths: { Quantity: 1, Items: [`/${results.original.key}`] },
          CallerReference: Date.now().toString()
        }
      });
    }

    return results;
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: bucket || 'default-bucket',
      Key: key
    });
  }

  async getSignedUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
    return this.s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn
    });
  }

  async downloadFile(key: string, bucket?: string): Promise<Buffer> {
    const response = await this.s3.getObject({
      Bucket: bucket || 'default-bucket',
      Key: key
    });

    const data = await this.streamToBuffer(response.Body);

    // Decrypt if encrypted
    if (response.Metadata?.encrypted === 'true') {
      return this.encryptionService.decrypt(data);
    }

    return data;
  }

  private detectContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      json: 'application/json'
    };
    return types[ext || ''] || 'application/octet-stream';
  }

  private addVariantSuffix(filename: string, variant: string): string {
    const parts = filename.split('.');
    const ext = parts.pop();
    return `${parts.join('.')}_${variant}.${ext}`;
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    // Implementation
    return Buffer.from([]);
  }
}

// Usage
const storage = new CloudStorageFacade(config);

// Simple upload
const result = await storage.uploadFile(buffer, 'document.pdf', {
  path: 'documents/2024',
  acl: 'private'
});

// Image upload with automatic variants
const imageResult = await storage.uploadImage(imageBuffer, 'profile.jpg', {
  path: 'avatars',
  acl: 'public-read',
  variants: ['thumbnail', 'medium']
});

// Get signed download URL
const downloadUrl = await storage.getSignedUrl('default-bucket', 'documents/2024/document.pdf');
```

## When to Use

**Use Facade when:**
- You need a simple interface to a complex subsystem
- There are many dependencies between clients and implementation classes
- You want to layer your subsystems (facade per layer)
- You want to decouple clients from subsystem components

**Don't use Facade when:**
- The subsystem is already simple
- You need full access to subsystem flexibility
- You're just wrapping a single class (that's just a wrapper, not a facade)

## Key Points

**Facade doesn't hide the subsystem:**
- Clients can still use subsystem classes directly when needed
- Facade is an additional option, not a restriction

**Facade vs Adapter:**
- Adapter converts an interface; Facade simplifies an interface
- Adapter works with single class; Facade works with entire subsystem

**Multiple Facades:**
- Large subsystems might have multiple facades for different purposes
- Example: `UserRegistrationFacade`, `UserAuthenticationFacade`, `UserProfileFacade`

## Related Patterns

- **Adapter:** Converts interface; Facade simplifies
- **Mediator:** Centralizes complex communication between objects
- **Singleton:** Facades are often singletons
- **Abstract Factory:** Can be used with Facade to create subsystem objects
