# Composite Pattern

## Intent

Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.

## The Problem

You need to represent hierarchical structures where:
- Containers can hold both individual items and other containers
- Clients should treat simple and complex elements the same way
- Operations should propagate through the hierarchy

### Common Scenarios

- File systems (files and folders)
- UI components (elements and containers)
- Organization structures (employees and departments)
- Menu systems (items and submenus)
- Graphics (shapes and groups of shapes)

## The Solution

Define a component interface that both leaf nodes and composite nodes implement:

```typescript
// Component interface
interface FileSystemNode {
  getName(): string;
  getSize(): number;
  print(indent?: string): void;
  getPath(): string;
  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[];
}

// Leaf - no children
class File implements FileSystemNode {
  constructor(
    private name: string,
    private size: number,
    private parent?: Directory
  ) {}

  getName(): string {
    return this.name;
  }

  getSize(): number {
    return this.size;
  }

  getPath(): string {
    return this.parent
      ? `${this.parent.getPath()}/${this.name}`
      : this.name;
  }

  print(indent: string = ''): void {
    console.log(`${indent}📄 ${this.name} (${this.formatSize(this.size)})`);
  }

  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[] {
    return predicate(this) ? [this] : [];
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }
}

// Composite - can have children
class Directory implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(
    private name: string,
    private parent?: Directory
  ) {}

  getName(): string {
    return this.name;
  }

  getSize(): number {
    // Aggregate size from all children
    return this.children.reduce((total, child) => total + child.getSize(), 0);
  }

  getPath(): string {
    return this.parent
      ? `${this.parent.getPath()}/${this.name}`
      : this.name;
  }

  print(indent: string = ''): void {
    console.log(`${indent}📁 ${this.name}/`);
    this.children.forEach(child => child.print(indent + '  '));
  }

  find(predicate: (node: FileSystemNode) => boolean): FileSystemNode[] {
    const results: FileSystemNode[] = predicate(this) ? [this] : [];
    this.children.forEach(child => {
      results.push(...child.find(predicate));
    });
    return results;
  }

  // Composite-specific methods
  add(node: FileSystemNode): this {
    this.children.push(node);
    return this;
  }

  remove(node: FileSystemNode): void {
    const index = this.children.indexOf(node);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  getChildren(): FileSystemNode[] {
    return [...this.children];
  }
}

// Usage
const root = new Directory('project');

const src = new Directory('src', root);
src.add(new File('index.ts', 1024, src));
src.add(new File('app.ts', 2048, src));

const components = new Directory('components', src);
components.add(new File('Button.tsx', 512, components));
components.add(new File('Modal.tsx', 1536, components));

src.add(components);
root.add(src);

root.add(new File('package.json', 256, root));
root.add(new File('README.md', 4096, root));

// Uniform treatment
root.print();
// 📁 project/
//   📁 src/
//     📄 index.ts (1.0KB)
//     📄 app.ts (2.0KB)
//     📁 components/
//       📄 Button.tsx (512B)
//       📄 Modal.tsx (1.5KB)
//   📄 package.json (256B)
//   📄 README.md (4.0KB)

console.log(`Total size: ${root.getSize()} bytes`); // 9472 bytes

// Find all TypeScript files
const tsFiles = root.find(node => node.getName().endsWith('.ts'));
console.log('TypeScript files:', tsFiles.map(f => f.getPath()));
```

## Structure

```
                 ┌─────────────────────┐
                 │     Component       │
                 │   <<interface>>     │
                 ├─────────────────────┤
         ┌──────▶│ + operation()       │◀───────┐
         │       │ + add(Component)    │        │
         │       │ + remove(Component) │        │
         │       │ + getChild(i)       │        │
         │       └─────────────────────┘        │
         │                 △                    │
         │                 │                    │
         │       ┌─────────┴─────────┐          │
         │       │                   │          │
         │  ┌────┴────┐        ┌─────┴─────┐    │
         │  │  Leaf   │        │ Composite │────┘
         │  │         │        │           │ children
         │  │+operation│        │+operation │
         │  └─────────┘        │+add       │
         │                     │+remove    │
         │                     │+getChild  │
         │                     └───────────┘
         │                           │
         └───────────────────────────┘
              uses uniformly
```

## Real-World Applications

### 1. UI Component Tree

```typescript
interface UIComponent {
  render(): string;
  getBoundingBox(): { width: number; height: number };
  handleClick(x: number, y: number): void;
  setStyle(style: Partial<CSSProperties>): void;
}

abstract class BaseComponent implements UIComponent {
  protected style: CSSProperties = {};
  protected eventHandlers: Map<string, Function[]> = new Map();

  abstract render(): string;
  abstract getBoundingBox(): { width: number; height: number };

  handleClick(x: number, y: number): void {
    const handlers = this.eventHandlers.get('click') || [];
    handlers.forEach(h => h({ x, y }));
  }

  setStyle(style: Partial<CSSProperties>): void {
    this.style = { ...this.style, ...style };
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  protected styleToString(): string {
    return Object.entries(this.style)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
      .join('; ');
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// Leaf components
class Button extends BaseComponent {
  constructor(private label: string) {
    super();
  }

  render(): string {
    return `<button style="${this.styleToString()}">${this.label}</button>`;
  }

  getBoundingBox() {
    return { width: 100, height: 40 };
  }
}

class TextInput extends BaseComponent {
  constructor(private placeholder: string) {
    super();
  }

  render(): string {
    return `<input type="text" placeholder="${this.placeholder}" style="${this.styleToString()}" />`;
  }

  getBoundingBox() {
    return { width: 200, height: 36 };
  }
}

class Image extends BaseComponent {
  constructor(private src: string, private alt: string) {
    super();
  }

  render(): string {
    return `<img src="${this.src}" alt="${this.alt}" style="${this.styleToString()}" />`;
  }

  getBoundingBox() {
    const width = parseInt(this.style.width as string) || 100;
    const height = parseInt(this.style.height as string) || 100;
    return { width, height };
  }
}

// Composite components
class Container extends BaseComponent {
  protected children: UIComponent[] = [];

  add(child: UIComponent): this {
    this.children.push(child);
    return this;
  }

  remove(child: UIComponent): void {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
  }

  render(): string {
    const childrenHtml = this.children.map(c => c.render()).join('\n');
    return `<div style="${this.styleToString()}">\n${childrenHtml}\n</div>`;
  }

  getBoundingBox() {
    let width = 0;
    let height = 0;
    this.children.forEach(child => {
      const box = child.getBoundingBox();
      width = Math.max(width, box.width);
      height += box.height;
    });
    return { width, height };
  }

  handleClick(x: number, y: number): void {
    super.handleClick(x, y);
    // Propagate to children
    this.children.forEach(child => child.handleClick(x, y));
  }

  setStyle(style: Partial<CSSProperties>): void {
    super.setStyle(style);
    // Optionally propagate certain styles to children
  }
}

class Form extends Container {
  constructor(private action: string, private method: string = 'POST') {
    super();
  }

  render(): string {
    const childrenHtml = this.children.map(c => c.render()).join('\n');
    return `<form action="${this.action}" method="${this.method}" style="${this.styleToString()}">\n${childrenHtml}\n</form>`;
  }
}

class FlexContainer extends Container {
  constructor(direction: 'row' | 'column' = 'row') {
    super();
    this.style = {
      display: 'flex',
      flexDirection: direction
    };
  }

  getBoundingBox() {
    const isRow = this.style.flexDirection === 'row';
    let width = 0;
    let height = 0;

    this.children.forEach(child => {
      const box = child.getBoundingBox();
      if (isRow) {
        width += box.width;
        height = Math.max(height, box.height);
      } else {
        width = Math.max(width, box.width);
        height += box.height;
      }
    });

    return { width, height };
  }
}

// Usage - build UI tree
const loginForm = new Form('/api/login')
  .add(new TextInput('Email'))
  .add(new TextInput('Password'))
  .add(new Button('Login'));

const sidebar = new FlexContainer('column');
sidebar.add(new Image('/logo.png', 'Logo'));
sidebar.add(loginForm);
sidebar.setStyle({ width: '300px', padding: '20px' });

const mainContent = new Container();
mainContent.add(new Button('Action 1'));
mainContent.add(new Button('Action 2'));

const layout = new FlexContainer('row');
layout.add(sidebar);
layout.add(mainContent);

console.log(layout.render());
console.log('Total size:', layout.getBoundingBox());
```

### 2. Menu System

```typescript
interface MenuItem {
  getName(): string;
  getPrice(): number | null; // null for categories
  isAvailable(): boolean;
  print(indent?: string): void;
  accept(visitor: MenuVisitor): void;
}

interface MenuVisitor {
  visitItem(item: MenuItemLeaf): void;
  visitCategory(category: MenuCategory): void;
}

class MenuItemLeaf implements MenuItem {
  constructor(
    private name: string,
    private price: number,
    private available: boolean = true,
    private description?: string,
    private allergens?: string[]
  ) {}

  getName(): string {
    return this.name;
  }

  getPrice(): number {
    return this.price;
  }

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  print(indent: string = ''): void {
    const status = this.available ? '' : ' [SOLD OUT]';
    const price = `$${this.price.toFixed(2)}`;
    console.log(`${indent}• ${this.name} - ${price}${status}`);
    if (this.description) {
      console.log(`${indent}  ${this.description}`);
    }
    if (this.allergens?.length) {
      console.log(`${indent}  ⚠️ Contains: ${this.allergens.join(', ')}`);
    }
  }

  accept(visitor: MenuVisitor): void {
    visitor.visitItem(this);
  }
}

class MenuCategory implements MenuItem {
  private items: MenuItem[] = [];

  constructor(
    private name: string,
    private description?: string
  ) {}

  getName(): string {
    return this.name;
  }

  getPrice(): number | null {
    return null; // Categories don't have prices
  }

  isAvailable(): boolean {
    // Category is available if any item is available
    return this.items.some(item => item.isAvailable());
  }

  add(item: MenuItem): this {
    this.items.push(item);
    return this;
  }

  remove(item: MenuItem): void {
    const index = this.items.indexOf(item);
    if (index !== -1) this.items.splice(index, 1);
  }

  getItems(): MenuItem[] {
    return [...this.items];
  }

  print(indent: string = ''): void {
    console.log(`${indent}【${this.name}】`);
    if (this.description) {
      console.log(`${indent}  ${this.description}`);
    }
    this.items.forEach(item => item.print(indent + '  '));
  }

  accept(visitor: MenuVisitor): void {
    visitor.visitCategory(this);
    this.items.forEach(item => item.accept(visitor));
  }
}

// Visitors for different operations
class TotalPriceCalculator implements MenuVisitor {
  total: number = 0;

  visitItem(item: MenuItemLeaf): void {
    if (item.isAvailable()) {
      this.total += item.getPrice();
    }
  }

  visitCategory(_category: MenuCategory): void {
    // Categories don't contribute to total
  }
}

class AvailableItemsCollector implements MenuVisitor {
  items: string[] = [];

  visitItem(item: MenuItemLeaf): void {
    if (item.isAvailable()) {
      this.items.push(item.getName());
    }
  }

  visitCategory(_category: MenuCategory): void {}
}

// Usage
const menu = new MenuCategory('Restaurant Menu');

const appetizers = new MenuCategory('Appetizers', 'Start your meal right');
appetizers
  .add(new MenuItemLeaf('Soup of the Day', 6.99, true, 'Ask your server'))
  .add(new MenuItemLeaf('Nachos', 9.99, true, 'Loaded with cheese and jalapeños', ['dairy']))
  .add(new MenuItemLeaf('Wings', 11.99, false, '12 crispy wings'));

const mains = new MenuCategory('Main Courses');
mains
  .add(new MenuItemLeaf('Burger', 14.99, true, 'Angus beef with all the fixings', ['gluten', 'dairy']))
  .add(new MenuItemLeaf('Salmon', 22.99, true, 'Atlantic salmon with vegetables', ['fish']))
  .add(new MenuItemLeaf('Pasta', 16.99, true, 'Fresh pasta with marinara', ['gluten']));

const desserts = new MenuCategory('Desserts');
desserts
  .add(new MenuItemLeaf('Ice Cream', 5.99, true, 'Three scoops', ['dairy']))
  .add(new MenuItemLeaf('Cake', 7.99, true, 'Chocolate layer cake', ['gluten', 'dairy', 'eggs']));

menu.add(appetizers);
menu.add(mains);
menu.add(desserts);

// Print entire menu
menu.print();

// Use visitors
const priceCalc = new TotalPriceCalculator();
menu.accept(priceCalc);
console.log(`\nTotal menu value: $${priceCalc.total.toFixed(2)}`);

const availableCollector = new AvailableItemsCollector();
menu.accept(availableCollector);
console.log('\nAvailable items:', availableCollector.items);
```

### 3. Organization Structure

```typescript
interface OrganizationUnit {
  getName(): string;
  getSalaryBudget(): number;
  getHeadcount(): number;
  print(indent?: string): void;
  findByName(name: string): OrganizationUnit | null;
}

class Employee implements OrganizationUnit {
  constructor(
    private name: string,
    private title: string,
    private salary: number
  ) {}

  getName(): string {
    return this.name;
  }

  getTitle(): string {
    return this.title;
  }

  getSalaryBudget(): number {
    return this.salary;
  }

  getHeadcount(): number {
    return 1;
  }

  print(indent: string = ''): void {
    console.log(`${indent}👤 ${this.name} (${this.title}) - $${this.salary.toLocaleString()}`);
  }

  findByName(name: string): OrganizationUnit | null {
    return this.name.toLowerCase().includes(name.toLowerCase()) ? this : null;
  }
}

class Department implements OrganizationUnit {
  private members: OrganizationUnit[] = [];

  constructor(
    private name: string,
    private leader?: Employee
  ) {}

  getName(): string {
    return this.name;
  }

  getLeader(): Employee | undefined {
    return this.leader;
  }

  setLeader(leader: Employee): void {
    this.leader = leader;
    // Ensure leader is in members
    if (!this.members.includes(leader)) {
      this.members.unshift(leader);
    }
  }

  add(member: OrganizationUnit): this {
    this.members.push(member);
    return this;
  }

  remove(member: OrganizationUnit): void {
    const index = this.members.indexOf(member);
    if (index !== -1) this.members.splice(index, 1);
  }

  getSalaryBudget(): number {
    return this.members.reduce((total, member) => total + member.getSalaryBudget(), 0);
  }

  getHeadcount(): number {
    return this.members.reduce((total, member) => total + member.getHeadcount(), 0);
  }

  print(indent: string = ''): void {
    const budget = this.getSalaryBudget().toLocaleString();
    console.log(`${indent}🏢 ${this.name} (${this.getHeadcount()} people, $${budget} budget)`);
    this.members.forEach(member => member.print(indent + '  '));
  }

  findByName(name: string): OrganizationUnit | null {
    if (this.name.toLowerCase().includes(name.toLowerCase())) {
      return this;
    }
    for (const member of this.members) {
      const found = member.findByName(name);
      if (found) return found;
    }
    return null;
  }

  getDirectReports(): OrganizationUnit[] {
    return [...this.members];
  }
}

// Build organization
const ceo = new Employee('Alice Smith', 'CEO', 500000);

const engineering = new Department('Engineering');
const vpEng = new Employee('Bob Johnson', 'VP Engineering', 300000);
engineering.setLeader(vpEng);

const frontend = new Department('Frontend Team');
frontend.setLeader(new Employee('Carol Williams', 'Frontend Lead', 180000));
frontend.add(new Employee('Dave Brown', 'Senior Developer', 150000));
frontend.add(new Employee('Eve Davis', 'Developer', 120000));
frontend.add(new Employee('Frank Miller', 'Developer', 110000));

const backend = new Department('Backend Team');
backend.setLeader(new Employee('Grace Wilson', 'Backend Lead', 180000));
backend.add(new Employee('Henry Taylor', 'Senior Developer', 150000));
backend.add(new Employee('Ivy Anderson', 'Developer', 120000));

engineering.add(frontend);
engineering.add(backend);

const sales = new Department('Sales');
sales.setLeader(new Employee('Jack Thomas', 'VP Sales', 280000));
sales.add(new Employee('Karen White', 'Account Executive', 90000));
sales.add(new Employee('Leo Harris', 'Account Executive', 85000));

const company = new Department('Acme Corp');
company.setLeader(ceo);
company.add(engineering);
company.add(sales);

// Operations work uniformly
company.print();
console.log(`\nTotal company budget: $${company.getSalaryBudget().toLocaleString()}`);
console.log(`Total headcount: ${company.getHeadcount()}`);

// Find specific unit
const found = company.findByName('Frontend');
if (found) {
  console.log('\nFound:');
  found.print();
}
```

## When to Use

**Use Composite when:**
- You want to represent part-whole hierarchies
- You want clients to treat leaf and composite objects uniformly
- The structure can be represented as a tree
- Operations should propagate through the hierarchy

**Don't use Composite when:**
- The structure isn't hierarchical
- Leaf and composite behaviors differ significantly
- You need to restrict which components can be nested

## Common Variations

### Transparent vs Safe Composite

**Transparent:** Component interface includes add/remove (shown above)
- Pro: Maximum uniformity
- Con: Leaf nodes have meaningless add/remove methods

**Safe:** Only Composite has add/remove
- Pro: Leaves don't have inappropriate methods
- Con: Client must know if dealing with leaf or composite

```typescript
// Safe approach - use type guards
function isComposite(node: FileSystemNode): node is Directory {
  return 'add' in node;
}

if (isComposite(node)) {
  node.add(newFile);
}
```

## Related Patterns

- **Decorator:** Also recursive composition, but adds behavior vs structure
- **Iterator:** Often used to traverse composite structures
- **Visitor:** Can perform operations across composite structure
- **Flyweight:** Can share leaf nodes to save memory
