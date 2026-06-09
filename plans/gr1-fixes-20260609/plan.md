---
title: "Gr1 Security & Feature Fixes"
description: "Fix critical backend security issues, complete admin CRUD features, and improve frontend UX for both users and admin"
status: pending
priority: P1
branch: "main"
tags: [security, backend, frontend, admin, crud, ux]
blockedBy: []
blocks: []
created: "2026-06-09T10:47:49.523Z"
createdBy: "ck:plan"
source: skill
---

# Gr1 Security & Feature Fixes

## Overview

Gr1 ticket system has security holes (admin backdoor via email, hardcoded JWT secret, broken seed migration). Admin panel shows only placeholder alerts for "Thêm" and "Sửa". Frontend has hardcoded API URLs and missing user features. This plan addresses all three areas in priority order: critical backend security first, admin features second, user-facing fixes third.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Backend Security - Critical Fixes](./phase-01-backend-security-critical-fixes.md) | Pending |
| 2 | [Backend Security - Hardening](./phase-02-backend-security-hardening.md) | Pending |
| 3 | [Backend Admin CRUD](./phase-03-backend-admin-crud.md) | Pending |
| 4 | [Frontend Admin Dashboard & CRUD](./phase-04-frontend-admin-dashboard-crud.md) | Pending |
| 5 | [Frontend User API & Profile Fixes](./phase-05-frontend-user-api-profile-fixes.md) | Pending |
| 6 | [Frontend User Missing Features](./phase-06-frontend-user-missing-features.md) | Pending |

## Dependencies

Phase 1 must complete before Phase 2 (both touch auth middleware/config).
Phase 3 must complete before Phase 4 (backend admin endpoints needed by frontend).
Phase 4 must complete before Phase 5 (both touch `api.ts` and `admin/events/page.tsx` — Phase 5 builds on Phase 4's refactored code).
Phase 5 must complete before Phase 6 (Phase 6 builds on toast and search patterns from Phase 5).

## Validation Log

### Session 1 — 2026-06-09
**Trigger:** Post-Plan Validation Interview
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Phase 4 có mục 'Admin Dashboard Page (Optional Enhancement)'. Bạn có muốn xây dựng trang dashboard admin không, hay chỉ tập trung vào CRUD?
   - Options: Chỉ làm modal CRUD (Recommended) | Làm cả dashboard + CRUD
   - **Answer:** Làm cả dashboard nhưng tập trung vào CRUD
   - **Rationale:** Dashboard is included but secondary priority. Effort goes first to modal forms.

2. **[Assumptions]** Phase 2 forgot/reset password có chấp nhận log token (không email) cho MVP không?
   - Options: Log token là đủ (Recommended) | Không cần forgot password | **Custom: muốn email chuẩn + gửi mail**
   - **Answer:** Muốn email chuẩn, gửi thông báo về mail
   - **Rationale:** Phase 2 must include SMTP email sending for password reset

3. **[Tradeoffs]** Với delete event, giữ `confirm()` browser hay custom modal?
   - Options: Giữ confirm() (Recommended) | Custom confirm modal
   - **Answer:** Custom confirm modal
   - **Rationale:** Phase 5 adds `ConfirmModal` component

4. **[Architecture]** Seat generation: fixed 10/hàng hay configurable?
   - Options: Fixed 10/hàng (Recommended) | Configurable
   - **Answer:** Fixed 10/hàng
   - **Rationale:** Keep simple, match existing seed data pattern

#### Confirmed Decisions
- Admin dashboard: include but secondary to CRUD
- Password reset: must send real email via SMTP (add mail_service.go)
- Delete confirmation: custom glass-styled modal (add ConfirmModal.tsx)
- Seat generation: fixed 10 seats per row

#### Impact on Phases
- Phase 2: Added SMTP email service (+2h effort, new mail_service.go, SMTP config fields)
- Phase 4: Dashboard included but secondary priority noted
- Phase 5: Added ConfirmModal component to replace confirm()

### Whole-Plan Consistency Sweep
- Claims checked: 10 against actual codebase — all VERIFIED
- Dependencies chain validated: Phase 1→2→3→4→5→6
- Cross-phase overlaps resolved: Phase 4 owns admin API functions in api.ts, Phase 5 owns user functions only
- No contradictions found after validation propagation
