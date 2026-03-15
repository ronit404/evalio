const express = require('express');
const router = express.Router();
const { 
    getAllMaterials, 
    uploadMaterial, 
    deleteMaterial, 
    getMaterialsByCategory,
    getMaterialsBySubject 
} = require('../controllers/materialController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes - accessible by students and admin
router.get('/materials', getAllMaterials);
router.get('/materials/category/:category', getMaterialsByCategory);
router.get('/materials/subject', getMaterialsBySubject);

// Admin/Teacher routes - upload and delete materials
router.post('/materials', protect, upload.single('file'), uploadMaterial);
router.delete('/materials/:id', protect, deleteMaterial);

module.exports = router;

