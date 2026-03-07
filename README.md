# 🏏 PlayerAuctionHub — Local Cricket Auction Platform

**playerauctionhub.in** — Live cricket player auction platform for local tournaments.

Built by **Kunal Kotak** ([@kunallll2303](https://instagram.com/kunallll2303)) & **Yash Jani** ([@yash_jani_](https://instagram.com/yash_jani_))

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS 3
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Realtime**: Firebase Realtime Database
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (player photos, team logos)
- **PDF Export**: jsPDF + jspdf-autotable
- **Animations**: canvas-confetti

---

## Features

- 🏠 **Home Page** — Tournament banner, countdown timer, team cards, rules
- 🔐 **Login** — Admin & team owner login with Firebase Auth
- 👑 **Admin Panel** — Dashboard, player CRUD, team management, settings, user account creation
- 🔴 **Live Auction** — Real-time bidding with timer, bid buttons for 4 teams, bid history
- 🏆 **SOLD Animation** — Confetti + "SOLD TO TEAM" stamp animation
- ❌ **UNSOLD Animation** — Fade-out with UNSOLD overlay
- 📱 **Team Owner Panel** — Live auction view, bid button, squad list
- 📺 **OBS Overlay** — Transparent overlay for live streaming (/overlay)
- 📄 **PDF Export** — Generate team squad PDFs

---

## Project Structure

```
pah3/
├── app/
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout with AuthProvider
│   ├── globals.css           # Global styles + Tailwind components
│   ├── login/page.tsx        # Admin/Team owner login
│   ├── admin/
│   │   ├── dashboard/page.tsx  # Admin dashboard
│   │   ├── players/page.tsx    # Player CRUD
│   │   ├── teams/
│   │   │   ├── page.tsx        # Redirect → /admin/teams/dashboard
│   │   │   └── dashboard/page.tsx  # Team management
│   │   ├── auction/page.tsx    # Live auction control
│   │   ├── users/page.tsx      # User account management
│   │   └── settings/page.tsx   # Auction settings
│   ├── team/
│   │   └── dashboard/page.tsx  # Team owner dashboard + bidding
│   ├── overlay/
│   │   ├── layout.tsx          # Transparent overlay layout
│   │   └── page.tsx            # OBS overlay (RTDB realtime)
│   └── api/
│       └── create-user/route.ts  # Firebase Auth user creation API
├── components/
│   └── admin/AdminLayout.tsx   # Admin sidebar + auth guard
├── lib/
│   ├── firebase.ts             # Firebase initialization
│   ├── auth.tsx                # AuthProvider + useAuth hook
│   ├── db.ts                   # Firestore + RTDB helpers
│   └── pdf.ts                  # PDF generation
├── .env.local                  # Firebase config (DO NOT COMMIT)
├── .env.example                # Template for env vars
├── next.config.js
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

---

## Database Schema

### Firestore Collections

| Collection | Fields |
|---|---|
| `users` | `displayName`, `email`, `role` (admin/team_owner), `teamId`, `teamName` |
| `players` | `name`, `village`, `role`, `photoURL`, `status` (available/sold/unsold), `soldTo`, `soldToName`, `soldPoints`, `createdAt` |
| `teams` | `teamName`, `ownerName`, `logoURL`, `points`, `playersBought`, `createdAt` |
| `settings` | `auctionTitle`, `auctionDate`, `bidIncrement`, `timerSeconds`, `status` |
| `auction_results` | `playerId`, `teamId`, `teamName`, `points`, `soldAt` |

### Realtime Database

| Path | Fields |
|---|---|
| `auction/live` | `playerId`, `playerName`, `playerRole`, `playerPhoto`, `playerVillage`, `currentPoints`, `currentBidder`, `currentBidderTeamId`, `status`, `timerEnd` |
| `auction/bids` | Array of `{ teamId, teamName, points, ts }` |

---

## Setup

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password provider
3. Create **Firestore Database** (start in test mode)
4. Create **Realtime Database** (start in test mode)
5. Enable **Storage** (start in test mode)
6. Go to Project Settings → Add a web app → Copy config values

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Firebase config values in `.env.local`.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Create Admin Account

1. Go to Firebase Console → Authentication → Add User
2. Create a user with email/password
3. Go to Firestore → Add document to `users` collection:
   - Document ID: the user's UID from Auth
   - Fields: `displayName` (string), `email` (string), `role`: `"admin"`
4. Login at `/login` with those credentials

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/playerauctionhub.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project" → Select your GitHub repo
3. Set **Root Directory** to `pah3` (if your repo root contains the `pah3` folder)
4. Add all environment variables from `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Click **Deploy**

### Step 3: Custom Domain

1. In Vercel project → Settings → Domains
2. Add `playerauctionhub.in`
3. Update DNS records as instructed by Vercel

---

## Color Theme

| Color | Usage | Hex |
|---|---|---|
| **Bhagwa (Saffron)** | Primary buttons, accents, headers | `#FF6B00` / `#f97316` |
| **White** | Backgrounds, cards | `#ffffff` |
| **Light Grey** | Borders, subtle backgrounds | `#f5f5f4` |

---

## Rules

- 🚫 No public player registration
- 💰 All players start from **0 base points**
- 🛡️ Only **4 teams** can participate in the auction
- 👑 Only **admin** can add players manually
- 🏏 Only those **4 teams** can bid in the auction

---

© 2025 PlayerAuctionHub. All rights reserved.
