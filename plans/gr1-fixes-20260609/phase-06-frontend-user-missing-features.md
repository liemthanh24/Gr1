---
phase: 6
title: "Frontend User Missing Features"
status: pending
priority: P3
effort: "4h"
dependencies: [5]
---

# Phase 6: Frontend User Missing Features

## Overview

Add search/filter for events on home page, mobile-responsive navbar, pagination for events and orders, and event image display on cards. These are quality-of-life improvements that complete the user-facing experience.

## Requirements

- Functional: Events are searchable by name; navbar collapses on mobile; events/orders have pagination; event cards show images; error boundary catches crashes gracefully
- Non-functional: Consistent with existing glass morphism design; responsive down to 320px width

## Architecture

### Fix 1: Event Search & Filter
- **File:** `src/app/page.tsx` (home page), `src/app/admin/events/page.tsx` (admin page)
- **Action:** Add search input at top of event grid. Filter events client-side by name match (case-insensitive).
- **Future:** Add filter by venue and date range (purely client-side for MVP — no new API needed)

```typescript
// Pseudocode
const [search, setSearch] = useState('');
const filteredEvents = events.filter(e =>
  e.name.toLowerCase().includes(search.toLowerCase())
);
```

### Fix 2: Mobile-Responsive Navbar
- **File:** `src/components/Navbar.tsx`
- **Current:** All nav links displayed inline — will overflow on narrow screens
- **Action:** Add hamburger menu toggle at `<768px` breakpoint. Slide-out drawer with glass effect. Close on navigation.

### Fix 3: Pagination
- **Files:** `src/app/page.tsx` (events), `src/app/dashboard/page.tsx` (orders)
- **Current:** All items rendered at once
- **Action:** Add client-side pagination with configurable page size:
  - Events: 12 per page
  - Orders: 10 per page
- **Component:** Create reusable `Pagination` component
- **Note:** For MVP, keep client-side pagination. Future: move to server-side when dataset grows.

### Fix 4: Event Card Image
- **File:** `src/components/EventCard.tsx`
- **Current:** `image_url` field exists but only shows placeholder emoji
- **Action:** If `event.image_url` is not empty, render as background image on the card with overlay gradient. Keep emoji fallback if no image_url.

### Fix 5: Error Boundary
- **Create:** `src/components/ErrorBoundary.tsx`
- **Action:** Wrap the main layout with error boundary. Show a friendly error screen with retry button instead of blank white page.

## Related Code Files
- Modify: `src/app/page.tsx`
- Modify: `src/app/admin/events/page.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/EventCard.tsx`
- Create: `src/components/Pagination.tsx`
- Create: `src/components/ErrorBoundary.tsx`

## Implementation Steps
1. Add search input and filter logic to `src/app/page.tsx`
2. Add search input and filter logic to `src/app/admin/events/page.tsx`
3. Refactor `src/components/Navbar.tsx`: add mobile hamburger menu with drawer
4. Create `src/components/Pagination.tsx` with page size, current page, total pages
5. Add pagination to home page events grid and dashboard orders list
6. Update `src/components/EventCard.tsx` to render `image_url` as background if available
7. Create `src/components/ErrorBoundary.tsx` and add to layout
8. Verify build

## Success Criteria
- [ ] Search input on home page filters events by name in real-time
- [ ] Search input on admin page filters events by name
- [ ] Navbar collapses to hamburger menu on mobile (<768px)
- [ ] Events grid has pagination (12/page) with prev/next buttons
- [ ] Dashboard orders list has pagination (10/page)
- [ ] Event cards display image_url as background when available
- [ ] Error boundary catches crashes and shows retry button
- [ ] `npm run build` compiles without errors

## Risk Assessment
- Mobile navbar drawer may conflict with existing glass effects — test on both iOS Safari and Chrome Android.
- Client-side pagination is fine for current dataset (3 events, handful of orders). For scale, switch to server-side.
- Image loading: use `next/image` with `unoptimized` or standard `<img>` since this is Docker-deployed without a next.config image optimization setup.
