const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Get all available exams (filtered by student's section and assigned teachers)
exports.getExams = async (req, res) => {
    try {
        let query = {};
        
        // Get the logged-in user
        const user = await User.findById(req.user.id);
        
        if (user) {
            // If user is a student, filter by section and assigned teachers
            if (user.role === 'student' && user.section) {
                // Get exams for the student's section
                query.section = user.section;
            }
            // Teachers and section_admins can only see their own section's exams
            else if ((user.role === 'teacher' || user.role === 'section_admin') && user.section) {
                query.section = user.section;
            }
            // Super admin can see all exams
        }
        
        const exams = await Exam.find(query).select('-questions');
        
        // Add status to each exam based on scheduling
        const examsWithStatus = exams.map(exam => {
            const examObj = exam.toObject();
            
            if (exam.isScheduled) {
                const now = new Date();
                const startDate = new Date(exam.startDate);
                const endDate = new Date(exam.endDate);

                if (now < startDate) {
                    examObj.examStatus = 'upcoming';
                    examObj.availableFrom = exam.startDate;
                    examObj.availableUntil = exam.endDate;
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
        res.status(500).json({ message: error.message });
    }
};

// Get single exam with questions
exports.getExamDetails = async (req, res) => {
    try {
        // Check if user is admin - admins cannot attempt exams
        if (req.user.isAdmin) {
            return res.status(403).json({ 
                message: "Admin users are not allowed to attempt exams. Please use the admin dashboard to view student results.",
                isAdmin: true
            });
        }

        const exam = await Exam.findById(req.params.id).populate('questions');

        // Check if exam is password protected - if so, don't return exam details
        // The frontend should first verify the password before calling this endpoint
        // However, we'll still check scheduling and return appropriate response
        
        // Check if exam is scheduled and within time window
        if (exam.isScheduled) {
            const now = new Date();
            const startDate = new Date(exam.startDate);
            const endDate = new Date(exam.endDate);

            if (now < startDate) {
                return res.status(403).json({ 
                    message: "Exam is not yet available. It will be available from " + startDate.toLocaleString(),
                    examStatus: 'upcoming',
                    startDate: exam.startDate,
                    endDate: exam.endDate
                });
            }

            if (now > endDate) {
                return res.status(403).json({ 
                    message: "Exam deadline has passed. The exam was available until " + endDate.toLocaleString(),
                    examStatus: 'expired'
                });
            }
        }

        // Fisher-Yates Shuffle Algorithm logic
        let questions = exam.questions;
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        res.json({ ...exam._doc, questions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify exam password before allowing access
exports.verifyExamPassword = async (req, res) => {
    try {
        const { examId, password } = req.body;

        if (!examId || !password) {
            return res.status(400).json({ message: 'Exam ID and password are required' });
        }

        const exam = await Exam.findById(examId);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if exam is password protected
        if (!exam.isPasswordProtected) {
            // No password required - allow access
            return res.json({ valid: true, requiresPassword: false });
        }

        // Verify the password
        if (exam.password === password) {
            return res.json({ valid: true, requiresPassword: true });
        } else {
            return res.status(401).json({ message: 'Incorrect password', valid: false });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const { examId, answers, tabSwitches, warningCount, status } = req.body;

        // 1. Check if the student has already submitted this exam
        const existingSubmission = await Submission.findOne({ 
            student: req.user.id, 
            exam: examId 
        });

        if (existingSubmission) {
            if (existingSubmission.status === 'Terminated') {
                return res.status(403).json({ message: "Your exam was terminated due to multiple violations." });
            }
            return res.status(400).json({ message: "You have already submitted this exam!" });
        }

        // 2. If exam was terminated, prevent normal submission
        if (status === 'Terminated') {
            const exam = await Exam.findById(examId);
            
            const submission = await Submission.create({
                student: req.user.id,
                exam: examId,
                answers: answers || [],
                score: 0,
                totalPoints: exam?.questions?.length || 0,
                tabSwitches: tabSwitches || 0,
                warningCount: warningCount || 0,
                status: 'Terminated'
            });

            return res.status(201).json({ 
                message: 'Exam terminated due to violations', 
                terminated: true,
                score: 0 
            });
        }

        // 3. Fetch the exam to compare answers
        const exam = await Exam.findById(examId).populate('questions');
        
        let score = 0;
        let totalPoints = 0;

        exam.questions.forEach((question) => {
            const questionPoints = question.points || 1;
            totalPoints += questionPoints;

            const studentAnswer = answers.find(a => a.questionId === question._id.toString());
            
            if (!studentAnswer || !studentAnswer.selectedOption) {
                // No answer provided, no points
                return;
            }

            // Handle MCQ Questions
            if (question.questionType === 'mcq' || !question.questionType) {
                if (question.isMultipleCorrect && question.correctAnswers && question.correctAnswers.length > 0) {
                    // Multiple correct answers - check if all correct answers are selected
                    const selectedOptions = Array.isArray(studentAnswer.selectedOption) 
                        ? studentAnswer.selectedOption 
                        : [studentAnswer.selectedOption];
                    
                    // Check if all correct answers are in the selected options
                    const allCorrectSelected = question.correctAnswers.every(correctAns => 
                        selectedOptions.some(selected => 
                            selected.toLowerCase().trim() === correctAns.toLowerCase().trim()
                        )
                    );

                    // Also check if no wrong answers are selected
                    const noWrongSelected = selectedOptions.every(selected => 
                        question.correctAnswers.some(correctAns => 
                            correctAns.toLowerCase().trim() === selected.toLowerCase().trim()
                        )
                    );

                    if (allCorrectSelected && noWrongSelected) {
                        score += questionPoints;
                    } else if (question.correctAnswers.length > 1) {
                        // Partial credit for multiple correct - give points for each correct answer selected
                        const correctCount = selectedOptions.filter(selected => 
                            question.correctAnswers.some(correctAns => 
                                correctAns.toLowerCase().trim() === selected.toLowerCase().trim()
                            )
                        ).length;
                        const wrongCount = selectedOptions.length - correctCount;
                        // Score = (correct - wrong) / total correct * points
                        const partialScore = Math.max(0, (correctCount - wrongCount) / question.correctAnswers.length);
                        score += partialScore * questionPoints;
                    }
                } else {
                    // Single correct answer (backward compatibility)
                    if (studentAnswer.selectedOption.toLowerCase().trim() === 
                        (question.correctAnswer || '').toLowerCase().trim()) {
                        score += questionPoints;
                    }
                }
            }
            
            // Detailed questions are not auto-graded - score remains 0
            // These would need manual review by instructors
        });

        // 4. Save the submission
        const submission = await Submission.create({
            student: req.user.id,
            exam: examId,
            answers,
            score,
            totalPoints,
            tabSwitches: tabSwitches || 0,
            warningCount: warningCount || 0,
            status: 'Completed'
        });

        // 5. Send Email Notification (The new addition)
        try {
            await sendEmail({
                email: req.user.email,
                subject: `Exam Results: ${exam.title}`,
                message: `Hello ${req.user.name},\n\nYou have successfully completed the exam "${exam.title}".\n\nYour Score: ${score}/${totalPoints}\nTab Switches Detected: ${tabSwitches || 0}\nWarnings Received: ${warningCount || 0}\n\nRegards,\nEvalio Team`
            });
        } catch (mailError) {
            console.error("Email failed to send, but submission was saved:", mailError.message);
            // We don't return an error to the user here because the exam was successfully saved
        }

        res.status(201).json({ message: 'Exam submitted successfully', score });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all past results for the logged-in student
exports.getMyResults = async (req, res) => {
    try {
        const results = await Submission.find({ student: req.user.id })
            .populate('exam', 'title') // Only get the exam title
            .sort({ createdAt: -1 }); // Newest first
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get detailed result with question analysis
exports.getMyResultDetails = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('exam', 'title description duration')
            .populate('student', 'name email');

        if (!submission) {
            return res.status(404).json({ message: "Result not found" });
        }

        // Check if the submission belongs to the user
        if (submission.student._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Get the exam questions to analyze
        const exam = await Exam.findById(submission.exam._id).populate('questions');
        
        // Analyze each question
        const questionAnalysis = exam.questions.map((question, index) => {
            const studentAnswer = submission.answers.find(
                a => a.questionId === question._id.toString()
            );
            
            let isCorrect = false;
            let correctAnswer = '';
            
            if (question.questionType === 'mcq' || !question.questionType) {
                if (question.isMultipleCorrect && question.correctAnswers?.length > 0) {
                    // Multiple correct answers
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
                    // Single correct answer
                    const selected = studentAnswer?.selectedOption;
                    const correct = question.correctAnswer;
                    isCorrect = selected?.toLowerCase?.().trim() === correct?.toLowerCase?.().trim();
                    correctAnswer = question.correctAnswer || '';
                }
            }
            
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
                points: question.points || 1
            };
        });

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
            percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
            tabSwitches: submission.tabSwitches || 0,
            warningCount: submission.warningCount || 0,
            status: submission.status,
            submittedAt: submission.createdAt,
            timeTaken: exam.duration // This would ideally be calculated from start/end time
        };

        res.json({
            submission,
            exam: exam,
            questionAnalysis,
            statistics
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkActiveAttempt = async (req, res) => {
    try {
        const attempt = await Submission.findOne({ 
            student: req.user.id, 
            exam: req.params.examId,
            status: 'In-Progress' // You'd update status to 'Completed' only on final submit
        });
        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all questions for student question bank (filtered by enrolled subjects)
exports.getAllQuestions = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let query = {};
        
        // If student has enrolled subjects, filter questions by those subjects
        if (user.enrolledSubjects && user.enrolledSubjects.length > 0) {
            const enrolledCategories = user.enrolledSubjects.map(sub => sub.subject);
            query = { category: { $in: enrolledCategories } };
        }
        
        const questions = await Question.find(query).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get subject-specific data for student (exams, questions, materials, performance)
exports.getSubjectDetails = async (req, res) => {
    try {
        const { subject } = req.params;
        const decodedSubject = decodeURIComponent(subject);
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get all exams for this subject
        const exams = await Exam.find({ subject: decodedSubject }).select('-questions');
        
        // Add status to each exam
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

        // Get student's submissions for these exams
        const examIds = exams.map(e => e._id);
        const submissions = await Submission.find({ 
            student: req.user.id,
            exam: { $in: examIds }
        }).populate('exam', 'title');

        // Map submissions to exams
        const examSubmissions = {};
        submissions.forEach(sub => {
            const examId = sub.exam._id.toString();
            examSubmissions[examId] = {
                score: sub.score,
                totalPoints: sub.totalPoints,
                status: sub.status,
                submittedAt: sub.createdAt
            };
        });

        // Get questions for this subject
        const questions = await Question.find({ category: decodedSubject }).sort({ createdAt: -1 });

        // Calculate overall performance for this subject
        const subjectSubmissions = submissions.filter(s => 
            examIds.map(id => id.toString()).includes(s.exam._id.toString())
        );
        
        let totalScore = 0;
        let totalPoints = 0;
        let completedCount = 0;
        
        subjectSubmissions.forEach(sub => {
            if (sub.status === 'Completed') {
                totalScore += sub.score || 0;
                totalPoints += sub.totalPoints || 1;
                completedCount++;
            }
        });

        const averageScore = completedCount > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
        const bestScore = completedCount > 0 ? Math.max(...subjectSubmissions.map(s => 
            s.totalPoints > 0 ? Math.round((s.score / s.totalPoints) * 100) : 0
        )) : 0;

        res.json({
            subject: decodedSubject,
            exams: examsWithStatus,
            examSubmissions,
            questions,
            stats: {
                totalExams: exams.length,
                completedExams: completedCount,
                availableExams: examsWithStatus.filter(e => e.examStatus === 'available' && !examSubmissions[e._id]).length,
                averageScore,
                bestScore,
                totalQuestions: questions.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get available teachers/subjects for a student's year and section
exports.getAvailableSubjects = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: "Only students can access this" });
        }

        const studentYear = user.year;
        const studentSection = user.section;

        // Get all teachers with their teaching subjects
        const teachers = await User.find({
            role: { $in: ['teacher', 'section_admin'] }
        }).select('name email teachingSubjects section');

        // Build available subjects grouped by subject name
        const subjectsMap = {};

        teachers.forEach(teacher => {
            if (!teacher.teachingSubjects || teacher.teachingSubjects.length === 0) {
                return;
            }
            
            teacher.teachingSubjects.forEach(ts => {
                // If student has a year set, filter by year
                // If student has a section set, filter by section (case insensitive)
                // Otherwise show everything
                let showThisSubject = true;
                
                if (studentYear) {
                    showThisSubject = ts.years && ts.years.includes(studentYear);
                }
                
                if (showThisSubject && studentSection) {
                    showThisSubject = ts.section && ts.section.trim().toLowerCase() === studentSection.trim().toLowerCase();
                }
                
                if (showThisSubject) {
                    if (!subjectsMap[ts.subject]) {
                        subjectsMap[ts.subject] = {
                            subject: ts.subject,
                            teachers: []
                        };
                    }
                    
                    // Check if teacher already added for this subject
                    const alreadyAdded = subjectsMap[ts.subject].teachers.some(
                        t => t.teacherId.toString() === teacher._id.toString()
                    );
                    
                    if (!alreadyAdded) {
                        subjectsMap[ts.subject].teachers.push({
                            teacherId: teacher._id,
                            teacherName: teacher.name,
                            teacherEmail: teacher.email,
                            section: ts.section,
                            years: ts.years
                        });
                    }
                }
            });
        });

        // Convert to array
        const availableSubjects = Object.values(subjectsMap);

        // Get student's currently selected subjects
        const selectedSubjects = user.enrolledSubjects || [];

        res.json({
            studentYear,
            studentSection: studentSection || 'Not Set',
            availableSubjects,
            selectedSubjects
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Save student's subject selections
exports.saveSubjectSelections = async (req, res) => {
    try {
        const { subjects } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'student') {
            return res.status(403).json({ message: "Only students can select subjects" });
        }

        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({ message: "Subjects array is required" });
        }

        // Validate each subject
        const enrolledSubjects = [];
        const teacherIds = [];

        for (const sub of subjects) {
            if (!sub.subject || !sub.subject.trim()) {
                return res.status(400).json({ message: "Subject name is required" });
            }
            if (!sub.teacherId) {
                return res.status(400).json({ message: "Teacher ID is required for each subject" });
            }

            // Validate teacher exists
            const teacher = await User.findById(sub.teacherId);
            if (!teacher) {
                return res.status(400).json({ message: `Teacher not found for subject ${sub.subject}` });
            }

            enrolledSubjects.push({
                subject: sub.subject,
                teacherId: sub.teacherId,
                teacherName: teacher.name
            });

            if (!teacherIds.includes(sub.teacherId)) {
                teacherIds.push(sub.teacherId);
            }
        }

        // Update user's enrolled subjects
        user.enrolledSubjects = enrolledSubjects;
        user.assignedTeachers = teacherIds;
        await user.save();

        // Also update each teacher's students list
        for (const teacherId of teacherIds) {
            const teacher = await User.findById(teacherId);
            if (teacher && !teacher.students.includes(user._id)) {
                teacher.students.push(user._id);
                await teacher.save();
            }
        }

        const updatedUser = await User.findById(user._id).select('-password');
        
        res.json({
            message: "Subjects selected successfully",
            enrolledSubjects: updatedUser.enrolledSubjects
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

