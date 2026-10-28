# Project Report: Stack Overflow Clone Platform

**Author / Developer:** Devendra Saxena  
**Project Repository:** `devendrasaxena123/StackOverflow-clone`  
**Live Frontend (Netlify):** [https://stackoverflow-clone12.netlify.app](https://stackoverflow-clone12.netlify.app)  
**Live Backend API (Render):** [https://stackoverflow-clone-1-vlvp.onrender.com](https://stackoverflow-clone-1-vlvp.onrender.com)  
**Database:** MongoDB Atlas Cloud Cluster  
**Report Date:** October 2026  

---

## 1. Executive Summary

This project is a modern, full-stack web application based on the core mechanics of **Stack Overflow**, enhanced with six enterprise-level features including:
1. **Public Social Community Space** with tier-based posting quotas determined by friend connections.
2. **Forgot Password Recovery System** with once-per-day rate limiting and alphabet-only password generation.
3. **Multi-Tier Question Subscription Plans** with a regulated payment window (10:00 AM – 11:00 AM IST) and automated invoice generation.
4. **Reputation & Reward Points System** with strict conditions for peer-to-peer point transfers.
5. **Multi-Language Support (6 Languages)** guarded by dual-channel OTP verification (Email for French, SMS for other languages).
6. **Comprehensive Authentication & History Tracking** with JWT, Bcrypt password hashing, and login audit trails.

The application is deployed live with a decoupled architecture: the Next.js frontend is hosted on **Netlify**, the Express.js API is hosted on **Render**, and the persistent data layer is managed on **MongoDB Atlas**.

---

## 2. Technology Stack & Architecture

### 2.1 Decoupled Architecture Diagram

```
┌─────────────────────────────────┐       HTTPS / REST       ┌─────────────────────────────────┐
│        Netlify Frontend         │ ───────────────────────> │         Render Backend          │
│   • Next.js 15.5.28 (Pages)     │                          │   • Express.js 5.1.0            │
│   • React 19 / TypeScript       │ <─────────────────────── │   • Node.js v20+ / JWT Auth     │
│   • Tailwind CSS / Lucide Icons │       JSON Responses     │   • Nodemailer / UA-Parser      │
└─────────────────────────────────┘                          └─────────────────────────────────┘
                                                                              │
                                                                              │ Mongoose ODM
                                                                              ▼
                                                             ┌─────────────────────────────────┐
                                                             │      MongoDB Atlas Cluster      │
                                                             │   • Users, Questions, Answers   │
                                                             │   • Posts, OTPs, Transactions   │
                                                             └─────────────────────────────────┘
```

### 2.2 Frontend Stack
- **Framework:** Next.js `15.5.28` (Pages Router)
- **UI Library:** React 19 with TypeScript
- **Styling:** Tailwind CSS with custom styling tokens
- **HTTP Client:** Axios with custom interceptors for automatic JWT bearer token injection
- **Icons & Alerts:** Lucide React, React Toastify

### 2.3 Backend Stack
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js `5.1.0`
- **Database Layer:** Mongoose `8.16.5` with MongoDB Atlas
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), Bcryptjs for cryptographic salt hashing
- **Device & Geolocation Tracking:** `ua-parser-js`
- **Scheduling & IST Rules:** Custom time zone engine synced with Indian Standard Time (UTC+5:30)

---

## 3. Core Features & Business Logic Implementation

### Feature 1: Public Social Space (`/community`)
- **Feed & Media Sharing:** Users can share technical and community updates with image and video attachments, captions, and tags.
- **Interactive Engagement:** Upvoting, downvoting, threaded commenting, and link sharing.
- **Friend-Based Tiered Posting Policy:**
  To maintain high signal-to-noise ratio, public posting access is strictly gated based on community connection:
  - **0 Friends:** Posting blocked.
  - **1 Friend:** Allowed 1 post per day.
  - **2–10 Friends:** Allowed up to 2 posts per day.
  - **> 10 Friends:** Unrestricted daily posting.
- **Friend Management:** Search user directory, send friend requests, and accept incoming invitations.

### Feature 2: Forgot Password & Alphabet-Only Password Generator (`/forgot-password`)
- **Dual Identifier Recovery:** Reset passwords using either registered email or mobile phone.
- **Abuse Prevention Engine:** Enforces a strict **once-per-day** reset request limit per account. Subsequent attempts within the same calendar day return `429 Too Many Requests`.
- **Alphabet-Only Password Generator:** Generates a cryptographically strong 12-character temporary password composed exclusively of uppercase and lowercase letters (`[a-zA-Z]`), strictly excluding numbers and symbols.
- **OTP Verification:** Verification code must be confirmed before new credentials become active.

### Feature 3: Subscriptions & Time-Regulated Checkout (`/subscription`)
- **Question Quota Tiers:**
  - **Free Tier:** 1 question / day (default).
  - **Bronze Tier (₹100/mo):** 5 questions / day.
  - **Silver Tier (₹300/mo):** 10 questions / day.
  - **Gold Tier (₹1000/mo):** Unlimited daily questions.
- **Regulated Payment Window:**
  Payment processing is strictly regulated to execute **ONLY between 10:00 AM and 11:00 AM IST**. Both client and server validate the live Indian Standard Time clock. Transactions outside this window are automatically rejected.
- **Automated Digital Invoices:**
  Every completed transaction generates an invoice containing Invoice ID, timestamp, GST/currency breakdown, and payment reference, immediately stored in the user's billing history.

### Feature 4: Reputation & Points Transfer Engine
- **Point Mechanics:**
  - **+5 points** awarded for answering community questions.
  - **+5 bonus points** awarded when an answer receives 5 or more upvotes.
  - **-5 points** deducted if an answer is deleted.
  - **-1 point** deducted when an answer receives a downvote.
- **Transfer Rule:**
  Users are permitted to transfer points to other community members **only if their balance exceeds 10 points** (`balance > 10`). Users with 10 or fewer points cannot initiate transfers.

### Feature 5: Multi-Language Support with Dual-Channel OTP
- **Supported Languages:** English (`en`), Spanish (`es`), Hindi (`hi`), Portuguese (`pt`), Chinese (`zh`), French (`fr`).
- **Security Check on Language Switch:**
  - **Switching to French (`fr`):** Triggers an **Email OTP** sent to the registered email address.
  - **Switching to Any Other Language:** Triggers a **Mobile OTP** sent to the registered phone number.
- **Real-Time Translation:** UI labels across navbar, sidebars, forms, and questions dynamically update upon verified switch.

### Feature 6: Authentication & Security
- **Registration & Direct Login:** Secure registration and direct login using email and hashed passwords (Bcrypt cost factor 12) with JWT session tokens.
- **Login Audit Trail:** Logs client browser, OS, IP address, and login timestamps to user profiles for account auditing.

---

## 4. Database Schema Design (MongoDB)

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`users`** | `name`, `email`, `password`, `phone`, `points`, `pointsHistory`, `friends`, `subscription`, `invoices`, `loginHistory`, `preferredLanguage` | Core profile, points ledger, friends list, subscription tier, and audit history |
| **`questions`** | `questionTitle`, `questionBody`, `questionTags`, `noOfAnswers`, `upVote`, `downVote`, `userPosted`, `userId`, `askedOn` | Question repository, tags, and vote metrics |
| **`answers`** | Embedded subdocument inside `questions` with `answerBody`, `userAnswered`, `userId`, `answeredOn`, `upVotes`, `downVotes` | Answer threads and community responses |
| **`posts`** | `userId`, `userName`, `caption`, `mediaUrl`, `mediaType`, `likes`, `comments`, `shares`, `createdAt` | Public social feed and media uploads |
| **`otps`** | `identifier`, `otp`, `purpose`, `expiresAt`, `createdAt` (TTL Index: 10 mins) | Ephemeral OTP storage for password reset and language switches |

---

## 5. Deployment & Cloud Infrastructure

### 5.1 Netlify Frontend
- **Domain:** `https://stackoverflow-clone12.netlify.app`
- **Build Pipeline:** Next.js build with `@netlify/plugin-nextjs`.
- **Config:** Configured with [frontend/netlify.toml](file:///c:/Users/ashis/Downloads/stackoverflow-clone-main/frontend/netlify.toml) declaring environment variables and API proxies.

### 5.2 Render Backend
- **Domain:** `https://stackoverflow-clone-1-vlvp.onrender.com`
- **Service Type:** Web Service running Node.js production server.
- **Resilience Features Added:**
  - Non-blocking database startup.
  - Automatic reconnection retry loop running every 10 seconds.
  - Health check endpoint `GET /db-status` and on-demand reconnection endpoint `GET /reconnect-db`.

### 5.3 MongoDB Atlas
- **Cluster:** `cluster0.mnpcllx.mongodb.net`
- **Database:** `stackoverflow`
- **Access Rule:** Whitelisted `0.0.0.0/0` in Network Access for dynamic cloud container compatibility.

---

## 6. Verification & Quality Assurance Summary

| Checkpoint | Target | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Frontend Route Health** | Netlify Pages (`/`, `/auth`, `/community`, `/subscription`, `/questions`) | **PASSED** | HTTP 200 OK with full HTML/JS bundles |
| **Backend API Health** | Render `GET /` and `GET /db-status` | **PASSED** | HTTP 200 OK, database state: connected |
| **User Registration** | `POST /user/signup` | **PASSED** | Successful account creation and JWT issuance |
| **User Direct Login** | `POST /user/login` | **PASSED** | Immediate login with email & password |
| **Community Limits** | `POST /post/create` | **PASSED** | Enforces 0-friend block and tiered quotas |
| **Password Reset** | `POST /user/forgot-password/request` | **PASSED** | Enforces once-per-day rate limit & alpha password |
| **Payment Window** | `POST /subscription/upgrade` | **PASSED** | Restricts checkout outside 10:00–11:00 AM IST |
| **Points Transfer** | `POST /user/transfer-points` | **PASSED** | Enforces minimum balance rule (`> 10 points`) |

---

## 7. Conclusion

The enhanced Stack Overflow Clone platform is fully operational, meeting all core requirements and extended specifications. The codebase is organized cleanly into modular `frontend` and `backend` directories, containerized for continuous deployment, and live on production cloud infrastructure.
