const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [{
        questionId: String,
        selectedOption: mongoose.Schema.Types.Mixed // Support both string (MCQ) and text (detailed)
    }],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    tabSwitches: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Completed', 'Terminated'], default: 'Completed' },
    manualScores: { type: Map, of: Number, default: {} } // Store manual scores for detailed questions
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
