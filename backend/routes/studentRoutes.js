const express = require('express');
const router = express.Router();
const { 
    getExams, 
    getExamDetails, 
    submitExam, 
    getMyResults, 
    getMyResultDetails, 
    verifyExamPassword, 
    getAllQuestions, 
    getSubjectDetails,
    getAvailableSubjects,
    saveSubjectSelections
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/exams', protect, getExams);
router.get('/exams/:id', protect, getExamDetails);
router.post('/verify-password', protect, verifyExamPassword);
router.post('/submit', protect, submitExam);
router.get('/my-results', protect, getMyResults);
router.get('/my-results/:id', protect, getMyResultDetails);
router.get('/questions', protect, getAllQuestions);
router.get('/subject/:subject', protect, getSubjectDetails);
router.get('/available-subjects', protect, getAvailableSubjects);
router.post('/save-subjects', protect, saveSubjectSelections);

module.exports = router;
