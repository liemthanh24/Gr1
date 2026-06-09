---
phase: 5
title: "Frontend User API & Profile Fixes"
status: pending
priority: P2
effort: "3h"
dependencies: [4]
---

# Phase 5: Frontend User API & Profile Fixes

## Overview

Unify all API calls to use the configured `NEXT_PUBLIC_API_URL` instead of hardcoded URLs. Fix the profile page to fetch fresh data from API on mount. Add a toast notification system to replace `alert()` calls. Fix console.error fallbacks to show user-visible errors.

## Requirements

- Functional: All API calls go through `lib/api.ts` with consistent base URL; profile page fetches from API on mount; all errors show user-visible messages instead of silent `console.error`; toast system replaces `alert()` for non-critical messages
- Non-functional: Zero visual regressions; same glass morphism design

## Architecture

### Fix 1: Unify API Base URL
- **Files:** `src/app/profile/page.tsx`
- **Current:** Profile page hardcodes `http://localhost:3001/api/v1/...` directly
- **Action:** Replace raw `fetch()` call with the typed `fetchAPI` from `lib/api.ts` using `API_BASE` from env var
- **Note:** Admin page's raw fetch was already refactored in Phase 4 — skip it here.
- **File:** `src/lib/api.ts` — add missing user API function:
  - `updateProfile(data, token)` → `PUT /auth/profile`

### Fix 2: Profile Page — Fetch from API on Mount
- **File:** `src/app/profile/page.tsx`
- **Current:** Only reads from `localStorage`. If user data is stale, profile shows outdated info.
- **Action:** After reading token, call `fetchAPI<{ user: User }>('/auth/me', { token })` to get fresh user data. Fall back to localStorage if API fails.

```typescript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) { router.push('/login'); return; }
  
  // Fetch fresh data from API
  fetchAPI<{ user: User }>('/auth/me', { token })
    .then(data => {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      // populate edit fields
    })
    .catch(() => {
      // Fallback to localStorage if API fails
      const cached = localStorage.getItem('user');
      if (cached) setUser(JSON.parse(cached));
    });
}, [router]);
```

### Fix 3: Toast Notification System + Custom Confirm Modal
- **Create:** `src/components/Toast.tsx` — a reusable toast component
- **Create:** `src/hooks/useToast.ts` — toast state management hook
- **Action:** Add a `ToastContainer` to the `Navbar` or root layout. Replace `alert()` calls in:
  - `admin/events/page.tsx` (delete success/failure, create/edit success)
  - `profile/page.tsx` (save success/failure)
  - `events/[id]/page.tsx` (booking errors)
- **Types:** Support `success`, `error`, `info` variants with auto-dismiss (3s for success, 5s for error)
- **Custom Confirm Modal:** Create `src/components/ConfirmModal.tsx` — replaces `confirm()` for dangerous actions (delete event, etc.). Glass-styled to match existing UI. Async usage: `await confirmModal.show({ title, message })` → returns true/false.

### Fix 4: Silent console.error → User-Visible Errors
- **Files:** `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/events/[id]/page.tsx`
- **Current:** Uses `console.error()` for failed API fetches with no user feedback
- **Action:** Show inline error messages or toast notifications when API calls fail. Keep a retry pattern for non-critical fetches.

### Fix 5: Profile Save Response Handling
- **File:** `src/app/profile/page.tsx:56`
- **Current:** `const updatedUser = await res.json();` — assumes response body is the user object directly
- **Action:** Backend returns `{ user: {...} }` or just the user? Check the backend handler. If it returns `fiber.Map{"user": user}`, update frontend to read `data.user`.

## Related Code Files
- Modify: `src/lib/api.ts`
- Modify: `src/app/admin/events/page.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/events/[id]/page.tsx`
- Create: `src/components/Toast.tsx`
- Create: `src/components/ConfirmModal.tsx`
- Create: `src/hooks/useToast.ts`

## Implementation Steps
1. Add `updateProfile(data, token)` to `src/lib/api.ts`
2. Create `src/hooks/useToast.ts` with toast state management
3. Create `src/components/Toast.tsx` with auto-dismiss and variant styling
4. Create `src/components/ConfirmModal.tsx` — promise-based custom confirm modal
5. Add `ToastContainer` to layout or Navbar
6. Refactor `profile/page.tsx`: add API fetch on mount, use toast and `fetchAPI` for save
7. Replace `confirm()` in `admin/events/page.tsx` with custom `ConfirmModal`
8. Add toast notifications to `admin/events/page.tsx`
9. Replace `console.error` with toast or inline error messages in event listing/detail/dashboard pages
10. Verify build

## Success Criteria
- [ ] Profile page fetches fresh user data from API on mount (falls back to localStorage)
- [ ] Profile update uses `fetchAPI` with correct response handling
- [ ] Toast notifications appear for all success/error actions instead of alert()
- [ ] Custom ConfirmModal replaces `confirm()` for delete actions
- [ ] Failed event/order fetches show user-visible error messages
- [ ] `npm run build` compiles without errors

## Risk Assessment
- Backend `PUT /auth/profile` response format: needs verification. If it returns `{ user: User }`, update frontend accordingly.
- Toast should be added to root layout to avoid mounting/unmounting on page navigation.
