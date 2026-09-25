# 🏛️ FlowSuite System Architecture & Multi-Tenancy Design

**Document Version:** 1.0  
**Project:** FlowSuite — Multi-Tenant SaaS Workspace Platform  
**Target Audience:** Engineering Mentors, Reviewers & Engineering Team  
**Specification:** Conforms to FlowSuite PRD v1.0 (Section 5, 7 & 8.5)

---

## 1. Executive Architecture Overview

FlowSuite employs a cloud-native, three-tier architecture engineered for enterprise multi-tenancy, strict data isolation, high availability, and horizontal scalability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 18 Single-Page Application                     │
│           (TypeScript, Vite, TanStack Query, Tailwind CSS)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JWT in Auth Header)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      NestJS Modular Backend API                        │
│   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────┐  │
│   │   Auth &      │ │ Multi-Tenant  │ │  Entitlement  │ │  Auditing │  │
│   │ Throttler     │ │  RbacGuard    │ │     Guard     │ │  Module   │  │
│   └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └─────┬─────┘  │
└───────────┼─────────────────┼─────────────────┼───────────────┼────────┘
            │                 │                 │               │
            ▼                 ▼                 ▼               ▼
┌───────────────────────┐ ┌──────────────────────────────────────────────┐
│  Redis In-Memory Cache│ │           PostgreSQL Database (Prisma)       │
│  - Rate limiting      │ │  - Row-Level Tenant Partitioning (tenantId)  │
│  - Usage counters     │ │  - ACID Transactions                         │
│  - BullMQ job queues  │ │  - Relational Integrity & Cascading Scopes   │
└───────────────────────┘ └──────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy & Data Isolation Model

### 2.1 Partitioning Strategy: Row-Level Scoped Partitioning
FlowSuite utilizes a shared-database, shared-schema model with **strict row-level tenant partitioning**. Every resource belonging to a tenant is tagged with an immutable foreign key (`tenantId`).

* **Entities Scoped by `tenantId`**:
  * `Tenant` (Workspace root entity)
  * `User` / `Membership` (User association within tenant)
  * `Project` (Projects created within tenant)
  * `Task` (Tasks assigned to projects within tenant)
  * `Customer` (CRM contacts managed by tenant)
  * `TenantUsage` (Real-time usage counters per tenant)
  * `AuditLog` (Security and compliance event stream)

### 2.2 JWT Multi-Tenant Token Injection
To guarantee stateless performance without redundant database lookups on every request, FlowSuite's authentication pipeline injects multi-tenant context directly into the cryptographically signed JWT payload:

```json
{
  "sub": "usr_9981274bc",
  "email": "alex@acme.com",
  "tenantId": "tnt_542188ab",
  "role": "Owner",
  "plan": "Starter",
  "iat": 1758784000,
  "exp": 1758784900
}
```

### 2.3 Enforcement Pattern
Tenant isolation is enforced in depth across **two critical layers**:

1. **Controller / Guard Layer**:
   * The `JwtGuard` verifies signature validity and extracts `req.user.tenantId`.
   * The `@CurrentUser()` decorator provides strongly typed tenant context to controller methods.
2. **Service Layer (Query Parameterization)**:
   * Every Prisma query automatically includes `tenantId` in the `where` clause:
     ```typescript
     // Example: Finding a project
     async findOne(id: string, tenantId: string) {
       const project = await this.prisma.project.findFirst({
         where: { id, tenantId },
       });
       if (!project) throw new NotFoundException('Project not found');
       return project;
     }
     ```
   * Even if a malicious actor guesses or enumerates an existing `id` from another tenant, the query evaluates `where: { id: "foreign_id", tenantId: "my_tenant_id" }`, returning an empty result (`404 Not Found`).

---

## 3. Subscription & Entitlement Pattern

### 3.1 Design Principles
As mandated by PRD Section 7.1, **entitlement checks are never hard-coded against plan names**. Access is verified against named capability tokens and quota counters.

### 3.2 Tier Specifications (Stored in Database)

| Feature / Limit | Free Plan | Starter Plan | Professional Plan |
| :--- | :---: | :---: | :---: |
| **Price / Month** | ₹0 / $0 | ₹499 / $29 | ₹999 / $79 |
| **Max Seats** | 3 members | 10 members | 50 members |
| **Max Projects** | 2 active | 20 active | Unlimited (999,999) |
| **API Requests / mo** | 1,000 | 10,000 | 100,000 |
| **Audit Log Retention** | 7 Days | 30 Days | 365 Days |
| **Advanced Analytics** | Disabled | Disabled | Enabled |

### 3.3 Entitlement Guard Flow

```
Client Write Request (e.g. POST /api/v1/projects)
  │
  ▼
JwtGuard (Validates token & extracts tenantId, role, plan)
  │
  ▼
RbacGuard (Validates role permits action: e.g. Owner/Admin/Manager)
  │
  ▼
EntitlementGuard
  │──► Reads active TenantUsage counters (Project Count, Seat Count)
  │──► Compares against Plan Quotas
  │──► Quota Exceeded? ──► YES ──► HTTP 403 Forbidden ("Project limit reached. Upgrade to Starter.")
  │                    ──► NO
  ▼
Service Execution
  │──► Creates Project record with tenantId
  │──► Atomically increments TenantUsage.projectCount in transaction
  ▼
Return Created Entity
```

---

## 4. Role-Based Access Control (RBAC) Matrix

Server-side enforcement is executed via NestJS `@Roles(...)` metadata combined with `RbacGuard`:

| Operation / Resource | Owner | Admin | Manager | Member |
| :--- | :---: | :---: | :---: | :---: |
| **Workspace Settings & Deletion** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Subscription & Billing Checkout** | ✅ Full | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Invite & Remove Members** | ✅ Full | ✅ Full | ❌ Blocked | ❌ Blocked |
| **Create & Update Projects** | ✅ Full | ✅ Full | ✅ Full | ❌ Blocked |
| **View All Organization Projects** | ✅ Full | ✅ Full | ✅ Full | ❌ Assigned Only |
| **Create & Assign Tasks** | ✅ Full | ✅ Full | ✅ Full | ❌ Blocked |
| **Update Assigned Task Status** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Customer Records (CRUD)** | ✅ Full | ✅ Full | ✅ Full | ❌ View Only |
| **View Audit Logs** | ✅ Full | ✅ Full | ❌ Blocked | ❌ Blocked |

---

## 5. Security & Reliability Highlights

1. **Password Hashing**: Salted bcrypt hashing (10 rounds) before persistence; plaintext passwords are never logged or stored.
2. **Token Security**: Dual-token architecture using short-lived JWTs (15 min) and long-lived refresh tokens (7 days) with hash comparison and revocation support.
3. **BigInt JSON Safe Serialization**: Custom global serialization prevents Node.js runtime crashes when handling 64-bit integer values in usage metrics.
4. **Rate Limiting**: Distributed throttler backed by Redis protects `/auth/login` and `/auth/register` against brute-force attacks.
5. **Auditing**: All administrative actions (user invitations, role elevations, plan modifications) generate immutable `AuditLog` records containing timestamp, IP address, actor ID, and metadata.
