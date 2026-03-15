import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AddQuestion from './pages/AddQuestion.jsx';
import CreateExam from './pages/CreateExam.jsx';
import ExamPage from './pages/ExamPage.jsx';
import Results from './pages/Results.jsx';
import ViewStudents from './pages/ViewStudents.jsx';
import ExamAnalytics from './pages/ExamAnalytics.jsx';
import SubmissionDetails from './pages/SubmissionDetails.jsx';
import StudyMaterials from './pages/StudyMaterials.jsx';
import StudentMaterials from './pages/StudentMaterials.jsx';
import StudentQuestionBank from './pages/StudentQuestionBank.jsx';
import TeacherAssignment from './pages/TeacherAssignment.jsx';
import TeacherSubjectAssignment from './pages/TeacherSubjectAssignment.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TeacherCreateExam from './pages/TeacherCreateExam.jsx';
import TeacherMaterials from './pages/TeacherMaterials.jsx';
import SubjectAdmin from './pages/SubjectAdmin.jsx';
import StudentSubjectDetail from './pages/StudentSubjectDetail.jsx';
import SubjectSelection from './pages/SubjectSelection.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function NavbarWrapper() {
  const location = useLocation();
  // Hide navbar on exam page
  if (location.pathname.startsWith('/exam/')) {
    return null;
  }
  return <Navbar />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavbarWrapper />
        <Routes>
  {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Default route - Teacher Dashboard for authenticated users */}
          <Route path="/" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          
          {/* Student specific route */}
          <Route path="/student" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
<Route path="/student/subject/:subject" element={
            <ProtectedRoute>
              <StudentSubjectDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/student/select-subjects" element={
            <ProtectedRoute>
              <SubjectSelection />
            </ProtectedRoute>
          } />
          
          <Route path="/exam/:id" element={
            <ProtectedRoute>
              <ExamPage />
            </ProtectedRoute>
          } />

          <Route path="/results" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute isAdminRequired={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/add-question" element={
            <ProtectedRoute isAdminRequired={true}>
              <AddQuestion />
            </ProtectedRoute>
          } />

          <Route path="/admin/create-exam" element={
            <ProtectedRoute isAdminRequired={true}>
              <CreateExam />
            </ProtectedRoute>
          } />

          <Route path="/admin/view-students" element={
            <ProtectedRoute isAdminRequired={true}>
              <ViewStudents />
            </ProtectedRoute>
          } />

          <Route path="/admin/analytics/:examId" element={
            <ProtectedRoute isAdminRequired={true}>
              <ExamAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/admin/submission/:submissionId" element={
            <ProtectedRoute isAdminRequired={true}>
              <SubmissionDetails />
            </ProtectedRoute>
          } />

          <Route path="/admin/study-materials" element={
            <ProtectedRoute isAdminRequired={true}>
              <StudyMaterials />
            </ProtectedRoute>
          } />

          <Route path="/admin/assign-teachers" element={
            <ProtectedRoute isAdminRequired={true}>
              <TeacherAssignment />
            </ProtectedRoute>
          } />

          <Route path="/admin/teacher-subjects" element={
            <ProtectedRoute isAdminRequired={true}>
              <TeacherSubjectAssignment />
            </ProtectedRoute>
          } />

          {/* Teacher Protected Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          } />

          <Route path="/teacher/subjects" element={
            <ProtectedRoute>
              <TeacherSubjectAssignment />
            </ProtectedRoute>
          } />

          {/* Subject-specific Admin Center */}
          <Route path="/teacher/subject/:subject/:year/:section" element={
            <ProtectedRoute>
              <SubjectAdmin />
            </ProtectedRoute>
          } />

          <Route path="/teacher/create-exam" element={
            <ProtectedRoute>
              <TeacherCreateExam />
            </ProtectedRoute>
          } />

          <Route path="/teacher/add-question" element={
            <ProtectedRoute>
              <AddQuestion />
            </ProtectedRoute>
          } />

          <Route path="/teacher/upload-material" element={
            <ProtectedRoute>
              <TeacherMaterials />
            </ProtectedRoute>
          } />

          <Route path="/teacher/materials" element={
            <ProtectedRoute>
              <TeacherMaterials />
            </ProtectedRoute>
          } />

          <Route path="/materials" element={
            <ProtectedRoute>
              <StudentMaterials />
            </ProtectedRoute>
          } />

          <Route path="/question-bank" element={
            <ProtectedRoute>
              <StudentQuestionBank />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
