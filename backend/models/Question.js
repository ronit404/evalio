const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    image: { type: String },
    questionType: { 
        type: String, 
        enum: ['mcq', 'detailed'], 
        default: 'mcq',
        required: true 
    },
    // For MCQ questions
    options: [{ type: String }], // Dynamic array of options (2-6)
    isMultipleCorrect: { type: Boolean, default: false }, // Whether multiple answers can be correct
    correctAnswers: [{ type: String }], // Array of correct option texts for MCQ
    correctAnswer: { type: String }, // Single correct answer (backward compatibility)
    // For Detailed questions
    expectedAnswer: { type: String }, // Expected answer text or guidelines for detailed questions
    // For all questions
    category: { type: String }, // e.g., "Java", "Web Programming"
    points: { type: Number, default: 1 },
    // Track who created the question
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
