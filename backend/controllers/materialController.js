const StudyMaterial = require('../models/StudyMaterial');
const User = require('../models/User');

// Get all study materials (public - for students and admin)
exports.getAllMaterials = async (req, res) => {
    try {
        const { category, subject, year } = req.query;
        
        let query = {};
        if (category) {
            query.category = category;
        }
        if (subject) {
            query.subject = { $regex: new RegExp(subject, 'i') };
        }
        if (year) {
            query.year = parseInt(year);
        }
        
        const materials = await StudyMaterial.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get materials by subject and optionally year (for students and teachers)
exports.getMaterialsBySubject = async (req, res) => {
    try {
        const { subject, year, category } = req.query;
        
        if (!subject) {
            return res.status(400).json({ message: 'Subject is required' });
        }
        
        let query = {
            subject: { $regex: new RegExp(subject, 'i') }
        };
        
        if (year) {
            query.year = parseInt(year);
        }
        
        if (category) {
            query.category = category;
        }
        
        const materials = await StudyMaterial.find(query)
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload a new study material (Admin and Teacher)
exports.uploadMaterial = async (req, res) => {
    try {
        console.log("Request file:", req.file);
        console.log("Request body:", req.body);
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, description, category, subject, year } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ message: 'Title and category are required' });
        }

        // Validate category
        if (!['notes', 'question-bank'].includes(category)) {
            return res.status(400).json({ message: 'Invalid category. Must be "notes" or "question-bank"' });
        }

        // Validate subject for teachers
        if (!subject) {
            return res.status(400).json({ message: 'Subject is required' });
        }

        // Determine file type
        const fileType = req.file.originalname.split('.').pop().toLowerCase();
        const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
        
        if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({ message: 'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, Images' });
        }

        const mappedFileType = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType) ? 'image' : fileType;

        const material = await StudyMaterial.create({
            title,
            description: description || '',
            file: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            fileType: mappedFileType,
            category,
            subject,
            year: year ? parseInt(year) : null,
            uploadedBy: req.user?.id
        });

        res.status(201).json(material);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a study material (Admin and Teacher)
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check if user is the uploader or an admin
        const currentUser = await User.findById(req.user.id);
        if (material.uploadedBy?.toString() !== req.user.id && currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own uploads' });
        }

        await material.deleteOne();

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get materials by category
exports.getMaterialsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        
        if (!['notes', 'question-bank'].includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const materials = await StudyMaterial.find({ category })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

