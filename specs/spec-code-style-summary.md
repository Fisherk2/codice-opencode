# Spec: Code Style Summary

For complete code style guidelines, naming conventions, and patterns, see [docs/CODE_STYLE.md](../docs/CODE_STYLE.md).

## Key Code Style Summary

1. **Naming:** PascalCase for classes (descriptive nouns, interfaces prefixed with `I`), camelCase for utilities/functions (verb-phrases), `SCREAMING_SNAKE_CASE` for constants.
2. **File Limits:** Maximum 200 lines per file, one primary export. Import ordering: externals → infrastructure → application → domain.
3. **Strict TypeScript:** No `any` types permitted in production code, explicit return types on all public methods and exported functions, prefer `readonly` arrays/properties.
4. **Comments & Documentation:** Comments explain *why*, never *what*. JSDoc required for public APIs, ports, use cases, and domain services.
5. **Error Handling:** Fail-fast validation at function entry points. Domain returns `Result<T, Error>` instead of throwing exceptions. Infrastructure maps low-level errors to domain error types.
6. **Pre-commit Gate:** All code changes must pass `just lint` and `just test:unit` with zero `any` types introduced before commit.
