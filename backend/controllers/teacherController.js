const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const StudyMaterial = require('../models/StudyMaterial');
const Question = require('../models/Question');
const User = require('../models/User');

// Add a question for a specific subject (Teacher)
exports.addQuestion = async (req, res) => {
    try {
        const { 
            questionText, 
            options, 
            correctAnswer, 
            correctAnswers, 
            category,
            questionType,
            isMultipleCorrect,
            expectedAnswer,
            points
        } = req.body;
        
        // Get the current user (teacher)
        const currentUser = await User.findById(req.user.id);
        
        // Verify teacher has access to this subject/category
        // Allow if:
        // 1. No category provided (exam questions)
        // 2. Category matches one of teacher's subjects
        // 3. Teacher has no subjects assigned (admin or super_admin)
        if (category && category.trim() !== '' && category.toLowerCase() !== 'exam') {
            const hasAccess = currentUser.teachingSubjects?.some(
                ts => ts.subject.toLowerCase() === category.toLowerCase()
            );
            
            if (!hasAccess) {
                // Check if teacher has any subjects assigned
                if (!currentUser.teachingSubjects || currentUser.teachingSubjects.length === 0) {
                    // Teacher has no subjects - allow them to add questions
                    // This handles admins and teachers without subject assignments
                } else {
                    return res.status(403).json({ 
                        message: 'You do not have permission to add questions for this subject. Please select a subject from your assigned subjects.' 
                    });
                }
            }
        }
        
        // Validate question text
        if (!questionText || questionText.trim() === '') {
            return res.status(400).json({ message: 'Question text is required' });
        }

        // Prepare the question data
        const questionData = {
            questionText,
            questionType: questionType || 'mcq',
            category: category || 'Exam',
            createdBy: req.user.id  // Track who created the question
        };

        // Handle MCQ questions
        if (questionType === 'mcq' || !questionType) {
            const parsedOptions = options ? JSON.parse(options) : [];
            const validOptions = parsedOptions.filter(opt => opt.trim() !== '');
            
            // Validate options count
            if (validOptions.length < 2) {
                return res.status(400).json({ message: 'Minimum 2 options required for MCQ questions' });
            }
            if (validOptions.length > 6) {
                return res.status(400).json({ message: 'Maximum 6 options allowed for MCQ questions' });
            }
            
            questionData.options = validOptions;
            questionData.isMultipleCorrect = isMultipleCorrect || false;
            
            // Handle correct answers
            if (isMultipleCorrect && correctAnswers) {
                const parsedCorrectAnswers = JSON.parse(correctAnswers);
                if (parsedCorrectAnswers.length < 1) {
                    return res.status(400).json({ message: 'At least one correct answer is required' });
                }
                questionData.correctAnswers = parsedCorrectAnswers;
                questionData.correctAnswer = null;
            } else {
                if (!correctAnswer || correctAnswer.trim() === '') {
                    return res.status(400).json({ message: 'Please select the correct answer' });
                }
                questionData.correctAnswer = correctAnswer;
                questionData.correctAnswers = null;
            }
        }
        
        // Handle detailed questions
        if (questionType === 'detailed') {
            questionData.expectedAnswer = expectedAnswer || '';
            questionData.options = [];
            questionData.correctAnswer = null;
            questionData.correctAnswers = null;
        }

        // Add points if provided
        if (points !== undefined && points !== null) {
            const parsedPoints = parseInt(points);
            if (isNaN(parsedPoints) || parsedPoints < 1) {
                return res.status(400).json({ message: 'Points must be a positive number' });
            }
            questionData.points = parsedPoints;
        } else {
            questionData.points = 1;
        }

        // If a file was uploaded, add the path to questionData
        if (req.file) {
            questionData.image = `/uploads/${req.file.filename}`;
        }

        const question = await Question.create(questionData);
        res.status(201).json(question);
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get teacher's own teaching subjects
exports.getMySubjects = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.teachingSubjects || []);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update teacher's own teaching subjects
exports.updateMySubjects = async (req, res) => {
    try {
        const { teachingSubjects } = req.body;
        
        if (!teachingSubjects || !Array.isArray(teachingSubjects) || teachingSubjects.length === 0) {
            return res.status(400).json({ message: 'At least one teaching subject is required' });
        }
        
        // Validate each teaching subject
        for (const ts of teachingSubjects) {
            if (!ts.subject || !ts.subject.trim()) {
                return res.status(400).json({ message: 'Subject name is required for each entry' });
            }
            if (!ts.section || !ts.section.trim()) {
                return res.status(400).json({ message: 'Section is required for each entry' });
            }
            if (!ts.years || !Array.isArray(ts.years) || ts.years.length === 0) {
                return res.status(400).json({ message: 'At least one year is required for each subject' });
            }
            // Validate years are between 1 and 4
            for (const year of ts.years) {
                if (year < 1 || year > 4) {
                    return res.status(400).json({ message: 'Years must be between 1 and 4' });
                }
            }
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update teaching subjects
        user.teachingSubjects = teachingSubjects;
        await user.save();
        
        res.json({ 
            message: 'Teaching subjects updated successfully',
            teachingSubjects: user.teachingSubjects
        });
    } catch (error) {
        console.error('Update subjects error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add a single teaching subject
exports.addTeachingSubject = async (req, res) => {
    try {
        const { subject, section, years } = req.body;
        
        if (!subject || !subject.trim()) {
            return res.status(400).json({ message: 'Subject name is required' });
        }
        if (!section || !section.trim()) {
            return res.status(400).json({ message: 'Section is required' });
        }
        if (!years || !Array.isArray(years) || years.length === 0) {
            return res.status(400).json({ message: 'At least one year is required' });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if subject already exists for this section
        const existingIndex = user.teachingSubjects.findIndex(
            ts => ts.subject.toLowerCase() === subject.toLowerCase() && ts.section === section
        );
        
        if (existingIndex >= 0) {
            // Update existing subject with new years
            const existingYears = user.teachingSubjects[existingIndex].years;
            const newYears = [...new Set([...existingYears, ...years])];
            user.teachingSubjects[existingIndex].years = newYears;
        } else {
            // Add new subject
            user.teachingSubjects.push({ subject, section, years });
        }
        
        await user.save();
        
        res.json({ 
            message: 'Teaching subject added successfully',
            teachingSubjects: user.teachingSubjects
        });
    } catch (error) {
        console.error('Add teaching subject error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Remove a teaching subject
exports.removeTeachingSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.teachingSubjects = user.teachingSubjects.filter(
            (_, index) => index.toString() !== subjectId
        );
        
        await user.save();
        
        res.json({ 
            message: 'Teaching subject removed successfully',
            teachingSubjects: user.teachingSubjects
        });
    } catch (error) {
        console.error('Remove teaching subject error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get teacher's exams (created by this teacher)
exports.getMyExams = async (req, res) => {
    try {
        const exams = await Exam.find({ teacherId: req.user.id })
            .populate('questions', 'questionText')
            .sort({ createdAt: -1 })
            .limit(50); // Prevent overload
        
        // Add status to each exam based on scheduling
        const examsWithStatus = exams.map(exam => {
            const examObj = exam.toObject();
            
            if (exam.isScheduled) {
                const now = new Date();
                const startDate = new Date(exam.startDate);
                const endDate = new Date(exam.endDate);

                if (now < startDate) {
                    examObj.examStatus = 'upcoming';
                } else if (now > endDate) {
                    examObj.examStatus = 'expired';
                } else {
                    examObj.examStatus = 'available';
                }
            } else {
                examObj.examStatus = 'available';
            }
            
            return examObj;
        });
        
        res.json(examsWithStatus);
    } catch (error) {
        console.error("Error fetching exams:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create an exam (Teacher)
exports.createExam = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            questions, 
            duration, 
            totalMarks, 
            startDate, 
            endDate, 
            isScheduled, 
            password, 
            isPasswordProtected,
            section,
            subject,
            year
            // Removed invalid state?.teachingSubjectIndex reference
        } = req.body;
        
        // Get the current user (teacher) creating the exam
        const currentUser = await User.findById(req.user.id);
        
        // Determine section and teacherId
        let examSection = section;
        let teacherId = req.user.id;
        
        // If user is a teacher or section_admin, use their section
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            examSection = currentUser.section;
            teacherId = currentUser._id;
        }
        
        // If section is still not set, return error
        if (!examSection) {
            return res.status(400).json({ message: 'Section is required to create an exam' });
        }
        
        const examData = { 
            title, 
            description, 
            questions, 
            duration, 
            totalMarks,
            section: examSection,
            teacherId: teacherId,
            subject: subject || '',
            year: year ? parseInt(year) : null
            // Removed teachingSubjectIndex - was undefined state reference
        };
        
        // Add scheduling fields if exam is scheduled
        if (isScheduled && startDate && endDate) {
            examData.startDate = new Date(startDate);
            examData.endDate = new Date(endDate);
            examData.isScheduled = true;
        }
        
        // Add password protection fields
        if (isPasswordProtected && password) {
            examData.password = password;
            examData.isPasswordProtected = true;
        } else {
            examData.password = null;
            examData.isPasswordProtected = false;
        }
        
        const exam = await Exam.create(examData);
        
        res.status(201).json(exam);
    } catch (error) {
        console.error("Error creating exam:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all questions for the teacher's subjects
exports.getMyQuestions = async (req, res) => {
    try {
        const { category, questionType } = req.query;
        
        // Get the current user (teacher)
        const currentUser = await User.findById(req.user.id);
        
        // Get teacher's subjects
        const teacherSubjects = currentUser.teachingSubjects || [];
        const subjectNames = teacherSubjects.map(ts => ts.subject.toLowerCase());
        
        // Build query - get questions where category matches one of teacher's subjects
        // or if no subjects assigned, get all questions created by this teacher
        let query = {};
        
        if (teacherSubjects.length > 0) {
            // Get questions where category matches one of the teacher's subjects
            // OR questions that were added by this teacher
            query = {
                $or: [
                    { category: { $in: subjectNames } },
                    { category: { $regex: new RegExp(subjectNames.join('|'), 'i') } },
                    { createdBy: req.user.id }
                ]
            };
        } else {
            // If no subjects assigned, get all questions created by this teacher
            query = { createdBy: req.user.id };
        }
        
        // Add optional filters - but keep the subject filtering
        if (category) {
            // If category is provided, verify it's one of teacher's subjects
            const isTeacherSubject = subjectNames.some(name => 
                name.toLowerCase() === category.toLowerCase()
            );
            
            if (isTeacherSubject || teacherSubjects.length === 0) {
                // Allow only if it's one of teacher's subjects or teacher has no subjects
                query.category = category;
            } else {
                // Category doesn't match teacher's subjects - return empty
                return res.json([]);
            }
        }
        
        if (questionType) {
            query.questionType = questionType;
        }
        
        const questions = await Question.find(query).sort({ createdAt: -1 }).limit(100);
        res.json(questions);
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get teacher's own materials
exports.getMyMaterials = async (req, res) => {
    try {
        const { subject, year } = req.query;
        
        let query = { uploadedBy: req.user.id };
        
        if (subject) {
            query.subject = subject;
        }
        
        if (year) {
            query.year = parseInt(year);
        }
        
        const materials = await StudyMaterial.find(query).sort({ createdAt: -1 }).limit(50);
        
        res.json(materials);
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Upload material for a specific subject and year
exports.uploadMaterial = async (req, res) => {
    try {
        const { title, description, category, subject, year } = req.body;
        
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }
        
        if (!subject || !subject.trim()) {
            return res.status(400).json({ message: 'Subject is required' });
        }
        
        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }
        
        // Get file extension
        const fileName = req.file.originalname;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Determine file type
        let fileType = 'txt';
        if (['pdf'].includes(fileExtension)) {
            fileType = 'pdf';
        } else if (['doc', 'docx'].includes(fileExtension)) {
            fileType = 'doc';
        } else if (['ppt', 'pptx'].includes(fileExtension)) {
            fileType = 'ppt';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            fileType = 'image';
        }
        
        const material = await StudyMaterial.create({
            title,
            description: description || '',
            file: `/uploads/${req.file.filename}`,
            fileName,
            fileType,
            category: category || 'notes',
            uploadedBy: req.user.id,
            subject,
            year: parseInt(year)
        });
        
        res.status(201).json({
            message: 'Material uploaded successfully',
            material
        });
    } catch (error) {
        console.error('Upload material error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete teacher's own material
exports.deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        
        const material = await StudyMaterial.findById(materialId);
        
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        
        // Check if the material belongs to this teacher
        if (material.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        await StudyMaterial.findByIdAndDelete(materialId);
        
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all sections available for teacher's subjects
exports.getAvailableSections = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get unique sections from teaching subjects
        const sections = [...new Set((user.teachingSubjects || []).map(ts => ts.section))];
        
        res.json(sections);
    } catch (error) {
        console.error('Get sections error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get years available for a specific subject and section
exports.getAvailableYears = async (req, res) => {
    try {
        const { subject, section } = req.query;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const teachingSubject = (user.teachingSubjects || []).find(
            ts => ts.subject.toLowerCase() === subject.toLowerCase() && ts.section === section
        );
        
        if (!teachingSubject) {
            return res.json([]);
        }
        
        res.json(teachingSubject.years);
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Simplified exam analytics - limit scope
exports.getExamAnalytics = async (req, res) => {
    try {
        const examId = req.params.examId;
        
        // Verify the exam belongs to this teacher
        const exam = await Exam.findById(examId);
        
        if (!exam || exam.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied or exam not found.' });
        }
        
        // Get submissions (no limit for analytics - get ALL)
        const submissions = await Submission.find({ exam: examId })
            .populate('student', 'name email section year')
            .sort({ createdAt: -1 });
        
        if (!submissions || submissions.length === 0) {
            return res.json({ 
                totalSubmissions: 0,
                message: "No submissions yet" 
            });
        }
        
        // Calculate stats
        const scorePercentages = submissions.map(s => {
            if (s.totalPoints > 0) {
                return Math.round((s.score / s.totalPoints) * 100);
            }
            return 0;
        });
        
        const totalSubmissions = scorePercentages.length;
        const averageScore = scorePercentages.reduce((a, b) => a + b, 0) / totalSubmissions;
        const highestScore = Math.max(...scorePercentages);
        const lowestScore = Math.min(...scorePercentages);
        const passCount = scorePercentages.filter(s => s >= 40).length;
        
        // Build students list WITH examTitle (for consistency with subject analytics)
        const studentsSummary = submissions.map(sub => {
            const percentage = sub.totalPoints > 0 
                ? Math.round((sub.score / sub.totalPoints) * 100) 
                : 0;
            return {
                _id: sub.student._id,
                name: sub.student?.name || 'Unknown Student',
                email: sub.student?.email || 'N/A',
                section: sub.student?.section || 'N/A',
                year: sub.student?.year || 'N/A',
                examsAttempted: [{
                    examId: exam._id,
                    examTitle: exam.title,
                    score: percentage,
                    submittedAt: sub.createdAt,
                    submissionId: sub._id
                }],
                avgScore: percentage,
                examCount: 1
            };
        });
        
        res.json({
            totalSubmissions,
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore,
            lowestScore,
            passCount,
            examTitle: exam.title,
            studentsSummary, // Consistent shape with subject analytics
            studentSubmissions: [] // Empty for single exam
        });
    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Enhanced subject analytics - Aggregate by student with exam details
exports.getSubjectAnalytics = async (req, res) => {
    try {
        const { subject, year, section, teachingSubjectIndex } = req.params;
        
        // Verify teacher access first
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const teachingSubject = user.teachingSubjects?.find(
            ts => ts.subject.toLowerCase() === subject.toLowerCase() && 
                  ts.section === section &&
                  (!year || ts.years.includes(parseInt(year)))
        );
        
        if (!teachingSubject) {
            return res.status(403).json({ message: 'Access denied to this subject' });
        }
        
        // Build targeted exam query
        const examQuery = {
            teacherId: req.user.id,
            $or: [
                { subject: { $regex: new RegExp(subject, 'i') } },
                { section: section },
                { year: parseInt(year) }
            ]
        };
        
        const exams = await Exam.find(examQuery).sort({ createdAt: -1 }).limit(50);
        
        // Fallback to teacher exams if none found
        if (exams.length === 0) {
            const fallbackExams = await Exam.find({ teacherId: req.user.id }).sort({ createdAt: -1 }).limit(50);
            exams = fallbackExams;
        }
        
        // Get submissions for these exams WITH exam population
        const examIds = exams.map(e => e._id);
        const submissions = await Submission.find({ exam: { $in: examIds } })
            .populate('student', 'name email section year')
            .populate('exam', 'title')
            .sort({ createdAt: -1 })
            .limit(500); // Increased for better aggregation
        
        // Get questions for completeness
        const questions = await Question.find({
            $or: [
                { category: { $regex: new RegExp(subject, 'i') } },
                { createdBy: req.user.id }
            ]
        }).limit(50);
        
        // AGGREGATE SUBMISSIONS BY STUDENT
        const studentMap = {};
        submissions.forEach(sub => {
            const percentage = sub.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : 0;
            const studentId = sub.student._id.toString();
            
            if (!studentMap[studentId]) {
                studentMap[studentId] = {
                    _id: studentId,
                    name: sub.student.name || 'Unknown Student',
                    email: sub.student.email || 'N/A',
                    section: sub.student.section || 'N/A',
                    year: sub.student.year || 'N/A',
                    examsAttempted: [],
                    totalScore: 0,
                    examCount: 0
                };
            }
            
            studentMap[studentId].examsAttempted.push({
                examId: sub.exam._id,
                examTitle: sub.exam.title,
                score: percentage,
                submittedAt: sub.createdAt,
                submissionId: sub._id
            });
            
            studentMap[studentId].totalScore += percentage;
            studentMap[studentId].examCount++;
        });
        
        // Convert to array, calculate avg scores
        const studentsSummary = Object.values(studentMap).map(student => {
            return {
                ...student,
                avgScore: Math.round(student.totalScore / student.examCount * 10) / 10,
                totalScore: student.totalScore
            };
        }).sort((a, b) => b.avgScore - a.avgScore); // Sort by avg score desc
        
        // Calculate overall stats
        const allScores = submissions.map(s => s.totalPoints > 0 ? Math.round((s.score / s.totalPoints) * 100) : 0);
        const totalSubmissions = allScores.length;
        const averageScore = totalSubmissions > 0 ? (allScores.reduce((a, b) => a + b, 0) / totalSubmissions) : 0;
        const highestScore = Math.max(...allScores, 0);
        const passCount = allScores.filter(s => s >= 40).length;
        
        // Recent submissions for quick list (top 10)
        const recentSubmissions = submissions.slice(0, 10).map(sub => {
            const percentage = sub.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : 0;
            return {
                studentName: sub.student.name || 'Unknown',
                examTitle: sub.exam.title,
                score: percentage
            };
        });
        
        res.json({
            subject, 
            year: year || 'All', 
            section,
            totalExams: exams.length,
            totalQuestions: questions.length, 
            totalSubmissions,
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore: Math.round(highestScore),
            lowestScore: Math.round(Math.min(...allScores, 0)),
            passCount,
            medianScore: Math.round(allScores.sort((a,b)=>a-b)[Math.floor(allScores.length/2)] || 0),
            studentsSummary, // NEW: Aggregated student data
            studentSubmissions: recentSubmissions, // For quick list
            exams: exams.slice(0, 10),
            questions: questions.slice(0, 20)
        });
    } catch (error) {
        console.error("Subject analytics error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update submission score (kept as-is, added logging)
exports.updateSubmissionScore = async (req, res) => {
    try {
        const { submissionId, questionId, score } = req.body;
        
        if (!submissionId || score === undefined) {
            return res.status(400).json({ message: 'Submission ID and score are required' });
        }

        const parsedPercentage = parseFloat(score);
        if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
            return res.status(400).json({ message: 'Score must be between 0 and 100' });
        }

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        const exam = await Exam.findById(submission.exam);
        if (!exam || exam.teacherId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Simplified score update logic
        const examWithQuestions = await Exam.findById(submission.exam).populate('questions');
        const totalPoints = examWithQuestions.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        submission.score = Math.round((parsedPercentage / 100) * totalPoints);
        submission.totalPoints = totalPoints;
        await submission.save();

        res.json({ 
            message: 'Score updated successfully',
            score: submission.score,
            totalPoints: submission.totalPoints
        });
    } catch (error) {
        console.error("Error updating submission score:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get teacher's students (simplified)
exports.getMyStudents = async (req, res) => {
    try {
        // Get teacher's exams
        const exams = await Exam.find({ teacherId: req.user.id });
        if (exams.length === 0) {
            return res.json({ studentsBySubject: [] });
        }
        
        // Get submissions for teacher's exams
        const examIds = exams.map(e => e._id);
        const submissions = await Submission.find({ 
            exam: { $in: examIds } 
        }).populate('student', 'name email section year');
        
        // Aggregate unique students by subject/year
        const subjectYearMap = {};
        submissions.forEach(sub => {
            const exam = exams.find(e => e._id.equals(sub.exam));
            if (!exam) return;
            
            const subject = exam.subject || 'General';
            const year = exam.year || 'All';
            const key = `${subject}-${year}`;
            
            if (!subjectYearMap[key]) {
                subjectYearMap[key] = new Set();
            }
            
            subjectYearMap[key].add(sub.student._id.toString());
        });
        
        // Convert to expected frontend format
        const studentsBySubject = Object.entries(subjectYearMap).map(([key, studentSet]) => {
            const [subject, year] = key.split('-');
            return {
                subject,
                year,
                students: Array.from(studentSet).length // Pure NUMBER count
            };
        });
        
        res.json({
            studentsBySubject
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: error.message });
    }
};
