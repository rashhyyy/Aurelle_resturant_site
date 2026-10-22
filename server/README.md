# Aurelle — Backend API Architecture (Stage 1: Foundation)

This service provides the production-grade, secure REST API and real-time backend foundation for the **Aurelle Premium Restaurant Management Platform**. It supports both the customer-facing digital experience and future staff management systems (Admin, Manager, Kitchen, Reception, Floor Staff).

---

## 1. Technology Stack

- **Runtime:** Node.js (>= 20.x)
- **Framework:** Express.js (v4.21.x)
- **Language:** TypeScript (v5.7.x)
- **Database:** MongoDB Atlas / Local MongoDB
- **ODM:** Mongoose (v8.9.x)
- **Validation:** Zod (v3.24.x)
- **Real-Time Communication:** Socket.IO (v4.8.x)
- **Session Store:** MongoStore (`connect-mongo` v5) + `express-session`
- **Password Hashing:** Argon2id (OWASP recommended parameters)
- **Security:** Helmet, Strict Origin-Locked CORS, Redacted Request Logging, RBAC Foundation

---

## 2. Directory Structure

```text
server/
├── src/
│   ├── app.ts                  # Express application setup, Helmet, CORS, and middleware
│   ├── server.ts               # HTTP bootstrap, MongoDB startup check, Socket.IO, graceful shutdown
│   ├── config/
│   │   ├── env.ts              # Zod environment variable validation
│   │   ├── database.ts         # Reusable Mongoose connection with masked credential logging
│   │   └── session.ts          # Session middleware with MongoStore
│   ├── routes/
│   │   ├── health.routes.ts    # Liveness (/api/health) and Readiness (/api/health/ready)
│   │   ├── auth.routes.ts      # Authentication foundation routes
│   │   └── index.ts            # Main API router mounting subsystems and module metadata
│   ├── controllers/
│   │   ├── health.controller.ts# Health and readiness controller
│   │   └── auth.controller.ts  # Session-based auth controller (Argon2id)
│   ├── middleware/
│   │   ├── error.middleware.ts # Centralized error handler with safe client responses
│   │   ├── notFound.middleware.ts # 404 route handler
│   │   ├── rbac.middleware.ts  # Role-Based Access Control guards (requireAuth, requireStaff, requireAdmin)
│   │   ├── logging.middleware.ts # Request logger with sensitive data redaction
│   │   └── validate.middleware.ts# Zod request validation middleware
│   ├── modules/
│   │   └── index.ts            # Architectural registry for 13 future business domains
│   ├── sockets/
│   │   └── socket.server.ts    # Modular Socket.IO gateway with origin enforcement
│   ├── types/
│   │   ├── session.d.ts        # Typed Express Session user data
│   │   └── roles.ts            # UserRole enum and RolePermissions map
│   └── utils/
│       ├── logger.ts           # Sensitive data redacting logger and URI masker
│       └── password.ts         # Argon2id password hashing and verification
├── .env.example                # Documented environment variable template
├── .env                        # Local development environment configuration (git-ignored)
├── package.json
└── tsconfig.json
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env` in the `server` directory:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | Backend HTTP listening port | `5000` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | `mongodb://127.0.0.1:27017/aurelle` |
| `CLIENT_ORIGIN`| Allowed origin for CORS & Socket.IO | `http://localhost:3000` |
| `SESSION_SECRET`| Cryptographic secret for session cookie signing (min 16 chars) | Required |
| `SESSION_NAME` | Name of the session cookie | `aurelle.sid` |
| `COOKIE_MAX_AGE_DAYS` | Session lifetime in days | `7` |

---

## 4. Development & Build Commands

Run commands from the `server` directory (or use workspace commands from project root):

```bash
# 1. Type check without compiling
npm run check:types

# 2. Start development server with live reload
npm run dev

# 3. Production build
npm run build

# 4. Start production server
npm start
```

From the repository root:
```bash
# Start both client and server concurrently
npm run dev

# Build both client and server
npm run build
```

---

## 5. Foundational API Endpoints (Stage 1)

### Liveness Check
- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "service": "aurelle-api",
    "timestamp": "2026-10-18T15:52:00.000Z",
    "uptime": 42
  }
  ```

### Readiness Check
- **Endpoint:** `GET /api/health/ready`
- **Description:** Verifies database connectivity. If MongoDB is disconnected, returns HTTP `503 Service Unavailable`.
- **Response (Connected):**
  ```json
  {
    "status": "ok",
    "service": "aurelle-api",
    "database": {
      "status": "connected",
      "readyState": 1,
      "connected": true,
      "host": "cluster0.mongodb.net",
      "name": "aurelle"
    },
    "timestamp": "2026-10-18T15:52:00.000Z",
    "uptime": 42
  }
  ```

### Platform Module Architecture
- **Endpoint:** `GET /api/modules`
- **Description:** Exposes module registration and target RBAC roles for future platform modules (auth, customers, employees, menu, orders, reservations, tables, vip-rooms, events, notifications, reports, settings, audit-logs).

---

## 6. Security & Data Protection

1. **Helmet Headers:** Secures DNS prefetching, frameguard, XSS protection, and hides the `X-Powered-By` header.
2. **Strict CORS:** Only requests from the explicitly configured `CLIENT_ORIGIN` with credentials enabled are allowed.
3. **Sensitive Data Redaction:** Passwords, tokens, authorization headers, credit cards, and session identifiers are sanitized before logging.
4. **Argon2id Hashing:** Hybrid memory-hard hashing (64 MB memory cost, 3 iterations, 1 thread) per OWASP recommendations.
5. **Session-Based Authentication:** Backed by MongoDB session store with HTTP-only, SameSite cookies.
