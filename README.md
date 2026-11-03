# 🎓 School Management System

A comprehensive, production-ready School Management System built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Uses **Microsoft Excel (.xlsx)** as the database via **SheetJS (xlsx)** — no external database required.

## ✨ Features

### 👨‍🎓 Student Management
- Registration & Admission with auto-generated Admission/Roll numbers
- Profile management with photo upload
- Class & Section assignment
- Promotion & Transfer Certificate
- Student search, filter, and status management

### 👨‍🏫 Teacher & Staff Management
- Registration with auto-generated Employee IDs
- Profile, Qualification, Experience tracking
- Subject & Class assignment
- Salary & Designation management

### 📅 Attendance Management
- Daily attendance marking (Present/Absent/Late)
- Monthly attendance reports
- Teacher attendance tracking
- Leave management

### 💰 Fee Management
- Multiple fee categories (Admission, Monthly, Exam, Transport)
- Fee collection with receipt generation
- Defaulter tracking
- Payment modes (Cash/Card/Online/Cheque)

### 📝 Examination Management
- Exam creation (Mid-Term, Final, Unit Tests, Practical)
- Subject-wise marks entry
- Auto grade & GPA calculation
- Report card generation
- Position/Rank calculation

### 📚 Homework Management
- Homework assignment with due dates
- Student submissions & grading
- Status tracking

### 📢 Notice Board
- School announcements & notices
- Holiday notifications
- Event management
- Targeted audience selection

### 📆 Timetable Management
- Visual weekly timetable grid
- Class & Teacher timetables
- Subject scheduling with room assignment

### 🪪 ID Card System
- Student ID Cards with photo, QR code, barcode
- Teacher ID Cards with employee details
- Bulk generation & print support
- PDF export

### 📄 Certificate Generator
- Bonafide, Character, Leaving, Fee certificates
- Custom certificate templates
- PDF download

### 📊 Reports & Analytics
- Student, Teacher, Attendance, Fee, Exam reports
- Export to PDF & Excel
- Interactive dashboards

### 👨‍👩‍👧 Parent Portal
- Child profile & progress view
- Attendance, Results, Fees, Homework views
- School notices

### 💵 Payroll Management
- Salary setup & generation
- Payslip generation
- Monthly salary reports

### 🎨 School Settings
- School information & branding
- Academic session management
- Grading system configuration

## 🚀 Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | Microsoft Excel (.xlsx) via SheetJS |
| **Icons** | Lucide React |
| **QR Codes** | qrcode.react |
| **PDF** | jsPDF, html2canvas |
| **Notifications** | react-hot-toast |

## 📁 Project Structure

```
school-management/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin dashboard & management
│   │   ├── teacher/            # Teacher portal
│   │   ├── student/            # Student portal
│   │   ├── parent/             # Parent portal
│   │   ├── login/              # Authentication
│   │   └── api/                # Backend API routes
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Layout components
│   │   ├── forms/              # Form components
│   │   ├── id-cards/           # ID card components
│   │   ├── certificates/       # Certificate components
│   │   └── charts/             # Chart components
│   ├── lib/                    # Utility libraries
│   │   ├── excel.ts            # Excel CRUD operations
│   │   ├── init-data.ts        # Database initialization
│   │   └── utils.ts            # General utilities
│   ├── services/               # Business logic services
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   ├── data/                   # Excel database files
│   └── middleware.ts           # Auth middleware
├── public/                     # Static assets
└── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ (recommended: 20+)
- **npm** 9+

### Step 1: Install Dependencies
```bash
cd school-management
npm install
```

### Step 2: Initialize Excel Database
```bash
npm run setup
```
Or start the dev server and visit:
```
http://localhost:3000/api/setup
```

### Step 3: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Production Build
```bash
npm run build
npm start
```

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Teacher** | `teacher` | `teacher123` |
| **Student** | `student` | `student123` |
| **Parent** | `parent` | `parent123` |

## 🗄️ Excel Database

The system stores all data in `.xlsx` files located in `src/data/`:

| File | Description |
|------|-------------|
| `users.xlsx` | System users & authentication |
| `students.xlsx` | Student records |
| `teachers.xlsx` | Teacher records |
| `staff.xlsx` | Staff records |
| `parents.xlsx` | Parent/Guardian records |
| `classes.xlsx` | Class definitions |
| `sections.xlsx` | Section definitions |
| `subjects.xlsx` | Subject definitions |
| `attendance.xlsx` | Attendance records |
| `fees.xlsx` | Fee records |
| `exams.xlsx` | Exam definitions |
| `results.xlsx` | Exam results/marks |
| `homework.xlsx` | Homework assignments |
| `notices.xlsx` | Notice board entries |
| `settings.xlsx` | School settings |

## 🔒 Security

- **Role-Based Access Control (RBAC)**: Admin, Teacher, Student, Parent roles
- **Protected Routes**: Middleware-based authentication
- **Session Management**: Cookie-based sessions
- **Password Protection**: All passwords hashed/stored in Excel database

## 🚀 Version 2 (Coming Soon)

- 📱 WhatsApp Notifications
- 🔳 QR Code Attendance System
- 📚 Library Management
- 🚌 Transport Management
- 🌐 Online Learning Module
- 📍 GPS Tracking (Premium)
- 🤖 AI Features (Premium)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For support, email: support@schoolmanagement.com
