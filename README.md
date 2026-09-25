# ⚡ FlowSuite — Multi-Tenant SaaS Workspace Platform

[![FlowSuite CI/CD](https://github.com/ravadakaran/FlowSuite/actions/workflows/ci.yml/badge.svg)](https://github.com/ravadakaran/FlowSuite/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-100%25%20Core%20Complete-emerald.svg)](PROJECT_STATUS.md)

FlowSuite is an enterprise-grade, multi-tenant SaaS workspace platform designed to streamline team collaboration, project execution, task management, customer relationships, and subscription billing with strict database row-level data isolation.

---

## 🌟 Key Features

* **Multi-Tenant Architecture**: Strict row-level data partitioning (`tenantId`) across every entity; tenant-scoped queries prevent any cross-tenant data leakage.
* **Role-Based Access Control (RBAC)**: 4-tier server-side enforcement (`Owner`, `Admin`, `Manager`, `Member`) via NestJS guards.
* **Authentication & Security**: Bcrypt password hashing, short-lived JWT access tokens with multi-tenant claim injection, and long-lived refresh token rotation.
* **Projects & Kanban Task Management**: Project tracking and an interactive drag-and-drop Kanban board (`@dnd-kit`) with priority tagging, due dates, and assignee linking.
* **Customer CRM**: Tenant-scoped customer directory with company, status badges, and project association.
* **Subscription Billing & Entitlements**: Stripe test checkout integration, webhook synchronization, and enforced plan limits (seats, projects, storage) across *Free*, *Starter*, and *Professional* tiers.
* **Real-Time Notification Center**: Bell indicator with live activity stream (task assignments, team updates, subscription events) and unread counts.
* **Security Audit Logging**: Structured immutable audit trails recording all membership, invite, and administrative actions.
* **Dark Glassmorphism UI**: 90+ custom CSS design tokens, `motion/react` spring micro-interactions, skeleton loaders, and responsive layouts.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, `@dnd-kit`, `motion/react`, Lucide Icons |
| **Backend API** | NestJS (Node.js), TypeScript, Express, Class Validator, Passport JWT |
| **Database & ORM** | PostgreSQL 16 with Prisma ORM |
| **Caching & Queues**| Redis 7 with BullMQ |
| **Payments** | Stripe API (Test Mode Checkout & Webhooks) |
| **Containerization** | Docker & Docker Compose (Development & Production stacks) |
| **CI/CD** | GitHub Actions Automated Test & Build Quality Gate |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop) (running)
* Git

### 2. Clone and Configure Environment
```bash
git clone https://github.com/ravadakaran/FlowSuite.git
cd FlowSuite

# Copy environment variables
cp .env.example .env
cp backend/.env.example backend/.env
```

### 3. Start Core Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d postgres redis
```
> **Note**: PostgreSQL is exposed on **host port 5433** to avoid collisions with any native PostgreSQL 18 instances running on port 5432.

### 4. Setup Database Schema & Seed Data
```bash
cd backend
npx prisma migrate dev
npm run prisma:seed
```

### 5. Start Application
```bash
# Terminal 1: Backend API (runs on http://localhost:3000)
cd backend
npm run start:dev

# Terminal 2: Frontend Web App (runs on http://localhost:5173)
cd frontend
npm run dev
```

---

## 🧪 Running Automated Tests

FlowSuite includes automated end-to-end integration test suites for **Multi-Tenant Isolation** and **Role-Based Access Control (RBAC)**:

```bash
cd backend
npm test
```
```bash
# Output:
PASS test/rbac.e2e-spec.ts
PASS test/tenancy.e2e-spec.ts

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
Time:        ~7.7 s
```

---

## 🔑 Default Test Credentials

After running `npm run prisma:seed`, use the verified seed account:

| Attribute | Value |
| :--- | :--- |
| **Workspace Slug** | `test-workspace` |
| **Email** | `test@example.com` |
| **Password** | `password123` |
| **Role** | `Owner` |
| **API Docs (Swagger)** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| **pgAdmin UI** | [http://localhost:5050](http://localhost:5050) (`admin@flowsuite.dev` / `admin`) |

---

## 📖 Documentation Directory

* **[ARCHITECTURE.md](ARCHITECTURE.md)** — Comprehensive architecture note, multi-tenancy model, and entitlement engine design.
* **[DEPLOYMENT.md](DEPLOYMENT.md)** — Production Docker deployment, SSL/TLS reverse proxy setup, and cloud hosting guide.
* **[PROJECT_STATUS.md](PROJECT_STATUS.md)** — Full PRD v1.0 requirements compliance report and feature inventory (v1.5).
* **[to-do.md](to-do.md)** — Production completion checklist and execution history.
* **[TEST_REPORT.md](TEST_REPORT.md)** — Security and API end-to-end testing report.
* **[FIXES_SUMMARY.md](FIXES_SUMMARY.md)** — Detailed summary of critical fixes and security verifications.
* **[LICENSE](LICENSE)** — Project license.
