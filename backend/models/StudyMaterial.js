const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    file: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'image'],
        required: true
    },
    category: {
        type: String,
        enum: ['notes', 'question-bank'],
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Subject for the material
    subject: {
        type: String,
        default: ''
    },
    // Year for the material (1, 2, 3, 4)
    year: {
        type: Number,
        min: 1,
        max: 4
    },
    teachingSubjectIndex: { type: Number, default: -1 }
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);

