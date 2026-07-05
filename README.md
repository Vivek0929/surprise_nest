# 🎊 SurpriseNest — Hostel Surprise Celebration Platform

> Make every celebration unforgettable. Book themed decoration kits delivered straight to your hostel room.

---

## 🏗️ Project Structure

```
SurpriseNest/             ← Git root
├── .gitignore
├── README.md
├── frontEnd/             ← React + Vite
│   ├── .env.example
│   └── src/
│       ├── api/          ← Axios API helpers
│       ├── components/   ← Reusable UI components
│       ├── context/      ← Auth + Booking contexts
│       ├── pages/
│       │   ├── auth/     ← Login, Register
│       │   ├── booking/  ← 7-step booking flow
│       │   ├── admin/    ← Admin dashboard + management
│       │   └── delivery/ ← Delivery partner portal
│       └── utils/
└── backEnd/              ← Express + MongoDB
    ├── .env.example
    ├── server.js
    └── src/
        ├── config/
        ├── middleware/
        ├── models/
        ├── routes/
        └── seed/
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### 1. Clone & Setup

```bash
git clone <your-repo>
cd SurpriseNest
```

### 2. Backend Setup

```bash
cd backEnd
cp .env.example .env        # Fill in your values
npm install
npm run seed                # Seeds DB with demo data
npm run dev                 # Starts on port 5000
```

### 3. Frontend Setup

```bash
cd frontEnd
cp .env.example .env        # Set VITE_API_URL
npm install
npm run dev                 # Starts on port 5173
```

---

## 🔐 Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@surprisenest.com | Customer@123 |
| Admin | admin@surprisenest.com | Admin@123 |
| Delivery | delivery@surprisenest.com | Delivery@123 |

---

## 📡 API Endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new account |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Protected | Get current user |
| GET | `/api/themes` | Public | List themes (filterable) |
| GET | `/api/addons` | Public | List add-ons |
| POST | `/api/orders` | Customer | Place order |
| GET | `/api/orders/my-orders` | Customer | My orders |
| GET | `/api/orders/:id/track` | Customer | Track order |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/orders` | Admin | All orders |
| PUT | `/api/admin/orders/:id/status` | Admin | Update order status |
| PUT | `/api/admin/orders/:id/assign` | Admin | Assign delivery partner |
| GET | `/api/delivery/my-orders` | Delivery | Assigned orders |
| PUT | `/api/delivery/orders/:id/status` | Delivery | Update delivery status |

---

## 🌐 Deployment

### Backend (Render / Railway)
1. Set env vars from `.env.example`
2. Set `MONGO_URI` to your MongoDB Atlas URI
3. Set `CLIENT_URL` to your Vercel frontend URL
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL` to your deployed backend URL
2. Build command: `npm run build`
3. Output directory: `dist`

---

## 🎯 Features

- ✅ 10-step Booking Wizard
- ✅ 10 Themed Decoration Kits
- ✅ 10 Optional Add-Ons
- ✅ Live Order Tracking (auto-refresh)
- ✅ Admin Dashboard with Analytics
- ✅ Delivery Partner Portal
- ✅ JWT Authentication (3 roles)
- ✅ Inventory Management
- ✅ Reviews & Ratings
- ✅ Hostel Delivery (3-day lead time)
- ✅ Payment Method Selection
- ✅ Responsive Dark-themed UI
