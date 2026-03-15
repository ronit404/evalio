const express = require('express');
const router = express.Router();
const { 
    addQuestion, 
    createExam, 
    getAllSubmissions, 
    getExamAnalytics, 
    getAllQuestions, 
    getSubmissionDetails, 
    updateSubmissionAnswer, 
    updateQuestionScore,
    getAllUsers,
    getAllTeachers,
    getStudentsBySection,
    assignTeachersToStudent,
    updateStudentSection,
    getAllSections,
    updateTeacherSubjects,
    getTeachersByYear,
    getTeachersWithSubjects,
    updateStudentYear,
    assignSubjectsToStudent
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import our config

// Only logged-in Admins can access these
router.post('/add-question', protect, admin, upload.single('image'), addQuestion);
router.post('/create-exam', protect, admin, createExam);

router.get('/all-submissions', protect, admin, getAllSubmissions);
router.get('/analytics/:examId', protect, admin, getExamAnalytics);
router.get('/questions', protect, admin, getAllQuestions);
router.get('/all-questions', protect, getAllQuestions);

// Admin routes for viewing and editing student submissions
router.get('/submission/:submissionId', protect, admin, getSubmissionDetails);
router.put('/submission/:submissionId/answer', protect, admin, updateSubmissionAnswer);
router.put('/submission/:submissionId/score', protect, admin, updateQuestionScore);

// User management routes
router.get('/users', protect, admin, getAllUsers);
router.get('/teachers', protect, admin, getAllTeachers);
router.get('/students/:section', protect, admin, getStudentsBySection);
router.get('/sections', protect, admin, getAllSections);
router.put('/assign-teachers', protect, admin, assignTeachersToStudent);
router.put('/update-student-section', protect, admin, updateStudentSection);

// Teacher subjects management
router.put('/update-teacher-subjects', protect, admin, updateTeacherSubjects);
router.get('/teachers/by-year/:year', protect, admin, getTeachersByYear);
router.get('/teachers/with-subjects', protect, admin, getTeachersWithSubjects);

// Student year and subject management
router.put('/update-student-year', protect, admin, updateStudentYear);
router.put('/assign-subjects', protect, admin, assignSubjectsToStudent);

module.exports = router;
