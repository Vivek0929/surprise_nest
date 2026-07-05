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

## 🚀 Quick Start & Local Setup

This section outlines the step-by-step process for getting the project running locally for development.

### Prerequisites
- Node.js >= 18
- Git
- MongoDB (MongoDB Atlas cloud account)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SurpriseNest
```

### 2. MongoDB Setup
You can use cloud cluster via MongoDB Atlas:
- 
- **MongoDB Atlas**: Create a free cluster, get your connection string, and replace `<password>` with your database user password.

### 3. Environment Variables (.env) Setup
You need to set up environment variables for both the backend and frontend.

**Backend `.env`**
Navigate to the `backEnd` folder and create a `.env` file (or copy `.env.example` if available). It should look like this:
```env
PORT=5000
NODE_ENV=development
# Replace with your local MongoDB URI or Atlas Connection String
MONGO_URI=mongodb://localhost:27017/surprisenest
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Cloudinary & Razorpay Keys (Leave default or add your own)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Default Admin credentials for seeding
SEED_ADMIN_EMAIL=admin@surprisenest.com
SEED_ADMIN_PASSWORD=Admin@123
DELIVERY_CHARGE=100
```

**Frontend `.env`**
Navigate to the `frontEnd` folder and create a `.env` file (or copy `.env.example`). Add the following:
```env
# The backend API URL
VITE_API_URL=http://localhost:5000/api
```

### 4. Backend Setup & Start
Open a terminal in the root folder, then run:
```bash
cd backEnd

# 1. Install dependencies
npm install

# 2. (First-time only) Seed the database with demo users, themes, and addons
npm run seed

# 3. Start the development server
npm run dev
```
The backend should now be running on `http://localhost:5000`.

### 5. Frontend Setup & Start
Open a NEW terminal in the root folder, then run:
```bash
cd frontEnd

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
The frontend should now be running on `http://localhost:5173`.

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
