---
phase: 2
title: "Backend Security - Hardening"
status: pending
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Backend Security - Hardening

## Overview

Add input validation, proper email validation, CORS hardening, password reset flow, and fix the worker's lack of retry mechanism. These are medium-severity issues that compound the critical fixes from Phase 1.

## Requirements

- Functional: Validate email format on register/update; validate profile fields; add forgot/reset password endpoints; CORS should only allow configured frontend URL; worker should retry on transient DB failures
- Non-functional: All existing endpoints preserved; no breaking changes to API contracts

## Architecture

### Fix 1: Input Validation
- **Files:** `internal/handlers/auth.go`, `internal/models/user.go`
- **Current:** Struct tags `validate:"required,email"` are defined but never used. Handlers only check `req.Email == ""`.
- **Action:** Integrate a validator (`github.com/go-playground/validator/v10`) in handlers. Validate all incoming request structs.

### Fix 2: Enable Email Validation in Practice
- **File:** `internal/handlers/auth.go`
- **Action:** Before calling service layer, run validator on `RegisterRequest` and `LoginRequest`. Return 400 with field-level error messages.

### Fix 3: CORS Hardening
- **File:** `cmd/api/main.go:68`
- **Current:** `AllowOrigins: cfg.FrontendURL + ", http://localhost:3000, http://localhost:3001"`
- **Replace with:** `AllowOrigins: cfg.FrontendURL` only. Keep localhost origins only in dev mode via env var flag.

### Fix 4: Password Reset Endpoints
- **Create flow:**
  - `POST /api/v1/auth/forgot-password` — accepts email, generates reset token (short-lived JWT, 15min TTL), stores it in Redis, **sends email via SMTP** with reset link
  - `POST /api/v1/auth/reset-password` — accepts reset token + new password, validates token, updates password hash
- **Email service:** Create `internal/services/mail_service.go` with SMTP sending (configurable via env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Template-based email body.
- **Config addition:** Add SMTP fields to `internal/config/config.go`
- **Files:** Add `internal/services/mail_service.go`, modify `internal/handlers/auth.go`, `internal/services/auth_service.go`, `internal/config/config.go`, `cmd/api/main.go`

### Fix 5: Worker Retry Mechanism
- **File:** `internal/services/worker_service.go`
- **Current:** On any failure, immediately cancels order and returns ticket.
- **Action:** Add retry logic: retry up to 3 times with exponential backoff (1s, 2s, 4s) before giving up. Track retry count in Redis.

## Related Code Files
- Modify: `internal/handlers/auth.go`
- Modify: `internal/models/user.go`
- Modify: `cmd/api/main.go`
- Modify: `internal/services/worker_service.go`
- Modify: `internal/services/auth_service.go`
- Modify: `internal/config/config.go`
- Create: `internal/services/mail_service.go`

## Implementation Steps
1. Add `go-playground/validator/v10` dependency with `go get`
2. Add SMTP config fields to `internal/config/config.go`
3. Create `internal/services/mail_service.go` with SMTP sending + password reset email template
4. Update `internal/handlers/auth.go`: create a shared validator instance, call `validate.Struct(req)` before service calls
5. Update `cmd/api/main.go`: restrict CORS origins to `cfg.FrontendURL` only, add `AllowCredentials: true`
6. Add forgot-password and reset-password handlers to `internal/handlers/auth.go` and methods to `internal/services/auth_service.go` (use mail service for forgot-password)
7. Add routes in `cmd/api/main.go` for the new password-reset endpoints
8. Update `internal/services/worker_service.go`: add retry loop with Redis-based retry counter
9. Build and verify

## Success Criteria
- [ ] Register with invalid email format returns 400 with field error
- [ ] Profile update validates phone, cccd format
- [ ] CORS only allows the configured frontend URL
- [ ] Forgot-password endpoint generates and stores reset token in Redis, sends email via SMTP
- [ ] Reset-password endpoint accepts valid token and updates password
- [ ] Email is sent from the configured SMTP with proper reset link
- [ ] Worker retries at least 3 times before cancelling order
- [ ] `go build` succeeds for both binaries

## Risk Assessment
- SMTP credentials in env vars must be handled securely — add to `.env.example` with placeholder values, never commit real credentials.
- Email delivery is best-effort: if SMTP fails, still log the token for dev fallback.
- Worker retry with Redis means transient Redis failures could cause extra complexity. Keep retry logic simple (count in-memory, reset on restart).
