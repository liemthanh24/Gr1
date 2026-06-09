---
phase: 1
title: "Backend Security - Critical Fixes"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Backend Security - Critical Fixes

## Overview

Remove the admin auto-promotion backdoor, eliminate hardcoded JWT secret fallback, fix the broken seed migration admin password, and add rate limiting to auth endpoints.

## Requirements

- Functional: Remove email-based admin elevation; JWT secret must come exclusively from env var with no default; admin seed account must have valid bcrypt hash; auth endpoints must be rate-limited
- Non-functional: Zero regression to normal registration flow; all existing API responses preserved

## Architecture

### Fix 1: Remove Admin Backdoor
- **File:** `internal/services/auth_service.go:35-38`
- **Current:** `if strings.Contains(req.Email, "admin") { ... UpdateRole(..., "admin") }`
- **Replace:** Remove the entire block. Admin role assignment should only happen via direct DB manipulation or a dedicated admin API (future).
- **Also remove:** `"strings"` import if no longer used

### Fix 2: JWT Secret Hardening
- **File:** `internal/config/config.go:18`
- **Current:** `JWTSecret: getEnv("JWT_SECRET", "super-secret-key-change-in-production")`
- **Replace:** Remove the fallback. If `JWT_SECRET` is empty, return an error at startup so the app refuses to start with an insecure config.
- **Also update:** `config.go` `Load()` to return `(*Config, error)` — validate that `JWTSecret` is non-empty and minimum 32 characters

### Fix 3: Seed Migration Admin Password
- **File:** `migrations/001_init.sql:67-69`
- **Current:** Placeholder hash `$2a$10$xyz123...` with comment about "123456"
- **Replace:** Generate a real bcrypt hash for password "123456" (or a known dev password) and replace the placeholder. Remove the inline comments.

### Fix 4: Rate Limiting
- **File:** `cmd/api/main.go`
- **Action:** Add Fiber rate limiter middleware to `/api/v1/auth/` routes (register + login): max 5 requests per minute per IP.
- **Use:** `github.com/gofiber/fiber/v2/middleware/limiter`

## Related Code Files
- Modify: `internal/services/auth_service.go`
- Modify: `internal/config/config.go`
- Modify: `migrations/001_init.sql`
- Modify: `cmd/api/main.go`
- Create: (none)

## Implementation Steps
1. Generate real bcrypt hash for password "123456" using `go run` with `bcrypt.GenerateFromPassword`
2. Update `migrations/001_init.sql`: replace placeholder hash, remove inline comments
3. Edit `internal/services/auth_service.go`: delete lines 35-41 (the admin promotion block), remove `"strings"` import
4. Edit `internal/config/config.go`: change `Load()` signature to `(*Config, error)`, validate `JWTSecret` is non-empty and >= 32 chars
5. Update `cmd/api/main.go` to handle `config.Load()` error, and add rate limiter to auth group
6. Build and verify: `go build ./cmd/api && go build ./cmd/worker`

## Success Criteria
- [ ] Registration with "admin" in email no longer grants admin role
- [ ] Server fails to start if `JWT_SECRET` env var is missing or too short
- [ ] Admin seed user can login with password "123456"
- [ ] Auth endpoints return 429 after 5 rapid requests from same IP
- [ ] All existing auth, events, booking, orders endpoints unchanged behavior
- [ ] `go build` succeeds for both cmd/api and cmd/worker

## Risk Assessment
- Changing `Load()` return type requires updating all callers. Only `cmd/api/main.go` and `cmd/worker/main.go` call it — low blast radius.
- Rate limiter stores state in-memory — restart resets counters. Acceptable for MVP. Future: Redis-backed.
