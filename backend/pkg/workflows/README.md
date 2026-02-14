# Workflows Service Package

This package (`pkg/workflows`) handles:
- Ticket Management
- Inspection Report Submission
- Violation Lifecycle State Machine (Open -> Investigating -> Notice Sent)

## Structure
- `handler.go`: API Endpoints for tickets/inspections
- `service.go`: Business rules for transitions
