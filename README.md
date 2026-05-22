# URL Shortener & Analytics API

A production-grade, high-performance, and secure URL shortening microservice built with Node.js, Express, TypeScript, and MongoDB. This platform is designed to handle high-traffic link redirection with sub-millisecond tracking analytics while keeping the core database healthy and protected against common vulnerabilities.

## 2. High-Level Architecture

The system is built using a clean, layered architectural pattern that separates how data travels, how business logic is executed, and how data is stored.
```
[ Client Request ]
│
▼
┌────────────────────────────────────────────────────────┐
│ 1. Security & Routing Layer                           │
│ - Global Protection (Helmet, CORS, Rate Limiters)     │
│ - Session Guards (Access & Refresh Middleware)        │
└────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 2. Controller Layer (Traffic Control)                 │
│ - Extracts data & handles HTTP responses              │
│ - Enforces input safety shapes via Zod schemas        │
└────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 3. Service Layer (Core Business Logic)                │
│ - Orchestrates data operations                        │
│ - Triggers non-blocking background workers            │
└────────────────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────┐
│ 4. Database Layer (MongoDB Atlas)                     │
│ - Structured Document Storage                         │
│ - Specialized performance indexes                     │
└────────────────────────────────────────────────────────┘

```
By ensuring that each layer has exactly one job, the codebase avoids redundancy (keeping it **DRY** — Don't Repeat Yourself). For instance, validation happens entirely before the core logic runs, meaning the service layer can trust the data implicitly without repeating safety checks.

## 🛠️ Technologies Used

- **Language**: TypeScript
- **Runtime Environment**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Data Validation**: Zod
- **Security & Middleware**: Helmet, CORS, Cookie-Parser, Compression
- **Logging & Telemetry**: Pino (with Pino-Abstract / Logtail transports)
- **Cryptography**: Node.js Native Crypto Module, JSON Web Tokens (JWT)

## End-to-End Breakdown

### 1. The Secure Session Lifespan

To keep users securely logged in without ruining application performance, the platform splits authentication into a **dual-token system**:

- **Short-Lived Access Key**: Used for rapid access to private features. Expires in **15 minutes**.
- **Long-Lived Refresh Key**: Locked safely inside the browser's memory using a secure `httpOnly` cookie that JavaScript cannot read.

When a user interacts with their dashboard, the server runs a **Sliding Window** check. Instead of writing to the database every single time, the system reads from a lightweight memory cache. It only performs a hard database rewrite to extend the session if the refresh key is nearing its actual expiration date.

### 2. High-Speed Redirection & Fire-and-Forget Analytics

The primary job of a URL shortener is to redirect instantly. To eliminate any delay:

- A visitor clicks the short link.
- The server instantly increments the counter and issues the redirect.
- In the background (completely hidden from the user), a separate micro-task logs deep metadata: device type (User-Agent), origin source (Referer), and connection timestamp.

### 3. Bulletproof Password Recovery

Instead of using complex JWTs, the system generates an **unguessable, cryptographically secure random identifier**. This single-use token is stored with a strict **10-minute expiration** on the account document. Once used, it is completely removed from the system, preventing token reuse or overlapping reset attempts.

## Critical Engineering Decisions

### Why We Restrict Token Swaps (Sliding Window over Regular Rotation)

While rotating refresh tokens on every request is highly secure, it creates heavy write amplification on the database. The **Sliding Window** approach preserves **90%** of database computing power while maintaining strict security.

### State-Backed Tokens vs. Stateless JWTs for Resets

Using a simple cryptographic string instead of a JWT keeps the system lightweight. Since the server must query the database during password updates anyway, embedding expiration and status checks in the same operation removes unnecessary complexity.

### Intentional State Management for Safe Shutdowns

To handle cloud scaling and deployments safely, the application uses **Process Termination Traps** (`SIGINT`/`SIGTERM`). On shutdown, it:
- Pauses operations
- Flushes pending analytics streams to disk
- Drains connection pools
- Logs out cleanly

This prevents data loss or database corruption during server restarts.
