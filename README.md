# 🌟 Aurelle - Full-Stack Modern Web Application

A full-stack, enterprise-ready web application architecture built with modern standards for real-time reactivity, robust session security, and clean separation of concerns.

---

## 🏗️ Technology Stack

| Layer | Technologies | Role / Description |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4** | Server and client rendering, reactive UI, typed context hooks |
| **Backend** | **Node.js**, **Express.js**, **TypeScript** | Typed REST API routing, CORS credentials, Helmet security |
| **Database** | **MongoDB Atlas**, **Mongoose** | Cloud NoSQL cluster, user schemas, persistent session store |
| **Real-time** | **Socket.IO** (Client & Server) | Bidirectional WebSocket communication, ping/pong, broadcasts |
| **Authentication** | **Secure Sessions** (`express-session` + `connect-mongo`) + **Argon2id** | OWASP-recommended password hashing, HTTP-Only secure cookies |
| **Design** | **Figma** | Design system tokens, component specs, typography guide |
| **Tools** | **VS Code**, **Git**, **GitHub Actions**, **Postman** | Debugging configurations, automated CI, API test collections |

---

## 📁 Repository Directory Structure

```text
Aurelle/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI for builds & lint
├── .vscode/
│   ├── extensions.json                # Recommended VS Code extensions
│   ├── launch.json                    # Full-stack debugger (Client & Server)
│   └── settings.json                  # Formatting, ESLint & Tailwind settings
├── client/                            # Next.js 16 + React 19 Frontend
│   ├── public/                        # Static assets (SVGs, icons)
│   ├── src/
│   │   ├── app/                       # Next.js App Router (layout, page, css)
│   │   ├── components/                # Reusable UI components & Providers
│   │   ├── context/                   # AuthContext & SocketContext
│   │   ├── lib/                       # API fetch wrapper & Socket.IO client
│   │   └── types/                     # Frontend TypeScript interfaces
│   ├── .env.local.example             # Frontend environment template
│   ├── package.json
│   └── tsconfig.json
├── server/                            # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                    # DB connection, env validation, sessions
│   │   ├── controllers/               # Auth & Health controllers
│   │   ├── middleware/                # Auth verification & error handling
│   │   ├── models/                    # Mongoose User model
│   │   ├── routes/                    # API route definitions
│   │   ├── sockets/                   # Socket.IO handlers & event emitters
│   │   ├── types/                     # Session type augmentations
│   │   ├── utils/                     # Argon2id password utilities
│   │   ├── app.ts                     # Express app configuration
│   │   └── server.ts                  # HTTP & Socket.IO bootstrap
│   ├── .env.example                   # Backend environment template
│   ├── package.json
│   └── tsconfig.json
├── design/
│   └── README.md                      # Figma design system tokens & guidelines
├── postman/
│   ├── Aurelle_API.postman_collection.json # Ready-to-import API tests
│   └── Aurelle_Local.postman_environment.json # Postman environment variables
├── .gitignore                         # Comprehensive root gitignore
├── package.json                       # Monorepo task orchestration
└── README.md                          # Full architectural guide
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24+)
- **npm**: v9+
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB instance

---

### 2. Environment Configuration

#### Backend (`server/.env`):
Copy `server/.env.example` to `server/.env` if not already present:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/aurelle?retryWrites=true&w=majority
SESSION_SECRET=your_super_secret_session_key_at_least_32_characters_long
SESSION_NAME=aurelle.sid
COOKIE_MAX_AGE_DAYS=7
```

> **Connecting to MongoDB Atlas:**
> 1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
> 2. Under **Database Access**, create a user with read/write privileges.
> 3. Under **Network Access**, whitelist your IP (or `0.0.0.0/0` for development).
> 4. In **Clusters > Connect > Drivers**, copy the connection string and paste it into `MONGO_URI`.

#### Frontend (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

### 3. Installation

From the root project directory, run:
```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

Or run all installs in one command:
```bash
npm run install:all
```

---

### 4. Running the Development Servers

To run **both backend and frontend concurrently** in a single terminal:
```bash
npm run dev
```

Or run them individually:
```bash
# Backend only (http://localhost:5000)
npm run dev:server

# Frontend only (http://localhost:3000)
npm run dev:client
```

---

## 🔒 Authentication & Security Architecture

1. **Argon2id Hashing**:
   - Implements the hybrid Argon2id variant following OWASP guidelines (`memoryCost = 64MB`, `timeCost = 3`, `parallelism = 1`).
   - Strong protection against both side-channel and GPU-based hash-cracking.
2. **Stateful Session Store**:
   - `express-session` backed by `connect-mongo`.
   - Sessions are saved directly into your MongoDB Atlas cluster in the `sessions` collection.
3. **HTTP-Only Cookies**:
   - Session identifiers are stored exclusively in `httpOnly`, `sameSite`, and secure (in production) cookies, mitigating XSS and CSRF risks.

---

## ⚡ Socket.IO Real-Time Gateway

- **Handshake CORS**: Strict origin whitelist matching `CLIENT_URL` with credentials support.
- **Latency Monitoring**: Built-in ping/pong calculation.
- **Broadcast System**: Multi-client event propagation and room management (`room:join`, `room:leave`).
- **Heartbeat & Reconnect**: Built-in disconnection cleanup and reconnection handling.

---

## 📬 Postman API Testing

1. Open Postman.
2. Click **Import** and select:
   - `postman/Aurelle_API.postman_collection.json`
   - `postman/Aurelle_Local.postman_environment.json`
3. Select **Aurelle Local Environment** in Postman.
4. Test endpoints:
   - `GET /health` - Inspect database connection and uptime
   - `POST /auth/register` - Create user
   - `POST /auth/login` - Authenticate and set session cookie
   - `GET /auth/me` - Read authenticated user
   - `GET /auth/protected` - Verify protected route authorization
   - `POST /auth/logout` - Invalidate session

---

## 🎨 Figma Design System

See [`design/README.md`](design/README.md) for color tokens, typography scales, spacing units, and instructions for connecting your Figma designs directly to the Tailwind CSS theme.
