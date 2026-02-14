# Auth Service Package

This package (`pkg/auth`) handles:
- User Registration
- Login & JWT Issuance
- Middleware for RBAC (Role-Based Access Control)

## Structure
- `handler.go`: HTTP Handlers (Gin)
- `service.go`: Business Logic
- `repository.go`: DB Access
- `jwt.go`: Token utilities
