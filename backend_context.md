# Mentorship Booking Backend - Code Audit & Context Guide

This document provides a comprehensive overview of the `guideup-api` backend codebase. It is designed to help AI agents (and developers) quickly understand the architecture, database schema, core workflows, and API design of the platform.

## 1. Project Overview & Architecture
The project is a Node.js + Express backend for a mentorship booking platform. It follows a standard MVC-like architecture.

- **Stack**: Node.js, Express, MongoDB (Mongoose)
- **Payments**: Razorpay
- **Emails**: Resend
- **Architecture**:
  - `server.js` / `app.js`: Entry points. `app.js` configures middlewares and routes; `server.js` connects to DB, seeds admin, starts cron jobs, and starts the HTTP server.
  - `controllers/`: Handles business logic for each route.
  - `models/`: Mongoose schemas.
  - `routes/`: API endpoint definitions.
  - `middlewares/`: JWT Authentication, Error Handling, Request Validation.
  - `services/`: Encapsulated external integrations (Coupons, Emails, Payments).
  - `utils/`: Helper functions (Slot generation, API responses, In-memory locks, Reminders).

## 2. Database Models (Mongoose Schemas)

The database consists of 7 primary collections:

1. **Admin**:
   - `email` (unique), `password` (hashed with bcrypt), `name`.
   - Seeded automatically on startup (`database/seedAdmin.js`) if it doesn't exist.
2. **Booking**:
   - Core transactional model. Links `userId`, `sessionId`, `mentorId`.
   - Fields: `date` (YYYY-MM-DD), `startTime`, `endTime`, `durationMinutes`, `status` (enum: pending, payment_processing, confirmed, completed, cancelled), `paymentId`, `orderId`, `meetingLink`, `amountPaid`, `couponCode`.
   - Tracking: `studentJoinedAt`, `mentorJoinedAt`, `reminderSent`.
3. **User** (Student):
   - `name`, `email`, `phone`. Created automatically during the booking process if they don't exist.
4. **Session**:
   - Mentorship session offerings.
   - Fields: `title`, `description`, `durationMinutes` (15-240), `price`, `isPromo`, `isActive`.
5. **Mentor**:
   - `name`, `email`, `skills`, `meetingLink`, `isActive`, `maxSessionsPerDay`.
   - Assigned to bookings by the Admin.
6. **Coupon**:
   - `code`, `discountType` (percent/fixed), `value`, `expiry`, `usageLimit`, `usedCount`, `isActive`.
7. **WorkingHours**:
   - Global configuration for slot generation.
   - Fields: `startTime` (default '18:00'), `endTime` (default '21:00'), `slotResolutionMinutes` (15/30/45/60), `isActive`.

## 3. Core Workflows & Logic

### A. Slot Generation & Availability (`utils/slotGenerator.js`)
- Fetch global `WorkingHours` and the requested `Session` duration.
- Generate candidate slots between `startTime` and `endTime` based on `slotResolutionMinutes`.
- Fetch `existingBookings` for the day with status `confirmed` or `payment_processing`.
- Fetch `activeLocks` from the in-memory `slotLockStore`.
- **Availability Check**: A slot is marked available only if it does not overlap with any existing booking or active lock.
- **Past Slot Filtering**: Prevents booking slots in the past on the current day, enforcing a `30-minute` booking buffer.

### B. Payment & Booking Flow (`controllers/paymentController.js`)
1. **Create Order (`/api/payment/create-order`)**:
   - Validates session and coupon.
   - If `finalPrice == 0` (100% discount or free session), skips Razorpay, creates a `confirmed` booking, and sends emails immediately.
   - Otherwise, creates a Razorpay order.
   - Adds a 5-minute **In-Memory Lock** (`utils/slotLockStore.js`) for the specific time slot and `orderId` to prevent race conditions (double bookings).
   - Creates a booking with status `payment_processing` linked to the `orderId`.
2. **Verify Payment (`/api/payment/verify`)**:
   - Verifies Razorpay HMAC signature.
   - If invalid, marks booking as `cancelled` and removes the slot lock.
   - If valid, updates booking to `confirmed`, sets `paymentId`, releases the slot lock, increments coupon usage, and sends confirmation emails to the student and admin.

### C. Mentor Assignment (`controllers/bookingController.js`)
- Mentors are NOT auto-assigned. An admin must manually assign a mentor to a `confirmed` booking via `PATCH /api/admin/bookings/:id/assign-mentor`.
- Once assigned, the booking inherits the mentor's `meetingLink`, and notification emails are sent to both the student and the mentor.

### D. Meeting Link Management (`controllers/meetingController.js`)
- Students and mentors access the meeting via `/api/meeting/:bookingId/join`.
- This endpoint validates that the current time is at least 5 minutes before the session `startTime`.
- Records `studentJoinedAt` timestamp and returns the actual `meetingLink` (which comes from the assigned Mentor).

### E. Reminder System (`utils/reminderScheduler.js`)
- An in-memory polling cron job (`setInterval` every 5 minutes).
- Finds `confirmed` bookings for today where `startTime` is between 55 and 65 minutes from `now`.
- Sends a reminder email via Resend and sets `booking.reminderSent = true`.

## 4. API Endpoints Reference

### Public Endpoints
- `GET /health` - API Health check.
- `GET /api/sessions` - List active sessions.
- `GET /api/slots?date=YYYY-MM-DD&sessionId=xxx` - Get available slots for a day.
- `GET /api/working-hours` - Get configured working hours.
- `POST /api/payment/create-order` - Initialize booking & Razorpay order.
- `POST /api/payment/verify` - Verify Razorpay signature.
- `POST /api/coupons/validate` - Check coupon validity & discount.
- `GET /api/meeting/:bookingId/join` - Get meeting link (allowed 5 mins prior).

### Admin Protected Endpoints (Requires Bearer JWT)
- `POST /api/admin/login` - Admin authentication.
- **Sessions**: `POST /api/sessions`, `PUT /api/sessions/:id`, `DELETE /api/sessions/:id` (aliased with `/api/admin/sessions`).
- **Bookings**: `GET /api/admin/bookings`, `PATCH /api/admin/bookings/:id/assign-mentor`.
- **Coupons**: `GET /api/admin/coupons`, `POST /api/admin/coupons`.
- **Mentors**: `GET /api/admin/mentors`, `POST /api/admin/mentors`, `PUT /api/admin/mentors/:id`.
- **Working Hours**: `POST /api/working-hours` (upserts working hours).

## 5. Security & Middlewares
- **Rate Limiting**: `100 req / 15 mins` globally. Stricter `20 req / 15 mins` for `/api/payment/`.
- **Data Sanitization**: `express-mongo-sanitize` prevents NoSQL injection.
- **Headers**: `helmet` sets secure HTTP headers.
- **Validation**: Payload validation using `validator` library is handled in `middlewares/validate.js` before reaching controllers.
- **Error Handling**: Centralized in `middlewares/errorHandler.js` (handles Mongoose validation, duplicate keys, CastErrors, and JWT errors cleanly).

## 6. Environment Variables Requirements
```env
PORT=5000
NODE_ENV=development
MONGO_URI=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
RAZORPAY_KEY_ID=
RAZORPAY_SECRET=
RESEND_API_KEY=
FRONTEND_URL=
ALLOWED_ORIGINS=*
```
