<h1 align="center">SyncPOS</h1>

<p align="center">
  A modern, full-stack <b>Point of Sale (POS)</b> and business management system for retail, repair, and hospitality businesses.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
</p>

---

## 📖 Overview

SyncPOS is a MERN-stack application that helps businesses manage sales, inventory, customers, staff, and finances from a single dashboard. It supports real-time updates via WebSockets, role-based access, and specialized workflows for retail, device repairs, deliveries, hire-purchase, trade-ins, and hospitality (table orders).

## ✨ Features

- 🛒 **Point of Sale** — Fast checkout with cart, receipts (printable), and signature capture
- 📦 **Inventory Management** — Track products, stock levels, and pricing
- 📊 **Dashboard & Reports** — Sales analytics and business insights with charts
- 👥 **Customer Management** — Customer profiles and history
- 🔧 **Repairs** — Manage device/product repair jobs
- 🚚 **Deliveries** — Track delivery orders
- 💳 **Hire Purchase (HP)** — Installment-based sales management
- 🔄 **Trade-In** — Handle product trade-ins
- 🍽️ **Hospitality** — Table orders for restaurants/cafés
- 🧑‍💼 **Staff Management** — Manage employees and roles
- 💸 **Expenses** — Record and track business expenses
- ⏱️ **Shift Control** — Open/close shifts and cash reconciliation
- ⚙️ **Settings** — Configure business preferences
- 🔐 **Authentication** — JWT-based login with role-based access
- ⚡ **Real-time updates** — Live sync across clients via Socket.io

## 🛠️ Tech Stack

**Frontend:** React 19, Vite, Zustand, Axios, Recharts, Lucide React, Socket.io Client, React-to-Print, React Signature Canvas

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, Socket.io, CORS, dotenv

## 📁 Project Structure

```
SyncPOS/
├── backend/                # Node.js + Express API
│   ├── controllers/        # Route handler logic
│   ├── middleware/         # Auth middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── seed.js             # Database seeding
│   └── server.js           # App entry point
└── frontend/               # React + Vite client
    └── src/
        ├── api/            # Axios instance
        ├── components/     # Shared UI components
        ├── store/          # Zustand state
        └── views/          # Page views (POS, Dashboard, etc.)
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/samitha2119/SyncPOS.git
cd SyncPOS
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncpos
JWT_SECRET=your_jwt_secret_here
```

Start the backend:

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs on the Vite dev server (default http://localhost:5173) and the API on http://localhost:5000.

### 4. Default admin login

On first run, a default admin account is seeded automatically:

| Email | PIN |
| --- | --- |
| `admin@syncpos.com` | `1234` |

> ⚠️ Change the default admin credentials before deploying to production.

## 🔌 API Overview

The backend exposes REST endpoints under `/api`:

| Resource | Base Route |
| --- | --- |
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Products | `/api/products` |
| Sales | `/api/sales` |
| Customers | `/api/customers` |
| Hospitality | `/api/hospitality` |
| Repairs | `/api/repairs` |
| Deliveries | `/api/deliveries` |
| Hire Purchase | `/api/hp` |
| Trade-Ins | `/api/tradeins` |
| Staff | `/api/staff` |
| Expenses | `/api/expenses` |
| Shifts | `/api/shifts` |
| Settings | `/api/settings` |

Health check: `GET /health`

## 👤 Author

**Samitha Lakshan Wijesooriya**
[LinkedIn](https://www.linkedin.com/in/samithalakshan) · [GitHub](https://github.com/samitha2119)
