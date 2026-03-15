# 🚀 Evalio - Modern Educational Platform

<div align="center">

![Evalio Logo](frontend/public/evalio-logo.svg)

[![React](https://img.shields.io/badge/React-19-brightgreen)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-blue)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-green)](https://mongodb.com)

**Empowering Education with Role-Based Learning Management System (LMS)**

</div>

## ✨ Features

Evalio is a full-stack educational platform designed for **Admins**, **Teachers**, and **Students**:

### 👨‍💼 **Admin Dashboard**
- 📊 Exam analytics & submission details
- 👥 Manage students & assign teachers to subjects
- 📝 Create exams & add questions to bank
- 📚 Upload & manage study materials
- 🔐 Full system oversight

### 👨‍🏫 **Teacher Dashboard**
- 📚 Upload study materials per subject/year/section
- 📝 Create subject-specific exams & questions
- 📋 View assigned subjects & students
- 🎯 Targeted teaching tools

### 🧑‍🎓 **Student Dashboard**
- 📚 Access teacher-uploaded materials
- ❓ Explore question bank
- 📖 Subject-wise detail pages
- ⏱️ Timed exams with results
- 📈 Personal results tracking

### 🌐 **Core Features**
- 🔐 JWT Authentication (Login/Register/Reset Password)
- 🛡️ Role-based Protected Routes
- 📁 File Uploads (PDF materials/syllabi)
- 📧 Email Integration
- 📱 Responsive UI with animations (Framer Motion)

## 🛠 Tech Stack

| Frontend | Backend | Database | Tools |
|----------|---------|----------|-------|
| React 19 | Node.js / Express | MongoDB (Mongoose) | Vite, Axios |
| React Router | JWT, bcryptjs |  | Multer (uploads) |
| Tailwind CSS | Nodemailer |  | Nodemon |
| Framer Motion | CORS, dotenv |  | React Hot Toast |

## 📁 Project Structure

```
Evalio/
├── backend/          # Express API Server
│   ├── config/       # DB config
│   ├── controllers/  # Role-based controllers
│   ├── middleware/   # Auth & Upload middleware
│   ├── models/       # Mongoose schemas (User, Exam, Question...)
│   ├── routes/       # API routes
│   └── uploads/      # Study materials PDFs
├── frontend/         # React + Vite App
│   ├── src/
│   │   ├── components/ # Reusable UI (Navbar, GradeBadge...)
│   │   ├── context/    # AuthContext
│   │   ├── pages/      # Role-specific pages
│   │   └── api/        # Axios config
│   └── public/         # Logo & assets
└── README.md         # You're reading it!
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <your-repo> Evalio
cd Evalio
```

**Backend:**
```bash
cd backend
cp .env.example .env  # Create .env (see below)
npm install
npm run dev
```

**Frontend:**
```bash
cd ../frontend
npm install
npm run dev
```

### 2. Environment Variables

Create `.env` in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017/evalio
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Default login redirects to Teacher Dashboard

## 🔐 User Roles & Navigation

| Role | Login → Dashboard | Key Pages |
|------|-------------------|-----------|
| **Admin** | `/admin` | Analytics, Students, Exams, Materials |
| **Teacher** | `/teacher` | Subjects, Create Exam, Upload Materials |
| **Student** | `/student` | Materials, Question Bank, Exams |

- Exams: `/exam/:id`
- Results: `/results`
- Materials: `/materials`

## 📚 Screenshots (Add your own!)

<details>
<summary>Admin Dashboard</summary>
<img src="screenshots/admin-dashboard.png" alt="Admin Dashboard" />
</details>

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push & PR!

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with ❤️ for modern education
- Icons by Lucide React
- UI Animations by Framer Motion

---

⭐ **Star us on GitHub if Evalio helps your institution!** ⭐

