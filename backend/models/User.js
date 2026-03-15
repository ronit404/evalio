const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    // Role management: super_admin, section_admin, teacher, student
    role: { 
        type: String, 
        enum: ['super_admin', 'section_admin', 'teacher', 'student'], 
        default: 'student' 
    },
    // Branch for students (e.g., "CSE", "IT", "ECE")
    branch: { type: String, default: '' },
    // Department for teachers (e.g., "CSE", "IT", "ECE")
    department: { type: String, default: '' },
    // Section for section-based organization (e.g., "CSE-A", "CSE-B", "IT-A")
    section: { type: String, default: '' },
    // For students: year of study (1, 2, 3, 4)
    year: { type: Number, min: 1, max: 4, default: null },
    // For teachers: list of subjects with years they teach
    // Structure: [{ subject: "Mathematics", years: [1, 2], section: "CSE-A" }]
    teachingSubjects: [{
        subject: { type: String, required: true },
        years: [{ type: Number, min: 1, max: 4 }],
        section: { type: String, required: true }
    }],
    // For students: list of subjects they're enrolled in with teacher info
    // Structure: [{ subject: "Mathematics", teacherId: "xxx", teacherName: "Mr. Smith" }]
    enrolledSubjects: [{
        subject: { type: String, required: true },
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        teacherName: { type: String }
    }],
    // For students: list of teachers assigned to this student
    assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // For teachers: list of students in their section
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
