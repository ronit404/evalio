const multer = require('multer');
const path = require('path');

// Configure upload directory - use absolute path from the current file's location
const uploadDir = path.join(__dirname, '..', 'uploads');

// Configure how the file is stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Use absolute path
    },
    filename: (req, file, cb) => {
        // Renames file to: timestamp-originalName.jpg (to avoid duplicates)
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Filter to allow images, PDF, DOC, DOCX, PPT, PPTX, TXT
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpeg, jpg, png, gif), PDF, DOC, DOCX, PPT, PPTX, and TXT files are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // Limit to 10MB
});

module.exports = upload;
