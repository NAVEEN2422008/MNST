# HealthSync+ (MNST)

A full-stack healthcare platform with a React frontend, an Express/MongoDB backend, and AI-powered features — patient dashboards, medical records with OCR, medicine management with adherence tracking, doctor portals, health milestones, notifications, and a health chatbot.

## Features

- **Authentication**: Firebase-based auth (mock mode for development) issuing JWT tokens; role-based access for `patient`, `doctor`, and `hospital`
- **Patient dashboard**: vitals display, health score, AI insights, and disease-risk predictions with Chart.js visualizations
- **Medical records**: document uploads (Multer), encrypted storage, OCR text extraction via Tesseract.js, PDF preview
- **Medicine management**: CRUD for medications, dosing schedules, adherence logging with rates, low-stock detection, and reminder scheduling (node-cron + notifications)
- **Doctor portal**: doctor role view of patients with appointment handling
- **Health milestones**: track progress toward health goals
- **AI assistant**: OpenAI-powered chatbot and health-insight endpoints
- **Notifications**: email/push/SMS preference-based notification system
- **Security**: Helmet, rate limiting, Mongo sanitization, HPP, xss-clean, request validation, and input encryption

## Tech Stack

- **Frontend**: React 18, React Router 6, Tailwind CSS, Chart.js, Framer Motion, Firebase client SDK, Axios, Tesseract.js
- **Backend**: Node.js, Express 4, Mongoose (MongoDB), Firebase Admin, JSON Web Tokens, Multer, node-cron, Nodemailer, OpenAI SDK
- **Tooling**: Jest + Supertest + mongodb-memory-server, pdf2pic

## Project Structure

```text
MNST/
├── package.json                 # Root deps (pdf2pic)
├── test.pdf                     # Sample upload artifact
└── healthsync/
    ├── deployment_instructions.md
    ├── frontend/                # React app (create-react-app)
    │   ├── src/
    │   │   ├── App.js           # Router + auth state + role detection
    │   │   ├── firebaseConfig.js
    │   │   ├── components/      # Dashboard, Chatbot, DoctorPortal, Auth, etc.
    │   │   └── styles/global.css
    │   └── package.json
    └── backend/
        ├── server.js            # Express app entry point
        ├── security.js          # Security middleware
        ├── notification_system.js
        ├── config/database.js
        ├── middleware/auth.js
        ├── models/              # User, Medicine, MedicalRecord, Appointment, HealthMilestone
        ├── routes/              # auth, users, medicines, medicalRecords, appointments, ai, notifications
        └── utils/encryption.js
```

## Installation

Backend:

```bash
cd healthsync/backend
npm install
# configure .env (MONGO_URI, JWT_SECRET, Firebase keys)
npm run dev        # nodemon
npm start          # production
```

Frontend:

```bash
cd healthsync/frontend
npm install
npm start
```

## Usage

1. Start the backend API (default http://localhost:5000):
   ```bash
   cd healthsync/backend && npm start
   ```
2. Start the React app (default http://localhost:3000):
   ```bash
   cd healthsync/frontend && npm start
   ```
3. Sign up / log in via `/auth`, then browse `/dashboard`, `/records`, `/medicines`, `/doctor` (doctor role), `/chatbot`, `/milestones`, and `/settings`.
