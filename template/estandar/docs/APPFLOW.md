# Navigation Flow – [Product] v[MVP]
**Date:** [YYYY-MM-DD] | **Author:** [Name]
<!-- Delete all HTML comments once the placeholders are filled. -->

<!-- List each actor with the screens they can open; one role per row. -->
## 1. Actors and Roles
| Role | Permissions | Initial Screens |
|------|-------------|-----------------|

<!-- Add one diagram per use case; keep the notation shown for consistency. -->
## 2. Flow Diagrams per Use Case
- Diagram link (Mermaid/Draw.io/Figma)
- Notation: Start → Screen → Decision → Action → End

<!-- One row per transition: origin, destination, trigger and condition. -->
## 3. Navigation Matrix
| Origin | Destination | Trigger | Condition | Required Global State | Rollback/Cancel |
|--------|-------------|---------|-----------|-----------------------|-----------------|

<!-- Name failure cases and the recovery path available to the actor. -->
## 4. Alternative Flows and Errors
- Auth failed, unstable network, denied permissions, invalid data:
- Recovery strategy:

<!-- State where each piece of state lives and how it survives a reload. -->
## 5. Navigation State Management
- Local vs. global state:
- Persistence (sessionStorage, tokens, cache):
- Deep linking / protected routes:

<!-- Map every flow to its PRD requirement and the component that implements it. -->
## 6. Traceability
| Flow-ID | PRD REQ-ID | UI Screen | Technical Component |
|---------|------------|-----------|---------------------|
