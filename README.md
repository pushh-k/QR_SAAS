# QR Prototype Platform

A production-ready full-stack web application for generating, managing, and tracking **dynamic QR codes for interactive prototypes**.

The platform allows designers and product teams to map any URL to a permanent platform QR code (`https://yourapp.com/p/{shortId}`). The destination can be changed at any time without reprinting or regenerating the physical QR code, complete with real-time scan analytics and device telemetry.

---

## 🚀 Key Features

1. **Dynamic Link Redirection (`/p/[shortId]`)**
   - Encodes a permanent short URL into the QR code.
   - Redirects visitors to the target prototype in sub-50ms via HTTP 307.
   - Edit the target destination anytime: the physical QR code continues working seamlessly.

2. **Modern SaaS Landing Page & Instant Generator**
   - High-contrast, sleek dark-mode aesthetic with glassmorphism and ambient lighting.
   - Instant guest generator on the hero section for immediate testing.
   - Interactive preview displaying the generated QR code, copyable short link, and direct redirection test.

3. **High-Resolution QR Code Engine**
   - High error correction (Level H, 30% recovery) for reliable camera scanning.
   - Clean quiet zone and crisp white canvas.
   - Instant download as high-res **PNG** or scalable vector **SVG**.

4. **Real-Time Analytics & Telemetry**
   - Tracks total scans, daily velocity, last 7 days, and last 30 days.
   - Device breakdown: Mobile, Tablet, Desktop.
   - Browser breakdown: Chrome, Safari, Firefox, Edge, Opera, etc.
   - OS detection: iOS, Android, Windows, macOS, Linux.
   - Complete event log with timestamps and referrers.

5. **Prototypes Management Dashboard (`/dashboard`)**
   - Responsive design: interactive table on desktop, converted to intuitive cards on mobile.
   - Instant search and status filtering (All, Active, Disabled).
   - Live actions: View & Download QR, Edit Destination URL, Enable/Disable Kill Switch, View Analytics, and Delete with confirmation modal.

6. **Secure User Authentication**
   - Sign up and log in with bcrypt password hashing.
   - JWT sessions signed with `jose` stored in secure `httpOnly` cookies.
   - Strict ownership protection: users can only manage their own prototypes.
   - Seamless demo/guest mode for immediate testing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Route Handlers, Server & Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
- **QR Generation**: [`qrcode`](https://www.npmjs.com/package/qrcode) (PNG & SVG generation)
- **Validation**: [Zod](https://zod.dev/) for strict schema and protocol validation
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: JWT (`jose`) + `bcryptjs`

---

## 📐 Architecture & QR Flow

```text
                    USER / DESIGNER
                          │
                          ▼
              Enters destination URL
              (e.g., https://figma.com/proto/123)
                          │
                          ▼
                  POST /api/prototypes
                          │
                          ▼
                 MongoDB Database
                          │
                          ▼
                   Generates shortId
                   (e.g., "y8ejuq3")
                          │
                          ▼
                  Generates QR Code
             (points to /p/y8ejuq3)
                          │
                          ▼
                  PRINT / SCREEN
                          │
                   PHONE CAMERA SCANS
                          │
                          ▼
               GET /p/y8ejuq3 (Platform)
                          │
                          ▼
                   MongoDB Lookup
                 ┌────────┴────────┐
                 ▼                 ▼
          Active = true     Active = false
                 │                 │
                 ├─ Record Scan    └─ Show "Prototype
                 │  (device, os)        Unavailable" Page
                 ▼
          HTTP 307 Redirect
                 │
                 ▼
          Target Destination
     (e.g., https://figma.com/proto/123)

───────────────────────────────────────────────────────
   WHEN DESIGNER UPDATES TARGET (e.g., to /proto/v2):
   - Database record updated
   - QR code is NOT regenerated
   - Scanning same QR now redirects to /proto/v2
───────────────────────────────────────────────────────
```

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB Connection String (Local or MongoDB Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/qr_platform

# JWT secret key for signing session cookies
NEXTAUTH_SECRET=your-secure-secret-key-at-least-32-chars

# Base URL of your application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

An example template is provided in `.env.example`.

---

## 💻 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ (Node 24 supported)
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The repository includes both unit tests and a live end-to-end integration test suite.

### 1. Critical Requirements Test Suite
Validates schema validation, dangerous protocol blocking, collision resistance, QR generation, prototype persistence, redirect behavior, disabled link handling, 404 handling, ownership security, and analytics increment:

```bash
npm test
```

### 2. Live HTTP Integration Suite
Tests the running server end-to-end (user registration -> login session -> prototype creation -> live HTTP 307 redirect -> analytics logging -> dynamic URL editing -> scan again with new destination):

```bash
node --experimental-strip-types scripts/e2e-http-test.ts
```

---

## 📡 API Documentation

### Prototypes API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prototypes` | List all prototypes for the current user (or guest) |
| `POST` | `/api/prototypes` | Create a new prototype and return QR codes (PNG/SVG) |
| `GET` | `/api/prototypes/:id` | Get details and QR codes for a single prototype |
| `PATCH` | `/api/prototypes/:id` | Update target URL, name, or `isActive` status |
| `DELETE` | `/api/prototypes/:id` | Delete prototype and its scan history |
| `GET` | `/api/prototypes/:id/analytics` | Get scan counts, charts, device/browser telemetry |
| `GET` | `/api/dashboard/stats` | Aggregated dashboard metrics across all prototypes |

### Redirection Route
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/p/:shortId` | Dynamic router. Logs scan and redirects (307) or renders 404/Unavailable page |

### Authentication API
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account and set session cookie |
| `POST` | `/api/auth/login` | Authenticate existing user |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Return current authenticated user session |

---

## 🌐 Production Deployment (Vercel + MongoDB Atlas)

1. **Database**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - In *Network Access*, add `0.0.0.0/0` (allow access from anywhere) or Vercel IP ranges.
   - Obtain your connection URI: `mongodb+srv://<user>:<password>@cluster.mongodb.net/qr_platform?retryWrites=true&w=majority`.

2. **Deploy to Vercel**:
   - Push your code to a GitHub repository.
   - Import the project into Vercel.
   - Set environment variables in Vercel project settings:
     - `MONGODB_URI` = your Atlas connection string
     - `NEXTAUTH_SECRET` = random 32+ character string
     - `NEXT_PUBLIC_APP_URL` = your production domain (e.g. `https://your-qr-platform.vercel.app`)
   - Click **Deploy**.

---

## 📄 License
MIT
