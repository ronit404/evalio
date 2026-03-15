const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    // Teacher who created this exam
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Section this exam belongs to
    section: { type: String, required: true },
    // Year for the exam (1, 2, 3, 4)
    year: { type: Number, min: 1, max: 4 },
    // Subject for the exam
    subject: { type: String, default: '' },
    // Scheduling fields
    startDate: { type: Date },
    endDate: { type: Date },
    isScheduled: { type: Boolean, default: false },
    // Password protection
    password: { type: String, default: null },
    isPasswordProtected: { type: Boolean, default: false },
    teachingSubjectIndex: { type: Number, default: -1 } // Index in teacher's teachingSubjects array - makes same subject different sections unique
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
