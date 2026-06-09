---
phase: 4
title: "Frontend Admin Dashboard & CRUD"
status: pending
priority: P2
effort: "5h"
dependencies: [3]
---

# Phase 4: Frontend Admin Dashboard & CRUD

## Overview

Replace placeholder alerts on admin events page with working Create/Edit modal forms. Add auth token to admin API calls. Fix delete button with loading state. Optionally add a simple admin dashboard page for user/order overview.

## Requirements

- Functional: Admin can create, edit, delete events via modal forms; delete has loading state and confirmation; all admin API calls include auth token; admin dashboard shows user/order stats
- Non-functional: Reuse existing glass morphism design; consistent with existing UI patterns; no page refresh needed after CRUD

## Architecture

### Fix 1: API Call Consistency
- **File:** `src/app/admin/events/page.tsx`
- **Current:** Hardcoded `fetch('http://localhost:3001/api/v1/events')` without auth token and `fetchAPI` not used
- **Action:** Import and use `getEvents()` from `@/lib/api` (with auth token) and add dedicated admin API functions:

```typescript
// Add to src/lib/api.ts
export async function adminGetEvents(token: string) {
  return fetchAPI<{ events: Event[] }>('/admin/events', { token });
}

export async function createEvent(data: Partial<Event>, token: string) {
  return fetchAPI<Event>('/admin/events', {
    method: 'POST', body: JSON.stringify(data), token
  });
}

export async function updateEvent(id: number, data: Partial<Event>, token: string) {
  return fetchAPI<Event>(`/admin/events/${id}`, {
    method: 'PUT', body: JSON.stringify(data), token
  });
}

export async function deleteEvent(id: number, token: string) {
  return fetchAPI<{ message: string }>(`/admin/events/${id}`, {
    method: 'DELETE', token
  });
}
```

### Fix 2: Create/Edit Event Modal
- **File:** `src/app/admin/events/page.tsx`
- **Action:** Replace button alerts with a reusable `EventFormModal` component (inline in page or separate file):
  - Fields: name, description, venue, total_tickets, price, event_date, image_url
  - Validates: required fields, price > 0, total_tickets > 0
  - On create: call `createEvent()`, refresh list
  - On edit: pre-fill from selected event, call `updateEvent()`, refresh list
- **New component:** `src/components/EventFormModal.tsx`

### Fix 3: Delete Loading State
- **File:** `src/app/admin/events/page.tsx`
- **Action:** Add `deletingId` state. Disable delete button and show spinner while deleting. Prevent double-click.

### Fix 4: Admin Dashboard Page
- **Create:** `src/app/admin/page.tsx`
- **Action:** Add a simple dashboard with stats cards (total users, total orders, total events, revenue) using `GET /api/v1/admin/stats` (new backend endpoint needed in Phase 3). Keep it simple — focus effort on CRUD modals.
- **API:** Add `GET /api/v1/admin/stats` returning `{ totalUsers, totalOrders, totalEvents, totalRevenue }`
- **Note:** Dashboard is secondary to CRUD. If timeline is tight, dashboard can show placeholder data or be deferred after CRUD is complete.

### Fix 5: Admin Navbar Link
- **File:** `src/components/Navbar.tsx` (update `Quản trị` link to point to `/admin` instead of `/admin/events`)
- **Action:** Add sub-navigation on admin pages for `/admin` (dashboard) and `/admin/events`

## Related Code Files
- Modify: `src/app/admin/events/page.tsx`
- Modify: `src/lib/api.ts`
- Create: `src/components/EventFormModal.tsx`
- Create: `src/app/admin/page.tsx`
- Modify: `src/components/Navbar.tsx`

## Implementation Steps
1. Add admin API functions to `src/lib/api.ts`
2. Create `src/components/EventFormModal.tsx` with glass-styled modal and form
3. Refactor `src/app/admin/events/page.tsx`: use admin API functions, add `deletingId` state, replace alert buttons with modal
4. Create `src/app/admin/page.tsx` with stats cards table (users, orders, events summaries)
5. Update `Navbar.tsx` admin link
6. Verify build: `cd ticket-frontend && npm run build`

## Success Criteria
- [ ] "Thêm sự kiện" button opens a modal form instead of alert
- [ ] Filling the form and submitting creates a new event via API
- [ ] "Sửa" button opens pre-filled edit modal
- [ ] Editing and submitting updates the event via API
- [ ] Delete button shows spinner during deletion, cannot be double-clicked
- [ ] All admin API calls include `Authorization: Bearer <token>`
- [ ] New `/admin` dashboard page shows stats
- [ ] Navbar admin link navigates correctly
- [ ] `npm run build` compiles without errors

## Risk Assessment
- Modal component must handle both create and edit modes cleanly — use `mode` prop to switch.
- No backend stats endpoint yet — frontend dashboard should gracefully handle 404/not-implemented with "Đang phát triển" state.
