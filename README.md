# Stack Overflow Clone - Full Stack Platform

A modern, full-stack Stack Overflow clone enhanced with public social feeds, friend-based posting limits, subscription-based question plans with regulated payment windows, reward points system, multi-language support with security OTP verification, and environmental login tracking.

---

## 📁 Project Architecture & Hosting Structure

The repository is organized into distinct `frontend` and `backend` directories for hosting (e.g., Vercel / Netlify for frontend, Render / Railway / AWS for backend):

```
stackoverflow-clone-main/
├── backend/                  # Express.js, MongoDB & Node.js API
│   ├── controller/          # auth, question, answer, post, subscription
│   ├── middleware/          # authentication middleware
│   ├── models/              # auth, question, post, otp
│   ├── routes/              # auth, question, answer, post, subscription
│   ├── utils/               # timeCheck (IST rules), mailer (OTPs, invoices)
│   ├── index.js             # API entrypoint
│   └── .env                 # Environment config
├── frontend/                 # Next.js 15, React 19, TypeScript & Tailwind CSS
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, QuestionDetail, Modals
│   │   ├── layout/          # Mainlayout
│   │   ├── lib/             # AuthContext, LanguageContext, translations, axios
│   │   └── pages/           # index, ask, auth, signup, community, subscription, forgot-password, questions, users
│   └── .env.local           # Frontend environment config
├── package.json             # Root orchestration script
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally or a MongoDB Atlas URI

### 2. Run Both Frontend and Backend Concurrently
From the root directory:
```bash
# Run both servers together
npm run dev
```

Or run them individually:
```bash
# Backend (Port 5000)
cd backend
npm run start

# Frontend (Port 3000)
cd frontend
npm run dev
```

- **Frontend URL:** [https://stackoverflow-clone12.netlify.app](https://stackoverflow-clone12.netlify.app)
- **Backend API URL:** [https://stackoverflow-clone-1-vlvp.onrender.com](https://stackoverflow-clone-1-vlvp.onrender.com)

---

## 🌟 Implemented Features & Specifications

### 1. Public Social Space (`/community`)
- **Feed & Interactions:** Upload photos and videos with captions, like posts, comment with user badges, and share posts (copy link).
- **Friend-Based Posting Limits:**
  - **0 Friends:** Users with no friends are **blocked** from posting on the public page.
  - **1 Friend:** Can post **once per day** (1 post/day).
  - **2–10 Friends:** Can post up to **2 times per day** (2 posts/day).
  - **> 10 Friends:** Can post **unrestricted** (unlimited posts/day).
- **Friend Management:** Search and connect with friends directly from the community sidebar to level up your posting tier.

---

### 2. Forgot Password Feature (`/forgot-password`)
- Dedicated route `/forgot-password` allowing password resets via **registered email or phone number**.
- **Misuse Prevention:** Limited to **only once per day**. Subsequent attempts within the same day display:
  > *"You can use this option only one time per day."*
- **Alphabetical Password Generator:** Generates clean random passwords containing **only uppercase and lowercase letters** (`[a-zA-Z]`), strictly excluding numbers and special characters.

---

### 3. Subscription Plans & Regulated Payments (`/subscription`)
- **Question Posting Limits:**
  - **Free Plan:** 1 question / day
  - **Bronze Plan (₹100/mo):** Up to 5 questions / day
  - **Silver Plan (₹300/mo):** Up to 10 questions / day
  - **Gold Plan (₹1000/mo):** Unlimited questions / day
- **Controlled Payment Window:** Payments are permitted **ONLY between 10:00 AM and 11:00 AM IST** (enforced on both client and server). Outside this window, checkout displays a clear time restriction warning and blocks transactions.
- **Automated Invoices:** Automatically generates and emails a detailed receipt/invoice upon payment, complete with Invoice #, Plan Name, Amount ₹, Date, and Payment ID. Invoices are stored in the user profile.

---

### 4. Reward Points System
- **Earn Points:**
  - **+5 points** each time a user answers a question.
  - **+5 bonus points** when an answer reaches 5 upvotes.
- **Deductions:**
  - **-5 points** if an answer is deleted/removed.
  - **-1 point** per downvote received on an answer.
- **Points Profile & Transfer:**
  - Visible on profile badges and headers.
  - **Transfer Condition:** Users can transfer points to peers **only if they have more than 10 points** (`points > 10`). Users with 10 or fewer points cannot transfer.

---

### 5. Multi-Language Support with Security Verification
- **6 Supported Languages:** English (`en`), Spanish (`es`), Hindi (`hi`), Portuguese (`pt`), Chinese (`zh`), and French (`fr`).
- **Security Verification on Switch:**
  - Switching to **French (`fr`)**: Requires **Email OTP verification** sent to the user's registered email.
  - Switching to **all other languages** (`es`, `hi`, `pt`, `zh`, `en`): Requires **Mobile OTP authentication** sent to the registered mobile number.
- Instant UI translation across Navbar, Sidebar, questions, and forms.

---

### 6. Login History Tracking & Environmental Rules (`/auth`)
- **Login History Tracking:** Records browser type, operating system, device category (desktop, laptop, mobile), IP address, and timestamp. Visible under the user's profile.
- **Environmental Authentication Rules:**
  - **Google Chrome:** Access granted **only after OTP verification sent via email**.
  - **Microsoft Browser (Edge/IE):** Direct login granted **without additional authentication**.
- **Mobile Device Policy:** Access from mobile devices is time-restricted: allowed **ONLY between 10:00 AM and 1:00 PM IST**. Outside this window, login is denied with a notice.
