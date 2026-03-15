const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getAllTeachers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { updateUserProfile } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', require('../controllers/authController').forgotPassword);
router.post('/reset-password', require('../controllers/authController').resetPassword);
router.post('/simple-reset', require('../controllers/authController').simpleResetPassword);

// Get all teachers for student registration (public access)
router.get('/teachers', getAllTeachers);

router.put('/profile', protect, updateUserProfile);

module.exports = router;
