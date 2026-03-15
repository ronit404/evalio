const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const User = require('../models/User');
const mongoose = require('mongoose');

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
        
        // Prepare the question data
        const questionData = {
            questionText,
            questionType: questionType || 'mcq',
            category
        };

        // Validate question text
        if (!questionText || questionText.trim() === '') {
            return res.status(400).json({ message: 'Question text is required' });
        }

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
                questionData.correctAnswer = null; // Clear single answer field
            } else {
                if (!correctAnswer || correctAnswer.trim() === '') {
                    return res.status(400).json({ message: 'Please select the correct answer' });
                }
                questionData.correctAnswer = correctAnswer;
                questionData.correctAnswers = null; // Clear multiple answers field
            }
        }
        
        // Handle detailed questions
        if (questionType === 'detailed') {
            questionData.expectedAnswer = expectedAnswer || '';
            questionData.options = []; // No options for detailed questions
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
            questionData.points = 1; // Default to 1 point
        }

        // If a file was uploaded, add the path to questionData
        if (req.file) {
            questionData.image = `/uploads/${req.file.filename}`;
        }

        const question = await Question.create(questionData);
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create an exam by linking question IDs
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
            year: year || null
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
        res.status(500).json({ message: error.message });
    }
};

// Get all submissions for all students (Admin only)
exports.getAllSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find()
            .populate('student', 'name email')
            .populate('exam', 'title')
            .sort({ createdAt: -1 });
        
        // Calculate percentages for each submission
        const submissionsWithPercentages = submissions.map(sub => {
            const percentage = sub.totalPoints > 0 
                ? Math.round((sub.score / sub.totalPoints) * 100) 
                : 0;
            return {
                ...sub.toObject(),
                scorePercentage: percentage
            };
        });
        
        res.json(submissionsWithPercentages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getExamAnalytics = async (req, res) => {
    try {
        const examId = new mongoose.Types.ObjectId(req.params.examId);
        
        // Get all submissions for this exam with student details
        const submissions = await Submission.find({ exam: examId })
            .populate('student', 'name email')
            .sort({ createdAt: -1 });
        
        if (!submissions || submissions.length === 0) {
            return res.json({ 
                totalSubmissions: 0,
                message: "No submissions yet" 
            });
        }
        
        // Calculate score percentages
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
        
        // Calculate median
        const sortedScores = [...scorePercentages].sort((a, b) => a - b);
        const mid = Math.floor(sortedScores.length / 2);
        const medianScore = sortedScores.length % 2 !== 0 
            ? sortedScores[mid] 
            : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
        
        // Pass count (assuming 40% is passing)
        const passCount = scorePercentages.filter(s => s >= 40).length;
        
        // Score distribution (as percentages)
        const scoreDistribution = scorePercentages;
        
        // Get exam details
        const exam = await Exam.findById(examId);
        
        // Format student data with percentage scores and submission IDs
        const students = submissions.map(sub => {
            const percentage = sub.totalPoints > 0 
                ? Math.round((sub.score / sub.totalPoints) * 100) 
                : 0;
            return {
                _id: sub._id,
                name: sub.student?.name || 'Unknown',
                email: sub.student?.email || 'Unknown',
                score: percentage,
                submittedAt: sub.createdAt
            };
        });
        
        res.json({
            totalSubmissions,
            averageScore: Math.round(averageScore * 10) / 10,
            highestScore,
            lowestScore,
            medianScore: Math.round(medianScore * 10) / 10,
            passCount,
            scoreDistribution,
            students,
            examTitle: exam?.title || 'Exam'
        });
    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find().sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get detailed submission with all questions and answers (Admin only)
exports.getSubmissionDetails = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId)
            .populate('student', 'name email')
            .populate('exam', 'title description duration');

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // Get the exam with questions
        const exam = await Exam.findById(submission.exam._id).populate('questions');
        
        // Build detailed question analysis
        const questionAnalysis = exam.questions.map((question, index) => {
            const studentAnswer = submission.answers.find(
                a => a.questionId === question._id.toString()
            );
            
            let isCorrect = false;
            let correctAnswer = '';
            
            if (question.questionType === 'mcq' || !question.questionType) {
                if (question.isMultipleCorrect && question.correctAnswers?.length > 0) {
                    const selectedOptions = studentAnswer?.selectedOption 
                        ? (Array.isArray(studentAnswer.selectedOption) 
                            ? studentAnswer.selectedOption 
                            : [studentAnswer.selectedOption])
                        : [];
                    
                    const allCorrectSelected = question.correctAnswers.every(correctAns => 
                        selectedOptions.some(selected => 
                            selected?.toLowerCase?.().trim() === correctAns.toLowerCase().trim()
                        )
                    );
                    
                    const noWrongSelected = selectedOptions.every(selected => 
                        question.correctAnswers.some(correctAns => 
                            correctAns.toLowerCase().trim() === selected?.toLowerCase?.().trim()
                        )
                    );
                    
                    isCorrect = allCorrectSelected && noWrongSelected;
                    correctAnswer = question.correctAnswers.join(', ');
                } else {
                    const selected = studentAnswer?.selectedOption;
                    const correct = question.correctAnswer;
                    isCorrect = selected?.toLowerCase?.().trim() === correct?.toLowerCase?.().trim();
                    correctAnswer = question.correctAnswer || '';
                }
            }
            
            // Get manual score if exists
            const earnedScore = submission.manualScores ? submission.manualScores[question._id.toString()] : undefined;
            
            return {
                questionNumber: index + 1,
                questionId: question._id,
                questionText: question.questionText,
                questionType: question.questionType,
                category: question.category,
                yourAnswer: studentAnswer?.selectedOption || null,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                isSkipped: !studentAnswer?.selectedOption,
                options: question.options,
                points: question.points || 1,
                expectedAnswer: question.expectedAnswer || '',
                earnedScore: earnedScore
            };
        });

        // Recalculate score including manual scores to ensure accuracy
        let calculatedScore = 0;
        let totalPoints = 0;

        exam.questions.forEach((question) => {
            const questionPoints = question.points || 1;
            totalPoints += questionPoints;

            // Check if there's a manual score for this question
            if (submission.manualScores && submission.manualScores[question._id.toString()] !== undefined) {
                calculatedScore += submission.manualScores[question._id.toString()];
                return;
            }

            const studentAnswer = submission.answers.find(
                a => a.questionId === question._id.toString()
            );
            
            if (!studentAnswer || !studentAnswer.selectedOption) {
                return;
            }

            // Auto-grade MCQ questions
            if (question.questionType === 'mcq' || !question.questionType) {
                if (question.isMultipleCorrect && question.correctAnswers && question.correctAnswers.length > 0) {
                    const selectedOptions = Array.isArray(studentAnswer.selectedOption) 
                        ? studentAnswer.selectedOption 
                        : [studentAnswer.selectedOption];
                    
                    const allCorrectSelected = question.correctAnswers.every(correctAns => 
                        selectedOptions.some(selected => 
                            selected.toLowerCase().trim() === correctAns.toLowerCase().trim()
                        )
                    );

                    const noWrongSelected = selectedOptions.every(selected => 
                        question.correctAnswers.some(correctAns => 
                            correctAns.toLowerCase().trim() === selected.toLowerCase().trim()
                        )
                    );

                    if (allCorrectSelected && noWrongSelected) {
                        calculatedScore += questionPoints;
                    }
                } else {
                    if (studentAnswer.selectedOption.toLowerCase().trim() === 
                        (question.correctAnswer || '').toLowerCase().trim()) {
                        calculatedScore += questionPoints;
                    }
                }
            }
            // Detailed questions without manual score get 0
        });

        // Update the submission with correct score if there's a discrepancy
        if (calculatedScore !== submission.score || totalPoints !== submission.totalPoints) {
            submission.score = calculatedScore;
            submission.totalPoints = totalPoints;
            await submission.save();
        }

        // Calculate statistics
        const totalQuestions = questionAnalysis.length;
        const correctAnswers = questionAnalysis.filter(q => q.isCorrect).length;
        const wrongAnswers = questionAnalysis.filter(q => !q.isCorrect && !q.isSkipped).length;
        const skippedQuestions = questionAnalysis.filter(q => q.isSkipped).length;
        
        const statistics = {
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            skippedQuestions,
            score: submission.score,
            totalPoints: submission.totalPoints,
            percentage: totalQuestions > 0 ? Math.round((submission.score / submission.totalPoints) * 100) : 0,
            tabSwitches: submission.tabSwitches || 0,
            warningCount: submission.warningCount || 0,
            status: submission.status,
            submittedAt: submission.createdAt
        };

        res.json({
            submission,
            exam: exam,
            student: submission.student,
            questionAnalysis,
            statistics
        });
    } catch (error) {
        console.error("Error fetching submission details:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update a student's answer for a specific question (Admin only)
exports.updateSubmissionAnswer = async (req, res) => {
    try {
        const { questionId, newAnswer, manualScore } = req.body;
        
        if (!questionId || newAnswer === undefined) {
            return res.status(400).json({ message: 'Question ID and new answer are required' });
        }

        const submission = await Submission.findById(req.params.submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // Find and update the answer
        const answerIndex = submission.answers.findIndex(
            a => a.questionId === questionId
        );

        if (answerIndex === -1) {
            // Answer doesn't exist, add it
            submission.answers.push({
                questionId,
                selectedOption: newAnswer
            });
        } else {
            // Update existing answer
            submission.answers[answerIndex].selectedOption = newAnswer;
        }

        // Recalculate the score
        const exam = await Exam.findById(submission.exam).populate('questions');
        let newScore = 0;
        let totalPoints = 0;

        exam.questions.forEach((question) => {
            const questionPoints = question.points || 1;
            totalPoints += questionPoints;

            const studentAnswer = submission.answers.find(
                a => a.questionId === question._id.toString()
            );
            
            if (!studentAnswer || !studentAnswer.selectedOption) {
                return;
            }

            if (question.questionType === 'mcq' || !question.questionType) {
                if (question.isMultipleCorrect && question.correctAnswers && question.correctAnswers.length > 0) {
                    const selectedOptions = Array.isArray(studentAnswer.selectedOption) 
                        ? studentAnswer.selectedOption 
                        : [studentAnswer.selectedOption];
                    
                    const allCorrectSelected = question.correctAnswers.every(correctAns => 
                        selectedOptions.some(selected => 
                            selected.toLowerCase().trim() === correctAns.toLowerCase().trim()
                        )
                    );

                    const noWrongSelected = selectedOptions.every(selected => 
                        question.correctAnswers.some(correctAns => 
                            correctAns.toLowerCase().trim() === selected.toLowerCase().trim()
                        )
                    );

                    if (allCorrectSelected && noWrongSelected) {
                        newScore += questionPoints;
                    }
                } else {
                    if (studentAnswer.selectedOption.toLowerCase().trim() === 
                        (question.correctAnswer || '').toLowerCase().trim()) {
                        newScore += questionPoints;
                    }
                }
            }
            // Detailed questions are not auto-graded - handled separately by admin
        });

        submission.score = newScore;
        submission.totalPoints = totalPoints;
        
        await submission.save();

        res.json({ 
            message: 'Answer updated successfully',
            newScore,
            totalPoints,
            newPercentage: Math.round((newScore / totalPoints) * 100)
        });
    } catch (error) {
        console.error("Error updating submission answer:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update score for a specific question (Admin only) - for manual grading of detailed questions
exports.updateQuestionScore = async (req, res) => {
    try {
        const { questionId, score } = req.body;
        
        if (!questionId || score === undefined) {
            return res.status(400).json({ message: 'Question ID and score are required' });
        }

        // Validate score is a valid number
        const parsedScore = parseFloat(score);
        if (isNaN(parsedScore) || parsedScore < 0) {
            return res.status(400).json({ message: 'Score must be a valid positive number' });
        }

        const submission = await Submission.findById(req.params.submissionId);
        
        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        // Get the exam to find the question and its max points
        const exam = await Exam.findById(submission.exam).populate('questions');
        
        // Find the question to get max points
        const question = exam.questions.find(q => q._id.toString() === questionId);
        
        if (!question) {
            return res.status(404).json({ message: "Question not found in exam" });
        }

        const maxPoints = question.points || 1;
        
        // Validate score doesn't exceed max points
        if (parsedScore > maxPoints) {
            return res.status(400).json({ message: `Score cannot exceed maximum points (${maxPoints})` });
        }

        // Check if we already have a manual score记录
        if (!submission.manualScores) {
            submission.manualScores = {};
        }

        // Update or set the manual score for this question
        submission.manualScores[questionId] = parsedScore;

        // Recalculate total score including manual scores
        let newScore = 0;
        let totalPoints = 0;

        exam.questions.forEach((q) => {
            const questionPoints = q.points || 1;
            totalPoints += questionPoints;

            const studentAnswer = submission.answers.find(
                a => a.questionId === q._id.toString()
            );
            
            // Check if there's a manual score for this question
            if (submission.manualScores && submission.manualScores[q._id.toString()] !== undefined) {
                newScore += submission.manualScores[q._id.toString()];
                return;
            }

            // Auto-grade MCQ questions
            if (!studentAnswer || !studentAnswer.selectedOption) {
                return;
            }

            if (q.questionType === 'mcq' || !q.questionType) {
                if (q.isMultipleCorrect && q.correctAnswers && q.correctAnswers.length > 0) {
                    const selectedOptions = Array.isArray(studentAnswer.selectedOption) 
                        ? studentAnswer.selectedOption 
                        : [studentAnswer.selectedOption];
                    
                    const allCorrectSelected = q.correctAnswers.every(correctAns => 
                        selectedOptions.some(selected => 
                            selected.toLowerCase().trim() === correctAns.toLowerCase().trim()
                        )
                    );

                    const noWrongSelected = selectedOptions.every(selected => 
                        q.correctAnswers.some(correctAns => 
                            correctAns.toLowerCase().trim() === selected.toLowerCase().trim()
                        )
                    );

                    if (allCorrectSelected && noWrongSelected) {
                        newScore += questionPoints;
                    }
                } else {
                    if (studentAnswer.selectedOption.toLowerCase().trim() === 
                        (q.correctAnswer || '').toLowerCase().trim()) {
                        newScore += questionPoints;
                    }
                }
            }
            // Detailed questions without manual score get 0
        });

        submission.score = newScore;
        submission.totalPoints = totalPoints;
        
        await submission.save();

        res.json({ 
            message: 'Score updated successfully',
            newScore,
            totalPoints,
            newPercentage: Math.round((newScore / totalPoints) * 100),
            maxPoints
        });
    } catch (error) {
        console.error("Error updating question score:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all users (teachers and students)
exports.getAllUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        let query = {};
        
        // If user is a teacher/section_admin, only show their section's users
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        let query = { 
            role: { $in: ['teacher', 'section_admin', 'super_admin'] }
        };
        
        // If user is a teacher/section_admin, only show teachers from their section
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const teachers = await User.find(query).select('-password').sort({ name: 1 });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get students by section
exports.getStudentsBySection = async (req, res) => {
    try {
        const { section } = req.params;
        const currentUser = await User.findById(req.user.id);
        
        let query = { role: 'student' };
        
        // If section is provided, filter by section
        if (section && section !== 'all') {
            query.section = section;
        }
        
        // If user is a teacher/section_admin, only show their section's students
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const students = await User.find(query).select('-password').sort({ name: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign teachers to a student
exports.assignTeachersToStudent = async (req, res) => {
    try {
        const { studentId, teacherIds } = req.body;
        
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        
        // Find the student
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }
        
        // If teacherIds is provided, validate and assign
        if (teacherIds && Array.isArray(teacherIds)) {
            // Validate all teacher IDs exist and are teachers
            const teachers = await User.find({ 
                _id: { $in: teacherIds },
                role: { $in: ['teacher', 'section_admin'] }
            });
            
            if (teachers.length !== teacherIds.length) {
                return res.status(400).json({ message: 'One or more teacher IDs are invalid' });
            }
            
            // Assign teachers to student
            student.assignedTeachers = teacherIds;
            await student.save();
            
            // Also update the student's section based on the first teacher's section
            if (teachers.length > 0 && teachers[0].section) {
                student.section = teachers[0].section;
                await student.save();
            }
            
            // Update each teacher's students list
            for (const teacherId of teacherIds) {
                const teacher = await User.findById(teacherId);
                if (teacher && !teacher.students.includes(studentId)) {
                    teacher.students.push(studentId);
                    await teacher.save();
                }
            }
        }
        
        // Return updated student
        const updatedStudent = await User.findById(studentId).select('-password');
        res.json({ 
            message: 'Teachers assigned successfully',
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update student section
exports.updateStudentSection = async (req, res) => {
    try {
        const { studentId, section } = req.body;
        
        if (!studentId || !section) {
            return res.status(400).json({ message: 'Student ID and section are required' });
        }
        
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }
        
        // Update student's section
        student.section = section;
        await student.save();
        
        const updatedStudent = await User.findById(studentId).select('-password');
        res.json({ 
            message: 'Section updated successfully',
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all unique sections
exports.getAllSections = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        let query = {};
        
        // If user is a teacher/section_admin, only show their section
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const sections = await User.distinct('section', query);
        
        // Filter out empty sections
        const validSections = sections.filter(s => s && s.trim() !== '');
        
        res.json(validSections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update teacher's teaching subjects (assign subjects and years)
exports.updateTeacherSubjects = async (req, res) => {
    try {
        const { teacherId, teachingSubjects } = req.body;
        
        if (!teacherId) {
            return res.status(400).json({ message: 'Teacher ID is required' });
        }
        
        if (!teachingSubjects || !Array.isArray(teachingSubjects) || teachingSubjects.length === 0) {
            return res.status(400).json({ message: 'At least one teaching subject is required' });
        }
        
        // Find the teacher
        const teacher = await User.findById(teacherId);
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        if (teacher.role !== 'teacher' && teacher.role !== 'section_admin') {
            return res.status(400).json({ message: 'User is not a teacher' });
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
        
        // Update teacher's teaching subjects
        teacher.teachingSubjects = teachingSubjects;
        await teacher.save();
        
        // Return updated teacher
        const updatedTeacher = await User.findById(teacherId).select('-password');
        res.json({ 
            message: 'Teaching subjects updated successfully',
            teacher: updatedTeacher
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get teachers by year - returns teachers teaching a specific year
exports.getTeachersByYear = async (req, res) => {
    try {
        const { year } = req.params;
        const parsedYear = parseInt(year);
        
        if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
            return res.status(400).json({ message: 'Year must be between 1 and 4' });
        }
        
        const currentUser = await User.findById(req.user.id);
        
        let query = { 
            role: { $in: ['teacher', 'section_admin'] },
            teachingSubjects: {
                $elemMatch: {
                    years: parsedYear
                }
            }
        };
        
        // If user is a teacher/section_admin, only show teachers from their section
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const teachers = await User.find(query).select('-password');
        
        // Filter to only include subjects for the requested year
        const teachersWithYearSubjects = teachers.map(teacher => {
            const yearSubjects = teacher.teachingSubjects.filter(ts => 
                ts.years.includes(parsedYear)
            );
            return {
                _id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                section: teacher.section,
                department: teacher.department,
                teachingSubjects: yearSubjects
            };
        });
        
        res.json(teachersWithYearSubjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all teachers with their teaching subjects
exports.getTeachersWithSubjects = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        let query = { 
            role: { $in:['teacher', 'section_admin'] }
        };
        
        // If user is a teacher/section_admin, only show teachers from their section
        if ((currentUser.role === 'teacher' || currentUser.role === 'section_admin') && currentUser.section) {
            query.section = currentUser.section;
        }
        
        const teachers = await User.find(query)
            .select('name email section department teachingSubjects')
            .sort({ name: 1 });
        
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update student's year
exports.updateStudentYear = async (req, res) => {
    try {
        const { studentId, year } = req.body;
        
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        
        if (year === undefined || year === null) {
            return res.status(400).json({ message: 'Year is required' });
        }
        
        const parsedYear = parseInt(year);
        if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
            return res.status(400).json({ message: 'Year must be between 1 and 4' });
        }
        
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }
        
        // Update student's year
        student.year = parsedYear;
        await student.save();
        
        const updatedStudent = await User.findById(studentId).select('-password');
        res.json({ 
            message: 'Year updated successfully',
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign subjects to a student (teacher assignments with subjects)
exports.assignSubjectsToStudent = async (req, res) => {
    try {
        const { studentId, subjects } = req.body;
        
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        
        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ message: 'At least one subject is required' });
        }
        
        // Find the student
        const student = await User.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }
        
        // Validate each subject
        for (const sub of subjects) {
            if (!sub.subject || !sub.subject.trim()) {
                return res.status(400).json({ message: 'Subject name is required for each entry' });
            }
            if (!sub.teacherId) {
                return res.status(400).json({ message: 'Teacher ID is required for each subject' });
            }
            // Validate teacher exists
            const teacher = await User.findById(sub.teacherId);
            if (!teacher) {
                return res.status(400).json({ message: `Teacher not found for subject ${sub.subject}` });
            }
            if (teacher.role !== 'teacher' && teacher.role !== 'section_admin') {
                return res.status(400).json({ message: `User ${sub.teacherId} is not a teacher` });
            }
        }
        
        // Build enrolled subjects array
        const enrolledSubjects = [];
        const teacherIds = [];
        
        for (const sub of subjects) {
            const teacher = await User.findById(sub.teacherId);
            enrolledSubjects.push({
                subject: sub.subject,
                teacherId: sub.teacherId,
                teacherName: teacher.name
            });
            if (!teacherIds.includes(sub.teacherId)) {
                teacherIds.push(sub.teacherId);
            }
        }
        
        // Update student's enrolled subjects
        student.enrolledSubjects = enrolledSubjects;
        student.assignedTeachers = teacherIds;
        
        // Set student's section from first subject's teacher if not set
        if (!student.section && subjects.length > 0) {
            const firstTeacher = await User.findById(subjects[0].teacherId);
            if (firstTeacher && firstTeacher.section) {
                student.section = firstTeacher.section;
            }
        }
        
        // Set student's year from teaching subjects if not set
        if (!student.year && subjects.length > 0) {
            const firstTeacher = await User.findById(subjects[0].teacherId);
            if (firstTeacher && firstTeacher.teachingSubjects) {
                const subjectEntry = firstTeacher.teachingSubjects.find(
                    ts => ts.subject === subjects[0].subject
                );
                if (subjectEntry && subjectEntry.years.length > 0) {
                    student.year = subjectEntry.years[0];
                }
            }
        }
        
        await student.save();
        
        // Update each teacher's students list
        for (const teacherId of teacherIds) {
            const teacher = await User.findById(teacherId);
            if (teacher && !teacher.students.includes(studentId)) {
                teacher.students.push(studentId);
                await teacher.save();
            }
        }
        
        // Return updated student
        const updatedStudent = await User.findById(studentId).select('-password');
        res.json({ 
            message: 'Subjects assigned successfully',
            student: updatedStudent
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
