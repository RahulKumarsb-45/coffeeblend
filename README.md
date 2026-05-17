# ☕ CoffeeBlend - Full Stack Project

**Express.js + MongoDB + Bootstrap Frontend**

---

## 📁 Project Structure

```
coffeeblend-fullstack/
├── backend/                 ← Express.js Server
│   ├── models/
│   │   ├── User.js          ← User model (auth)
│   │   ├── Product.js       ← Menu/Products
│   │   ├── Cart.js          ← Shopping cart
│   │   ├── Order.js         ← Orders
│   │   ├── Booking.js       ← Table reservations
│   │   └── Contact.js       ← Contact messages
│   ├── routes/
│   │   ├── auth.js          ← /api/auth (login, register)
│   │   ├── menu.js          ← /api/menu (products)
│   │   ├── cart.js          ← /api/cart
│   │   ├── orders.js        ← /api/orders
│   │   ├── bookings.js      ← /api/bookings
│   │   └── contact.js       ← /api/contact
│   ├── middleware/
│   │   └── auth.js          ← JWT middleware
│   ├── server.js            ← Main server file
│   ├── seed.js              ← Database seeder
│   ├── .env                 ← API keys (already configured)
│   └── package.json
└── frontend/                ← Your original HTML/CSS/JS
    ├── js/
    │   └── api.js           ← Frontend API helper (added)
    ├── index.html
    ├── login.html
    ├── register.html
    ├── contact.html
    └── ...
```

---

## 🚀 Setup & Run (Step by Step)

### Step 1 — MongoDB Atlas Setup (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up free
2. Create a **free cluster** (M0)
3. Create a **database user** (username + password)
4. In "Network Access" → Add your IP or `0.0.0.0/0` for all
5. Click "Connect" → "Drivers" → copy the **connection string**
6. Open `backend/.env` → replace `MONGODB_URI` with your string

### Step 2 — Install Dependencies
```bash
cd backend
npm install
```

### Step 3 — Seed Sample Products (Optional)
```bash
cd backend
node seed.js
```

### Step 4 — Start the Server
```bash
cd backend
npm start
# OR for auto-restart during development:
npm run dev
```

### Step 5 — Open the Website
Open your browser → `http://localhost:5000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get profile | ✅ |
| GET | `/api/menu` | All products | ❌ |
| GET | `/api/menu/featured` | Featured (homepage) | ❌ |
| GET | `/api/menu?category=coffee` | Filter by category | ❌ |
| GET | `/api/cart` | Get cart | ✅ |
| POST | `/api/cart/add` | Add to cart | ✅ |
| PUT | `/api/cart/update/:id` | Update quantity | ✅ |
| DELETE | `/api/cart/remove/:id` | Remove item | ✅ |
| POST | `/api/orders` | Place order | ✅ |
| GET | `/api/orders/my-orders` | My orders | ✅ |
| POST | `/api/bookings` | Book a table | ❌ |
| POST | `/api/contact` | Contact form | ❌ |

✅ = Requires JWT token (login first)

---

## 🔑 API Keys (Already Configured)

All keys are set in `backend/.env` — **alag se kuch add nahi karna**:
- ✅ JWT Secret — already set
- ✅ Google Maps API Key — already in HTML pages
- ✅ MongoDB URI — update with your Atlas string

---

## 🌐 Frontend API Integration

`frontend/js/api.js` file automatically handles:
- Login / Register forms
- Book a Table form  
- Contact form submission
- Add to Cart functionality
- Navbar user display (shows username when logged in)

---

## 👤 Test Credentials (after seeding)

Register yourself at `/register.html` — no default admin created.

To make yourself admin, run in MongoDB Atlas:
```javascript
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
