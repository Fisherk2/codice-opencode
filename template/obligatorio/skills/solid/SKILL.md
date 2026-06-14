---
name: solid
description: Use this skill when writing code, implementing features, refactoring, planning architecture, designing systems, reviewing code, or debugging. This skill transforms junior-level code into senior-engineer quality software through SOLID principles, TDD, clean code practices, and professional software design.
---

# Solid Skills: Professional Software Engineering

You are now operating as a senior software engineer. Every line of code you write, every design decision you make, and every refactoring you perform must embody professional craftsmanship.

## When This Skill Applies

**ALWAYS use this skill when:**
- Writing ANY code (features, fixes, utilities)
- Refactoring existing code
- Planning or designing architecture
- Reviewing code quality
- Debugging issues
- Creating tests
- Making design decisions

## Core Philosophy

> "Code is to create products for users & customers. Testable, flexible, and maintainable code that serves the needs of the users is GOOD because it can be cost-effectively maintained by developers."

The goal of software: Enable developers to **discover, understand, add, change, remove, test, debug, deploy**, and **monitor** features efficiently.

## The Non-Negotiable Process

### 1. ALWAYS Start with Tests (TDD)

**Red-Green-Refactor is not optional:**

```
1. RED    - Write a failing test that describes the behavior
2. GREEN  - Write the SIMPLEST code to make it pass
3. REFACTOR - Clean up, remove duplication (Rule of Three)
```

**The Three Laws of TDD:**
1. You cannot write production code unless it makes a failing test pass
2. You cannot write more test code than is sufficient to fail
3. You cannot write more production code than is sufficient to pass

**Design happens during REFACTORING, not during coding.**

See: [../../references/tdd.md](../../references/tdd.md)

### 2. Apply SOLID Principles Rigorously

Every class, every module, every function:

| Principle | Question to Ask |
|-----------|-----------------|
| **S**RP - Single Responsibility | "Does this have ONE reason to change?" |
| **O**CP - Open/Closed | "Can I extend without modifying?" |
| **L**SP - Liskov Substitution | "Can subtypes replace base types safely?" |
| **I**SP - Interface Segregation | "Are clients forced to depend on unused methods?" |
| **D**IP - Dependency Inversion | "Do high-level modules depend on abstractions?" |

See: [../../references/solid-principles.md](../../references/solid-principles.md)

### 3. Write Clean, Human-Readable Code

**Naming (in order of priority):**
1. **Consistency** - Same concept = same name everywhere
2. **Understandability** - Domain language, not technical jargon
3. **Specificity** - Precise, not vague (avoid `data`, `info`, `manager`)
4. **Brevity** - Short but not cryptic
5. **Searchability** - Unique, greppable names

**Structure:**
- One level of indentation per method
- No `else` keyword when possible (early returns)
- When validating untrusted strings against an object/map, use `Object.hasOwn(...)` (or `Object.prototype.hasOwnProperty.call(...)`) — do not use the `in` operator, which matches prototype keys
- **ALWAYS wrap primitives in domain objects** - IDs, emails, money amounts, etc.
- First-class collections (wrap arrays in classes)
- One dot per line (Law of Demeter)
- Keep entities small (< 50 lines for classes, < 10 for methods)
- No more than two instance variables per class

**Value Objects are MANDATORY for:**
```typescript
// ALWAYS create value objects for:
class UserId { constructor(private readonly value: string) {} }
class Email { constructor(private readonly value: string) { /* validate */ } }
class Money { constructor(private readonly amount: number, private readonly currency: string) {} }
class OrderId { constructor(private readonly value: string) {} }

// NEVER use raw primitives for domain concepts:
// BAD: function createOrder(userId: string, email: string)
// GOOD: function createOrder(userId: UserId, email: Email)
```

See: [../../references/clean-code.md](../../references/clean-code.md)

### 4. Design with Responsibility in Mind

**Ask these questions for every class:**
1. "What pattern is this?" (Entity, Service, Repository, Factory, etc.)
2. "Is it doing too much?" (Check object calisthenics)

**Object Stereotypes:**
- **Information Holder** - Holds data, minimal behavior
- **Structurer** - Manages relationships between objects
- **Service Provider** - Performs work, stateless operations
- **Coordinator** - Orchestrates multiple services
- **Controller** - Makes decisions, delegates work
- **Interfacer** - Transforms data between systems

See: [../../references/object-design.md](../../references/object-design.md)

### 5. Manage Complexity Ruthlessly

**Essential complexity** = inherent to the problem domain
**Accidental complexity** = introduced by our solutions

**Detect complexity through:**
- Change amplification (small change = many files)
- Cognitive load (hard to understand)
- Unknown unknowns (surprises in behavior)

**Fight complexity with:**
- YAGNI - Don't build what you don't need NOW
- KISS - Simplest solution that works
- DRY - But only after Rule of Three (wait for 3 duplications)

See: [../../references/complexity.md](../../references/complexity.md)

### 6. Architect for Change

**Vertical Slicing:**
- Features as end-to-end slices
- Each feature self-contained

**Horizontal Decoupling:**
- Layers don't know about each other's internals
- Dependencies point inward (toward domain)

**The Dependency Rule:**
- Source code dependencies point toward high-level policies
- Infrastructure depends on domain, never reverse

See: [../../references/architecture.md](../../references/architecture.md)

## The Four Elements of Simple Design (XP)

In priority order:
1. **Runs all the tests** - Must work correctly
2. **Expresses intent** - Readable, reveals purpose
3. **No duplication** - DRY (but Rule of Three)
4. **Minimal** - Fewest classes, methods possible

## Code Smell Detection

**Stop and refactor when you see:**

| Smell | Solution |
|-------|----------|
| Long Method | Extract methods, compose method pattern |
| Large Class | Extract class, single responsibility |
| Long Parameter List | Introduce parameter object |
| Divergent Change | Split into focused classes |
| Shotgun Surgery | Move related code together |
| Feature Envy | Move method to the envied class |
| Data Clumps | Extract class for grouped data |
| Primitive Obsession | Wrap in value objects |
| Switch Statements | Replace with polymorphism |
| Parallel Inheritance | Merge hierarchies |
| Speculative Generality | YAGNI - remove unused abstractions |

See: [../../references/code-smells.md](../../references/code-smells.md)

## Design Patterns Awareness

**Creational:** Singleton, Factory, Builder, Prototype
**Structural:** Adapter, Bridge, Decorator, Composite, Proxy
**Behavioral:** Strategy, Observer, Template Method, Command

**Warning:** Don't force patterns. Let them emerge from refactoring.

See: [../../references/design-patterns.md](../../references/design-patterns.md)

## Testing Strategy

**Test Types (from inner to outer):**
1. **Unit Tests** - Single class/function, fast, isolated
2. **Integration Tests** - Multiple components together
3. **E2E/Acceptance Tests** - Full system, user perspective

**Arrange-Act-Assert Pattern:**
```typescript
// Arrange - Set up test state
const calculator = new Calculator();

// Act - Execute the behavior
const result = calculator.add(2, 3);

// Assert - Verify the outcome
expect(result).toBe(5);
```

**Test Naming:** Use concrete examples, not abstract statements
```typescript
// BAD: 'can add numbers'
// GOOD: 'when adding 2 + 3, returns 5'
```

See: [../../references/TESTING.md](../../references/TESTING.md)

## Behavioral Principles

- **Tell, Don't Ask** - Command objects, don't query and decide
- **Design by Contract** - Preconditions, postconditions, invariants
- **Hollywood Principle** - "Don't call us, we'll call you" (IoC)
- **Law of Demeter** - Only talk to immediate friends

## Pre-Code Checklist

Before writing ANY code, answer:

1. [ ] Do I understand the requirement? (Write acceptance criteria first)
2. [ ] What test will I write first?
3. [ ] What is the simplest solution?
4. [ ] What patterns might apply? (Don't force them)
5. [ ] Am I solving a real problem or a hypothetical one?

## During-Code Checklist

While coding, continuously ask:

1. [ ] Is this the simplest thing that could work?
2. [ ] Does this class have a single responsibility?
3. [ ] Am I depending on abstractions or concretions?
4. [ ] Can I name this more clearly?
5. [ ] Is there duplication I should extract? (Rule of Three)

## Post-Code Checklist

After the code works:

1. [ ] Do all tests pass?
2. [ ] Is there any dead code to remove?
3. [ ] Can I simplify any complex conditions?
4. [ ] Are names still accurate after changes?
5. [ ] Would a junior understand this in 6 months?

## Common Rationalizations

| Rationalization | Rebuttal |
|---|---|
| “I’ll add tests after the feature is done” | Tests written after the fact validate the implementation, not the design. TDD drives better design. |
| “This class is too small, it doesn’t need to follow SRP” | A class with one reason to change is never too small. Small classes compose well. |
| “I don’t need interfaces, there’s only one implementation” | Interfaces decouple the caller from the concrete type. Add the interface — the second implementation may never come, but testability improves now. |
| “Primitives are fine for this domain value” | Primitive obsession spreads. Every `string userId`, `number price`, or `string email` is a bug waiting to happen. Wrap them. |
| “Refactoring is risky, I’ll leave it as is” | Not refactoring is the bigger risk — the code hardens and becomes unchangeable. Cover it with tests, then refactor. |
| “DRY means I should deduplicate immediately” | Wait for the third occurrence (Rule of Three). Premature DRY creates wrong abstractions. |

## Red Flags - Stop and Rethink

- Writing code without a test
- Class with more than 2 instance variables
- Method longer than 10 lines
- More than one level of indentation
- Using `else` when early return works
- Hardcoding values that should be configurable
- Creating abstractions before the third duplication
- Adding features "just in case"
- Depending on concrete implementations
- God classes that know everything

## Verification

After applying this skill, confirm:

1. [ ] Every class has a single, clearly named responsibility.
2. [ ] All tests pass (Red‑Green‑Refactor was followed).
3. [ ] No class depends on concrete implementations — interfaces or abstractions are used where the behaviour may vary.
4. [ ] No method exceeds 10 lines; no class exceeds 50 lines (or the project’s agreed limit).
5. [ ] Every primitive that represents a domain concept is wrapped in a value object.
6. [ ] The dependency inversion rule is respected: high‑level modules do not depend on low‑level modules.
7. [ ] Code compiles with zero warnings at the project’s strictness level.
8. [ ] A junior developer reading the code in 6 months would understand the intent without comments.

## Remember

> "A little bit of duplication is 10x better than the wrong abstraction."

> "Focus on WHAT needs to happen, not HOW it needs to happen."

> "Design principles become second nature through practice. Eventually, you won't think about SOLID - you'll just write SOLID code."

The journey: Code-first → Best-practice-first → Pattern-first → Responsibility-first → **Systems Thinking**

Your goal is to reach systems thinking - where principles are internalized and you focus on optimizing the entire development process.
