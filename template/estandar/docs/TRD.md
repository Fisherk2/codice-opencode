# Technical Requirements Document – [Product Name] v[MVP]
**Date:** [YYYY-MM-DD] | **Author:** [Name] | **Status:** [Draft/Reviewed/Approved]
<!-- Delete all HTML comments once the placeholders are filled. -->

<!-- Sketch the architecture and name the responsibility of each layer. -->
## 1. Reference Architecture
- High-level diagram (Clean Architecture / Hexagonal / MVC)
- Layers and responsibilities:
  - Domain/Entities:
  - Use Cases/Application:
  - Interfaces/Adapters:
  - Infrastructure:

<!-- One row per layer; justify why each technology was chosen. -->
## 2. Technology Stack & Justification
| Layer | Technology | Version | Architectural Justification |
|-------|------------|---------|-----------------------------|

<!-- One row per component with its interface, dependencies and SOLID rationale. -->
## 3. System Components
| Component | Responsibility | Exposed Interfaces | Dependencies | SOLID Principle Applied |
|-----------|----------------|--------------------|--------------|-------------------------|

<!-- Document every endpoint or integration, including auth and rate limits. -->
## 4. API Contracts / Integrations
| Endpoint | Method | Request | Response | Authentication | Rate Limit |
|----------|--------|---------|----------|----------------|------------|

<!-- Set measurable targets for scalability, latency, security and observability. -->
## 5. Non-Functional Technical Requirements
- Scalability:
- Latency/Throughput:
- Security (OWASP, encryption, secret management):
- Observability (logs, metrics, tracing):

<!-- Name the environments, pipeline stages and rollback strategy. -->
## 6. Deployment Strategy & CI/CD
- Environments:
- Pipeline:
- Rollback/Blue-Green:

<!-- Trace each PRD requirement to the component and API/DB that implements it. -->
## 7. Traceability Matrix
| PRD REQ-ID | TRD Component | API/DB | Status |
|------------|---------------|--------|--------|

<!-- One row per ADR; include the alternatives that were discarded. -->
## 8. ADRs (Architecture Decision Records)
| ADR-ID | Context | Decision | Consequences | Discarded Alternatives |
|--------|---------|----------|--------------|------------------------|
