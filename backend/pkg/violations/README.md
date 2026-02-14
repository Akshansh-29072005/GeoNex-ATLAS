# Violations Service Package

This package (`pkg/violations`) handles:
- Violation Detection Logic (Rules Engine)
- Violation Lifecycle (Detected -> Verified -> Resolved)
- Notice Generation
- Audit Logging

## Structure
- `rules_engine.go`: Business logic for classifying violations
- `handler.go`: API endpoints
- `repository.go`: DB Access
