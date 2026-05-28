# MuseFlow AI 🎵
### Intelligent Collaboration & Smart Payment Ecosystem for Creative Freelancers

![MuseFlow AI Banner](https://via.placeholder.com/1200x400/040408/6366f1?text=MuseFlow+AI)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=nodedotjs)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?logo=socketdotio)](https://socket.io)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🌟 Project Overview

**MuseFlow AI** is a production-ready, full-stack SaaS platform that redefines how creative freelancers—music producers, video editors, designers, developers, and content creators—collaborate, track contributions, and get paid fairly.

### What Makes It Unique
- **AI-Powered Allocation** — Gemini AI analyses project requirements and scores every freelancer for compatibility, success rate, and budget fit
- **Smart Contribution Tracking** — Real-time activity scoring: tasks completed, files uploaded, messages sent, hours logged → auto-calculated payment splits
- **Escrow Payment System** — Client pays into smart escrow; AI splits revenue proportionally across the team; transparent one-click release
- **Realtime Collaboration** — Socket.IO-powered workspace: live chat, typing indicators, task board drag-and-drop, online presence
- **Creative Analytics** — Delay risk prediction, performance radar charts, earnings history, reliability scoring

---

## 🏗️ Architecture

```
MuseFlow AI
├── backend/          ← Node.js + Express REST API + Socket.IO
│   ├── config/       ← MongoDB Atlas, Cloudinary
│   ├── controllers/  ← Business logic (auth, projects, payments, AI, etc.)
│   ├── middleware/   ← JWT auth, error handling, rate limiting, validation
│   ├── models/       ← 9 Mongoose schemas (User, Project, Task, Payment…)
│   ├── routes/       ← 12 modular route files
│   ├── services/     ← Gemini AI service
│   └── sockets/      ← Socket.IO event handlers
│
└── frontend/         ← React 18 + Vite + Tailwind CSS
    └── src/
        ├── components/  ← Reusable UI (StatsCard, TaskBoard, Chat, Charts…)
        ├── context/     ← AuthContext, SocketContext
        ├── hooks/       ← Custom hooks
        ├── pages/       ← 13 pages (Landing → Admin)
        ├── routes/      ← PrivateRoute, RoleRoute guards
        └── services/    ← Axios API service
```

---

## 🚀 Tech Stack

| Layer         | Technology                           |
|---------------|--------------------------------------|
| Frontend      | React 18, Vite, Tailwind CSS, Framer Motion |
| State         | Context API, useReducer              |
| HTTP Client   | Axios (with interceptors)            |
| Routing       | React Router v6                      |
| Charts        | Recharts (Area, Bar, Pie, Radar)     |
| Backend       | Node.js 18+, Express.js              |
| Database      | MongoDB Atlas, Mongoose              |
| Auth          | JWT, bcryptjs                        |
| Realtime      | Socket.IO 4.x                        |
| File Storage  | Cloudinary                           |
| AI            | Google Gemini 1.5 Flash              |
| Deployment    | Frontend → Vercel, Backend → Render  |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Google AI Studio API key (Gemini)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/museflow-ai.git
cd museflow-ai
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy env template
cp .env.example .env
# Fill in your values (see Environment Variables section below)

npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env
cp .env.example .env
# Set VITE_API_URL and VITE_SOCKET_URL

npm run dev
# App starts on http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/museflow

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Or connect GitHub repo to Vercel and set environment variables in dashboard
```
**Vercel settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_API_URL`, `VITE_SOCKET_URL`

### Backend → Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: all from `backend/.env.example`

### Database → MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist all IPs (`0.0.0.0/0`) or Render's IPs
3. Create a database user and copy the connection string to `MONGO_URI`

---

## 📡 API Documentation

### Authentication
| Method | Endpoint                      | Description              | Auth |
|--------|-------------------------------|--------------------------|------|
| POST   | `/api/auth/register`          | Create account           | No   |
| POST   | `/api/auth/login`             | Sign in                  | No   |
| GET    | `/api/auth/me`                | Get current user         | Yes  |
| PUT    | `/api/auth/change-password`   | Change password          | Yes  |
| POST   | `/api/auth/forgot-password`   | Request reset email      | No   |

### Projects
| Method | Endpoint                      | Description              | Auth |
|--------|-------------------------------|--------------------------|------|
| POST   | `/api/projects`               | Create project           | Client|
| GET    | `/api/projects`               | List user's projects     | Yes  |
| GET    | `/api/projects/:id`           | Get project + tasks      | Yes  |
| PUT    | `/api/projects/:id`           | Update project           | Client|
| POST   | `/api/projects/:id/invite`    | Invite freelancer        | Client|
| GET    | `/api/projects/:id/contributions` | Get contribution data | Yes  |

### AI Endpoints
| Method | Endpoint              | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | `/api/ai/brief`       | Generate creative brief  | Yes  |
| POST   | `/api/ai/allocate`    | AI team recommendation   | Yes  |
| POST   | `/api/ai/estimate`    | Estimate budget/timeline | Yes  |
| POST   | `/api/ai/chat`        | AI project assistant     | Yes  |

### Payments
| Method | Endpoint                      | Description              | Auth    |
|--------|-------------------------------|--------------------------|---------|
| POST   | `/api/payments`               | Create + send to escrow  | Client  |
| GET    | `/api/payments`               | List payments            | Yes     |
| PUT    | `/api/payments/:id/approve`   | Approve payment          | Client  |
| PUT    | `/api/payments/:id/release`   | Release to freelancers   | Client  |

---

## 🔌 Socket.IO Events

### Client → Server
| Event             | Payload                          | Description              |
|-------------------|----------------------------------|--------------------------|
| `project:join`    | `projectId`                      | Join project room        |
| `project:leave`   | `projectId`                      | Leave project room       |
| `typing:start`    | `{ projectId }`                  | Start typing indicator   |
| `typing:stop`     | `{ projectId }`                  | Stop typing indicator    |
| `task:move`       | `{ projectId, taskId, newStatus }`| Move task on board       |

### Server → Client
| Event             | Payload                          | Description              |
|-------------------|----------------------------------|--------------------------|
| `message:new`     | Message object                   | New chat message         |
| `task:updated`    | Task object                      | Task status changed      |
| `task:deleted`    | `{ taskId }`                     | Task removed             |
| `typing:start`    | `{ userId, name }`               | Someone is typing        |
| `user:joined`     | `{ userId, name }`               | User joined project      |
| `notification:broadcast` | `{ title, message }`     | Admin broadcast          |

---

## 🗄️ Database Models

| Model          | Key Fields                                    |
|----------------|-----------------------------------------------|
| `User`         | name, email, role, skills, portfolio, ratings |
| `Project`      | title, type, freelancers, aiAllocation, milestones |
| `Task`         | status (kanban), assignedTo, contributionWeight |
| `Payment`      | splits[], status (escrow flow), approvalHistory |
| `Contribution` | contributionScore, tasksCompleted, filesUploaded |
| `Message`      | type (text/file/voice), reactions, readBy     |
| `Notification` | type (12 types), priority, isRead             |
| `Review`       | metrics (quality, timeliness, communication)  |
| `Analytics`    | earningsHistory, performanceTrend             |

---

## 🎯 Core Features Summary

| Feature                        | Implementation                              |
|--------------------------------|---------------------------------------------|
| JWT Authentication             | Access tokens, bcrypt hashing, role guards  |
| AI Project Allocation          | Gemini 1.5 Flash + compatibility scoring    |
| Smart Contribution Tracking    | Activity points → percentage → pay split    |
| Realtime Collaboration         | Socket.IO rooms, typing, drag-drop board    |
| Escrow Payment System          | 5-stage workflow: create→escrow→approve→release |
| AI Creative Brief Generator    | Scope, deliverables, steps, team suggestion |
| Analytics Dashboards           | Recharts: area, bar, pie, radar             |
| Role-based Access              | client / freelancer / admin                 |
| File Uploads                   | Cloudinary (images, audio, video, PDF, zip) |
| Freelancer Discovery           | Filter by skills, rating, availability      |

---

## 💼 Resume-Ready Description

**MuseFlow AI** | Full Stack SaaS Platform | React · Node.js · MongoDB · Socket.IO · Gemini AI

> Built a production-grade creative freelancer marketplace featuring AI-powered team allocation using Google Gemini API, real-time collaboration with Socket.IO (typing indicators, live task boards, group chat), and an automated contribution-based payment splitting system with escrow workflow. Implemented JWT authentication with role-based access control (client/freelancer/admin), Cloudinary file management, and analytics dashboards using Recharts. Designed a cinematic dark-mode UI with Tailwind CSS and Framer Motion animations, deployed frontend on Vercel and backend on Render with MongoDB Atlas.

**ATS Keywords:** React.js, Node.js, Express.js, MongoDB, Mongoose, Socket.IO, REST API, JWT Authentication, Tailwind CSS, Framer Motion, Vite, Axios, Context API, Cloudinary, Gemini AI, Vercel, Render, SaaS, Full Stack, Responsive Design, Role-Based Access Control, Real-time, WebSocket, MVC Architecture, Async/Await, bcrypt, Rate Limiting, Escrow, Analytics Dashboard

---

## 🚀 Future Improvements

1. **Stripe / Razorpay Integration** — Real payment processing replacing simulation
2. **Video Call Rooms** — WebRTC-based video collaboration inside workspaces
3. **AI Contract Generator** — Auto-generate NDAs and service agreements
4. **Mobile Apps** — React Native iOS/Android clients
5. **GitHub/Figma Integration** — Track commits and design file changes as contribution events
6. **Advanced Analytics** — ML-based delay prediction and earnings forecasting
7. **Marketplace** — Public project board for freelancers to bid
8. **Invoice PDF Generation** — Auto-generate professional invoices on payment release
9. **2FA** — TOTP-based two-factor authentication
10. **White-label** — Custom branding for creative agencies

---

## 📄 License

MIT © 2025 MuseFlow AI — Built with ❤️ for creative professionals worldwide.
