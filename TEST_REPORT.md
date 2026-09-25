# FlowSuite Security & End-to-End Testing Report
**Date:** September 25, 2026  
**Environment:** Development (Docker + Node dev servers)  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## Executive Summary

Comprehensive API testing revealed **2 critical security issues** and **2 high-priority bugs**:

1. **🔴 CRITICAL: Cross-Tenant Data Access** — Customers from one tenant are accessible to other tenants
2. **🔴 CRITICAL: Refresh Token Endpoint Crash** — `/api/v1/auth/refresh` returns 500 error
3. **🟡 HIGH: Registration DTO Mismatch** — Frontend registration fields don't match backend validation
4. **🟡 HIGH: Audit Log Access Control** — Audit logs return 403 for free plan (working as designed, but should be tested)

---

## Detailed Findings

### 1. CRITICAL: Cross-Tenant Customer Data Access

**Issue:** A user from Tenant B can access customer records created by Tenant A  
**Severity:** CRITICAL (Security Breach)  
**Reproducibility:** 100%

**Test Case:**
```bash
# Create customer in Tenant A with Token A
POST /api/v1/customers
Authorization: Bearer TOKEN_A
{
  "name": "Secret Customer",
  "email": "customer@tenant1.com",
  "status": "active"
}
# Returns: Customer ID = 123abc

# Attempt access with Token B from different tenant
GET /api/v1/customers/123abc
Authorization: Bearer TOKEN_B
# ✗ FAILS: Should return 403/404, but returns the customer data
```

**Root Cause:** Customer service/controller likely missing tenant isolation checks  
**Impact:** Severe data breach — cross-tenant data access possible  
**Fix Priority:** Immediate

---

### 2. CRITICAL: Refresh Token Endpoint Crash

**Issue:** POST `/api/v1/auth/refresh` returns HTTP 500 error  
**Severity:** CRITICAL (API Broken)  
**Reproducibility:** 100%

**Error Response:**
```json
{
  "statusCode": 500,
  "timestamp": "2026-09-25T06:09:02.758Z",
  "path": "/api/v1/auth/refresh",
  "message": "Internal server error"
}
```

**Expected Behavior:** Should return `{ accessToken, refreshToken }`  
**Test Case:**
```bash
POST /api/v1/auth/refresh
Content-Type: application/json
{
  "refreshToken": "valid_refresh_token"
}
```

**Root Cause:** Unknown — backend logs needed. Likely:
- Missing/null handler for refresh token logic
- Database connection issue during token validation
- Missing error handling in auth service

**Impact:** Token refresh broken — users cannot maintain sessions  
**Fix Priority:** Immediate

---

### 3. HIGH: Registration DTO Field Mismatch

**Issue:** Frontend sends `firstName`, `lastName`, `tenantName` but backend expects `fullName`, `workspaceName`, `workspaceSlug`  
**Severity:** HIGH (UX Broken)  
**Reproducibility:** 100%

**Error Response:**
```json
{
  "statusCode": 400,
  "message": [
    "property firstName should not exist",
    "property lastName should not exist",
    "property tenantName should not exist",
    "fullName must be a string",
    "workspaceName must be a string",
    "workspaceSlug must be a string"
  ]
}
```

**Issue:** This indicates registration DTOs are out of sync between frontend and backend  
**Root Cause:** Frontend `Register.tsx` component uses incorrect field names  
**Impact:** Users cannot register new accounts  
**Fix Priority:** High

---

### 4. HIGH: Audit Log Access Control

**Issue:** Audit logs return 403 "Feature not available on free plan"  
**Severity:** HIGH (Expected Behavior, but should document)  
**Test Response:**
```json
{
  "statusCode": 403,
  "message": "Feature 'audit_log' is not available on the free plan"
}
```

**Note:** This is **working as designed** — audit logs are a premium feature. However:
- Plan entitlement guard is correctly enforcing feature restrictions
- Test user is on "free" plan
- To test: Create/upgrade user to "Professional" plan via Stripe webhook

**Status:** ✅ Feature enforcement working correctly

---

## Passing Tests ✅

| Test | Result | Notes |
|------|--------|-------|
| Backend Server Health | ✅ PASS | Port 3000 responding |
| Frontend Server Health | ✅ PASS | Port 5173 responding |
| Database Connection | ✅ PASS | PostgreSQL accessible |
| User Login | ✅ PASS | JWT token generation working |
| Project Creation | ✅ PASS | Project CRUD operational |
| Task Creation | ✅ PASS | Task CRUD operational |
| Invalid Token Rejection | ✅ PASS | Auth guard working |
| Project Isolation (Owner) | ✅ PASS | Tenant 1 can access own projects |
| Customer Creation | ✅ PASS | Customer CRUD operational |
| Entitlements API | ✅ PASS | Plan limits returned correctly |
| Docker Infrastructure | ✅ PASS | All containers healthy |

---

## Failing Tests ❌

| Test | Result | Issue |
|-------|--------|-------|
| Cross-Tenant Project Access | ✅ PASS (Blocked correctly) | Project isolation working |
| Cross-Tenant Customer Access | ❌ FAIL | **SECURITY BREACH** |
| Refresh Token Endpoint | ❌ FAIL | **500 Error** |
| User Registration (DTO) | ❌ FAIL | **Field mismatch** |
| Audit Log Access | ✅ PASS (By design) | Premium feature gate working |

---

## Recommended Fix Priority

### Immediate (Today)
1. **Fix `/api/v1/auth/refresh` crash** — Debug backend logs, identify null pointer or missing handler
2. **Add tenant isolation to Customers controller** — Ensure all customer queries are scoped to `tenantId`

### High (This Sprint)
3. **Sync registration DTOs** — Update frontend Register component field names to match backend validation

### Testing
4. **Write integration tests** — Add E2E tests to prevent regressions:
   - Cross-tenant access attempts (should all fail with 403)
   - Token refresh flow
   - Registration flow

---

## Test Environment Details

**Backend:** NestJS on port 3000  
**Frontend:** React (Vite) on port 5173  
**Database:** PostgreSQL 16 on port 5433  
**Cache:** Redis 7 on port 6379  
**Test User:** test@example.com / password123 (test-workspace)

**Test Credentials Used:**
- Workspace Slug: `test-workspace`
- Email: `test@example.com`
- Password: `password123`

---

## Logs & Artifacts

- Backend logs: `/tmp/backend.log`
- Frontend logs: `/tmp/frontend.log`
- Test script: `/tmp/e2e_security_test.sh`

---

## Next Steps

1. **Investigate refresh token bug** — Check auth controller/service for null handling
2. **Add tenant isolation guards** — Review customers controller for missing `tenantId` filters
3. **Sync DTOs** — Update frontend and backend registration forms
4. **Write integration tests** — Prevent similar issues in future

