const express = require('express');
const router = express.Router();
const { 
    addQuestion,
    getMyQuestions,
    getMySubjects, 
    updateMySubjects, 
    addTeachingSubject,
    removeTeachingSubject,
    getMyExams, 
    createExam,
    getExamAnalytics,
    updateSubmissionScore,
    getMyStudents,
    getMyMaterials,
    uploadMaterial,
    deleteMaterial,
    getAvailableSections,
    getAvailableYears,
    getSubjectAnalytics
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// Question routes
router.post('/add-question', upload.single('image'), addQuestion);
router.get('/questions', getMyQuestions);

// Exam routes
router.get('/exams', getMyExams);
router.post('/create-exam', createExam);
router.get('/exams/:examId/analytics', getExamAnalytics);
router.put('/submission/score', updateSubmissionScore);

// Subject management routes
router.get('/subjects', getMySubjects);
router.put('/subjects', updateMySubjects);
router.post('/subjects', addTeachingSubject);
router.delete('/subjects/:subjectId', removeTeachingSubject);

// Fixed Subject analytics route - moved optional param to query (?teachingSubjectIndex)
router.get('/subject-analytics/:subject/:year/:section', getSubjectAnalytics);

// Student routes
router.get('/students', getMyStudents);

// Material routes
router.get('/materials', getMyMaterials);
router.post('/materials', upload.single('file'), uploadMaterial);
router.delete('/materials/:materialId', deleteMaterial);

// Utility routes
router.get('/sections', getAvailableSections);
router.get('/years', getAvailableYears);

module.exports = router;
