---
phase: 3
title: "Backend Admin CRUD"
status: pending
priority: P2
effort: "3h"
dependencies: [1]
---

# Phase 3: Backend Admin CRUD

## Overview

Backend admin endpoints (CreateEvent, UpdateEvent) already exist at the route level but the frontend never calls them. This phase ensures they are complete, validated, and production-ready: proper input validation for admin mutations, ticket generation on event creation, and authorization consistency.

## Requirements

- Functional: CreateEvent auto-generates seat tickets; UpdateEvent validates fields; DeleteEvent cascades correctly; all admin endpoints consistently check admin role
- Non-functional: Input validation for all admin mutation endpoints; proper error messages

## Architecture

### Fix 1: CreateEvent — Auto-Generate Tickets
- **File:** `internal/services/booking_service.go`
- **Current:** CreateEvent only inserts the event row. There is no companion method to generate seat tickets.
- **Action:** After inserting event, auto-generate tickets based on `total_tickets`. Use the same pattern as seed SQL: seats formatted as `A1`, `A2`, ... `J10` (10 seats per row, row letters A-Z).

```go
// Pseudocode
func generateSeats(eventID, totalTickets int) []Ticket {
    seatsPerRow := 10
    var tickets []Ticket
    for i := 0; i < totalTickets; i++ {
        row := string(rune('A' + i/seatsPerRow))
        seat := i%seatsPerRow + 1
        tickets = append(tickets, Ticket{
            EventID:  eventID,
            SeatCode: fmt.Sprintf("%s%d", row, seat),
        })
    }
    return tickets
}
```

### Fix 2: UpdateEvent Validation
- **File:** `internal/handlers/event.go`
- **Current:** No validation on update fields. Empty strings could overwrite existing data.
- **Action:** Validate that at least one field is provided. Use validator struct tags.

### Fix 3: DeleteEvent — Verify Cascade
- **File:** `internal/repository/event_repo.go`
- **Current:** `ON DELETE CASCADE` is set on `tickets` table. Orders reference `tickets(id)` via `ticket_id` — this will fail on delete if orders reference a ticket from the event.
- **Action:** Before DELETE, set `ticket_id = NULL` on orders that reference this event's tickets, then delete event.

### Fix 4: Admin GET Events List
- **File:** `internal/handlers/event.go`
- **Current:** No admin-specific events endpoint. Admin frontend uses the public `GET /events` endpoint.
- **Action:** Add `GET /api/v1/admin/events` which returns events with additional admin fields (total orders, revenue).

## Related Code Files
- Modify: `internal/services/booking_service.go`
- Modify: `internal/handlers/event.go`
- Modify: `internal/repository/event_repo.go`
- Modify: `internal/repository/order_repo.go`
- Modify: `cmd/api/main.go`
- Create: (none)

## Implementation Steps
1. Add `generateSeats` helper function to `internal/services/booking_service.go`
2. Update `CreateEvent` handler/service to call seat generation after event insert
3. Add validator to `UpdateEvent` handler
4. Add admin-specific `ListEvents` handler that returns enriched admin event data
5. Update `DeleteEvent` to nullify order ticket_id references before deletion
6. Register new route `GET /api/v1/admin/events` in `cmd/api/main.go`
7. Build and verify

## Success Criteria
- [ ] Creating an event via admin API auto-generates N tickets with proper seat codes
- [ ] Updating an event validates input fields
- [ ] Deleting an event with existing orders succeeds (orders preserved, ticket_id nullified)
- [ ] New `GET /api/v1/admin/events` returns enriched event list for admin dashboard
- [ ] `go build` succeeds for both binaries

## Risk Assessment
- Ticket generation for very large events (10k+ seats) could be slow. Use batch INSERT for performance.
- Cascade nullification adds a DB write — should be within the same transaction for atomicity.
