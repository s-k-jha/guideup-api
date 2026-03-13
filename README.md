# Mentorship Booking Platform – Backend API

Production-ready Node.js + Express backend for a mentorship session booking platform.

---

## Tech Stack

- **Node.js** + **Express.js** – REST API
- **MongoDB Atlas** + **Mongoose** – Database
- **Razorpay** – Payment gateway
- **Nodemailer** – Email notifications
- **JWT** – Admin authentication
- **Helmet, Rate Limiting, Mongo Sanitize** – Security

---

## Project Structure

```
mentorship-backend/
├── config/
│   ├── razorpay.js          # Razorpay instance
│   └── nodemailer.js        # Email transporter
├── database/
│   ├── connection.js        # MongoDB connection
│   └── seedAdmin.js         # Seeds default admin + working hours
├── models/
│   ├── Admin.js
│   ├── User.js
│   ├── Session.js
│   ├── Booking.js
│   ├── Mentor.js
│   ├── Coupon.js
│   └── WorkingHours.js
├── controllers/
│   ├── authController.js
│   ├── sessionController.js
│   ├── slotController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── couponController.js
│   ├── mentorController.js
│   └── workingHoursController.js
├── routes/
│   ├── authRoutes.js
│   ├── sessionRoutes.js
│   ├── slotRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── couponRoutes.js
│   ├── mentorRoutes.js
│   └── workingHoursRoutes.js
├── services/
│   ├── emailService.js      # All Nodemailer email logic
│   ├── paymentService.js    # Razorpay order + verification
│   └── couponService.js     # Coupon validation + usage
├── middlewares/
│   ├── authMiddleware.js    # JWT protect middleware
│   ├── errorHandler.js      # Global error handler
│   └── validate.js          # Input validation middleware
├── utils/
│   ├── slotGenerator.js     # Dynamic slot generation + overlap logic
│   ├── slotLockStore.js     # In-memory slot locking (5-min TTL)
│   ├── reminderScheduler.js # 1-hour reminder cron
│   └── apiResponse.js       # Standardized response helpers
├── app.js                   # Express app setup
├── server.js                # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd mentorship-backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your real values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/mentorship_db
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_minimum_32_char_secret_key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=StrongAdminPassword123
NODE_ENV=development
```

> **Gmail Setup**: Enable 2FA on your Google account and generate an App Password at https://myaccount.google.com/apppasswords. Use the app password as `EMAIL_PASS`.

### 3. Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |

**Login body:**
```json
{ "email": "admin@domain.com", "password": "password" }
```
**Returns:** `{ token: "jwt..." }`

---

### Sessions (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get all active sessions |

### Sessions (Admin – requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Deactivate session |

---

### Slots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slots?date=YYYY-MM-DD&sessionId=xxx` | Get available slots |

**Response:**
```json
{
  "slots": [
    { "time": "18:00", "endTime": "18:30", "available": false },
    { "time": "18:15", "endTime": "18:45", "available": true }
  ]
}
```

---

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order + lock slot |
| POST | `/api/payment/verify` | Verify payment + confirm booking |

**Create Order body:**
```json
{
  "sessionId": "...",
  "date": "2025-01-15",
  "startTime": "18:30",
  "name": "Student Name",
  "email": "student@email.com",
  "phone": "+91XXXXXXXXXX",
  "couponCode": "SAVE20"
}
```

**Verify Payment body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "sig_xxx"
}
```

---

### Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate a coupon |
| POST | `/api/admin/coupons` | Create coupon (admin) |
| GET | `/api/admin/coupons` | List all coupons (admin) |

**Validate body:**
```json
{ "code": "SAVE20", "sessionId": "..." }
```

**Create Coupon body:**
```json
{
  "code": "SAVE20",
  "discountType": "percent",
  "value": 20,
  "expiry": "2025-12-31",
  "usageLimit": 100
}
```

---

### Admin – Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | List all bookings |
| PATCH | `/api/admin/bookings/:id/assign-mentor` | Assign mentor |

Query params for GET: `?status=confirmed&date=2025-01-15&page=1&limit=20`

**Assign Mentor body:**
```json
{ "mentorId": "..." }
```

---

### Admin – Mentors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/mentors` | List mentors |
| POST | `/api/admin/mentors` | Create mentor |
| PUT | `/api/admin/mentors/:id` | Update mentor |

---

### Working Hours

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/working-hours` | Get current working hours |
| POST | `/api/working-hours` | Update working hours (admin) |

**Update body:**
```json
{
  "startTime": "18:00",
  "endTime": "21:00",
  "slotResolutionMinutes": 15
}
```

---

## Booking Status Lifecycle

```
pending → payment_processing → confirmed → completed → cancelled
```

---

## Slot Logic

- Slots are **dynamically generated** — never stored in DB
- Candidate slots generated from working hours window (e.g. 18:00–21:00, every 15 min)
- Each slot checked against existing confirmed/processing bookings using overlap rule:
  ```
  existing.startTime < newEndTime AND existing.endTime > newStartTime
  ```
- When a user selects a slot, it is **locked in memory for 5 minutes** to prevent double-booking during payment

---

## Reminder System

- A scheduler runs every **5 minutes** in the background
- It checks for confirmed bookings starting within the **next 60 minutes**
- Sends reminder email to student (with meeting link)
- Marks `reminderSent: true` to prevent duplicate emails

---

## Security Features

- `helmet` – Sets secure HTTP headers
- `express-rate-limit` – 100 req/15min globally, 20 req/15min on payment routes
- `express-mongo-sanitize` – Prevents NoSQL injection
- JWT authentication on all admin routes
- Input validation on all write endpoints
- Request body size limited to 10kb

---

## Production Checklist

- [ ] Replace in-memory slot lock store with Redis
- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (32+ chars)
- [ ] Configure `ALLOWED_ORIGINS` in `.env`
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set up process manager (PM2)
- [ ] Configure HTTPS / reverse proxy (Nginx)
- [ ] Switch from Razorpay test keys to live keys
