# Record Hub — Smart Attendance & Student-Record Management System

> **Mark once. Store automatically. Analyze intelligently.**

Record Hub is a production-style, database-backed web application built for schools, academies, tuition centers, and training institutes. It replaces paper registers with a modern digital workflow, automated statistics calculations, historical student profiles, daily/monthly/yearly reports, and a **Google Gemini-powered AI Attendance Analyst** that operates strictly on verified MongoDB data.

---

## 🚀 Key Features

### 1. Fast Classroom Attendance
- **One-Click Roll Call**: Select a class and view all active students in a responsive table.
- **Visual Button States**: Green for Present, Red for Absent, neutral for Unmarked.
- **Mark All Present**: Mark the whole class in 1 second, then toggle only absent students.
- **Duplicate Prevention & Editing**: Automatically checks if attendance for the selected date exists and enables safe editing rather than duplicate inserts.
- **MongoDB Bulk Upsert**: Atomic updates and inserts via Mongoose bulk operations.

### 2. Executive Dashboard
- **Live Statistics**: Real-time counters for Total Students, Total Classes, Today's Present, Today's Absent, and Today's Attendance %.
- **Class-by-Class Breakdown**: See at a glance which classes have completed attendance today.
- **Low Attendance Alerts**: Immediate notification of students below 75%.
- **Quick Action Bar**: Shortcuts to roll call, student enrollment, class creation, reports, and AI assistant.

### 3. Student & Class Management
- **Class Management**: Create, edit, and safely delete classes (prevents deleting classes with active students or historical records).
- **Student Directory**: Add, edit, search by name/roll#/ID, filter by class, and deactivate students.
- **Student Profile**: Detailed attendance history, monthly/yearly breakdowns, and exact attendance percentage:
  $$\text{Attendance \%} = \left(\frac{\text{Present Days}}{\text{Total Marked Days}}\right) \times 100$$

### 4. Comprehensive Reports & Analytics
- **Daily Report**: Class-by-class breakdown for any selected date.
- **Monthly Report**: Student attendance totals and percentages for any selected month.
- **Yearly Report**: Annual student attendance summary.
- **Class Analysis**: Student rankings with sorting by attendance percentage or roll number.
- **Low Attendance Section**: Configurable threshold (default 75%) identifying at-risk students.
- **CSV Export**: Instant download of attendance records for administration and archiving.

### 5. Gemini AI Attendance Assistant (Zero-Hallucination)
- **Natural-Language Analysis**: Supports English and Roman Urdu (e.g., *"Ali ki September attendance kitni hai?"*, *"Aaj 9-A mein kon absent tha?"*, *"Which students are below 75%?"*).
- **Anti-Hallucination Pipeline**: The AI model **never guesses** or executes arbitrary queries. The backend extracts verified figures from MongoDB first, and provides them as ground truth to Google Gemini.
- **Session Chat UI**: Interactive chat interface with quick suggestion chips, message history, and expandable verified database payloads.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS with custom glassmorphism and modern SaaS color system
- **Database**: MongoDB Atlas with Mongoose ODM (cached connections, compound unique indexes)
- **Authentication**: JWT session via `jose` and `bcryptjs` with HTTP-Only cookies
- **AI Engine**: Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`)
- **Icons**: Lucide React

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/record_hub?appName=Cluster0
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_random_string_here
NEXT_PUBLIC_APP_NAME="Record Hub"
```

A template `.env.example` is also provided.

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Data (Optional)
Populate sample classes (9-A, 9-B, 10-A, 10-B), students, and September attendance records:
```bash
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Default Admin Credentials
- **Email**: `admin@recordhub.com`
- **Password**: `admin123`
*(Or click "Fill Demo Credentials" on the login screen).*

---

## 🧪 Verification & Automated Testing

Run the full end-to-end integration test suite:
```bash
node scripts/test-app.mjs
```
This tests:
1. Authentication & Cookie handling
2. Dashboard live MongoDB calculations
3. Class & Student CRUD APIs
4. Taking and saving attendance (Upsert)
5. Student profile attendance math
6. Low attendance threshold filtering (< 75%)
7. Gemini AI Assistant queries & anti-hallucination verification
