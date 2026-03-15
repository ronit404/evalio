import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    Clock, 
    ListChecks, 
    Plus, 
    Check, 
    FileText, 
    Trash2, 
    X, 
    Save, 
    Upload, 
    Image as ImageIcon,
    AlignLeft, 
    List, 
    Lock,
    BookOpen,
    Calendar
} from 'lucide-react';

const TeacherCreateExam = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get pre-selected subject, year, and section from navigation state
    const preSelectedSubject = location.state?.subject || '';
    const preSelectedYear = location.state?.year || '';
    const preSelectedSection = location.state?.section || '';
    
    // Exam details
    const [examData, setExamData] = useState({
        title: '',
        description: '',
        subject: preSelectedSubject,
        year: preSelectedYear,
        duration: 30,
        totalMarks: 1,
        isScheduled: false,
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        isPasswordProtected: false,
        password: ''
    });
    
    // Teacher's subjects
    const [teachingSubjects, setTeachingSubjects] = useState([]);
    
    // Questions
    const [examQuestions, setExamQuestions] = useState([
        {
            id: Date.now(),
            questionText: '',
            questionType: 'mcq',
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswers: [],
            category: '',
            isMultipleCorrect: false,
            image: null,
            imagePreview: null,
            expectedAnswer: ''
        }
    ]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        fetchTeachingSubjects();
    }, [user, navigate]);

    const fetchTeachingSubjects = async () => {
        try {
            const response = await API.get('/teacher/subjects');
            setTeachingSubjects(response.data || []);
            
            // Set default section from first subject if available
            if (response.data && response.data.length > 0 && !preSelectedSubject) {
                setExamData(prev => ({ ...prev, subject: response.data[0].subject }));
            }
        } catch (err) {
            console.error("Error fetching subjects:", err);
            toast.error("Failed to load your subjects");
        } finally {
            setLoading(false);
        }
    };

    // Get unique subjects
    const getUniqueSubjects = () => {
        const subjects = new Set();
        teachingSubjects.forEach(ts => subjects.add(ts.subject));
        return Array.from(subjects);
    };

    // Get years for selected subject
    const getYearsForSubject = () => {
        if (!examData.subject) return [];
        const subject = teachingSubjects.find(ts => ts.subject === examData.subject);
        return subject ? subject.years : [];
    };

    // Add new question
    const addQuestionToExam = () => {
        setExamQuestions([
            ...examQuestions,
            {
                id: Date.now(),
                questionText: '',
                questionType: 'mcq',
                options: ['', '', '', ''],
                correctAnswer: '',
                correctAnswers: [],
                category: '',
                isMultipleCorrect: false,
                image: null,
                imagePreview: null,
                expectedAnswer: ''
            }
        ]);
    };

    // Remove question
    const removeQuestionFromExam = (id) => {
        if (examQuestions.length > 1) {
            setExamQuestions(examQuestions.filter(q => q.id !== id));
        } else {
            toast.error("At least one question is required");
        }
    };

    // Update question field
    const updateQuestion = (id, field, value) => {
        setExamQuestions(examQuestions.map(q => 
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    // Handle image upload
    const handleImageChange = (questionId, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setExamQuestions(examQuestions.map(q => 
                    q.id === questionId ? { ...q, image: file, imagePreview: reader.result } : q
                ));
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image
    const removeImage = (questionId) => {
        setExamQuestions(examQuestions.map(q => 
            q.id === questionId ? { ...q, image: null, imagePreview: null } : q
        ));
    };

    // Update option
    const updateOption = (questionId, optionIndex, value) => {
        setExamQuestions(examQuestions.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    // Add option
    const addOption = (questionId) => {
        setExamQuestions(examQuestions.map(q => {
            if (q.id === questionId && q.options.length < 6) {
                return { ...q, options: [...q.options, ''] };
            }
            return q;
        }));
    };

    // Remove option
    const removeOption = (questionId, optionIndex) => {
        setExamQuestions(examQuestions.map(q => {
            if (q.id === questionId && q.options.length > 2) {
                const newOptions = q.options.filter((_, i) => i !== optionIndex);
                let newCorrectAnswer = q.correctAnswer;
                if (q.options[optionIndex] === q.correctAnswer) {
                    newCorrectAnswer = '';
                }
                return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
            }
            return q;
        }));
    };

    // Toggle correct answer for multiple correct
    const toggleCorrectAnswer = (questionId, optionIndex) => {
        setExamQuestions(examQuestions.map(q => {
            if (q.id === questionId && q.isMultipleCorrect) {
                const optionValue = q.options[optionIndex];
                const currentAnswers = q.correctAnswers || [];
                
                if (currentAnswers.includes(optionValue)) {
                    return {
                        ...q,
                        correctAnswers: currentAnswers.filter(a => a !== optionValue)
                    };
                } else {
                    return {
                        ...q,
                        correctAnswers: [...currentAnswers, optionValue]
                    };
                }
            }
            return q;
        }));
    };

    // Check if option is correct
    const isOptionCorrect = (question, optionIndex) => {
        const optionValue = question.options[optionIndex];
        return question.correctAnswers?.includes(optionValue);
    };

    // Validate questions
    const validateQuestions = () => {
        const errors = [];
        examQuestions.forEach((q, index) => {
            if (!q.questionText.trim()) {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            if (q.questionType === 'mcq') {
                const validOptions = q.options.filter(opt => opt.trim() !== '');
                if (validOptions.length < 2) {
                    errors.push(`Question ${index + 1}: At least 2 options required`);
                }
                if (q.isMultipleCorrect) {
                    if (!q.correctAnswers || q.correctAnswers.length === 0) {
                        errors.push(`Question ${index + 1}: Select at least one correct answer`);
                    }
                } else {
                    if (!q.correctAnswer) {
                        errors.push(`Question ${index + 1}: Select correct answer`);
                    }
                }
            }
        });
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!examData.title.trim()) {
            toast.error("Please enter an exam title");
            return;
        }

        if (!examData.subject) {
            toast.error("Please select a subject");
            return;
        }

        if (!examData.year) {
            toast.error("Please select a year");
            return;
        }

        const validationErrors = validateQuestions();
        if (validationErrors.length > 0) {
            validationErrors.forEach(err => toast.error(err));
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Create all questions first
            const createdQuestionIds = [];
            
            for (const q of examQuestions) {
                const validOptions = q.options.filter(opt => opt.trim() !== '');
                
                const formData = new FormData();
                formData.append('questionText', q.questionText);
                formData.append('category', q.category || 'Exam');
                formData.append('questionType', q.questionType);
                formData.append('isMultipleCorrect', q.isMultipleCorrect || false);
                
                if (q.image) {
                    formData.append('image', q.image);
                }
                
                if (q.questionType === 'mcq') {
                    formData.append('options', JSON.stringify(validOptions));
                    
                    if (q.isMultipleCorrect && q.correctAnswers) {
                        formData.append('correctAnswers', JSON.stringify(q.correctAnswers));
                    } else {
                        formData.append('correctAnswer', q.correctAnswer || '');
                    }
                } else if (q.questionType === 'detailed') {
                    formData.append('expectedAnswer', q.expectedAnswer || '');
                }
                
                const response = await API.post('/teacher/add-question', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                createdQuestionIds.push(response.data._id);
            }

            // Step 2: Create exam with the questions
            const totalMarks = examQuestions.length * (examData.totalMarks || 1);
            
            // Get teacher's section based on the selected subject and year
            const teachingSubject = teachingSubjects.find(
                ts => ts.subject === examData.subject && ts.years.includes(parseInt(examData.year))
            );
            const teacherSection = preSelectedSection || teachingSubject?.section || user?.section || '';
            
            const examPayload = {
                title: examData.title,
                description: examData.description,
                section: teacherSection,
                subject: examData.subject,
                year: parseInt(examData.year),
                duration: examData.duration,
                questions: createdQuestionIds,
                totalMarks
            };
            
            // Add scheduling data if enabled
            if (examData.isScheduled && examData.startDate && examData.startTime && examData.endDate && examData.endTime) {
                const startDateTime = new Date(`${examData.startDate}T${examData.startTime}`);
                const endDateTime = new Date(`${examData.endDate}T${examData.endTime}`);
                
                examPayload.startDate = startDateTime.toISOString();
                examPayload.endDate = endDateTime.toISOString();
                examPayload.isScheduled = true;
            }
            
            // Add password protection if enabled
            if (examData.isPasswordProtected && examData.password) {
                examPayload.password = examData.password;
                examPayload.isPasswordProtected = true;
            }
            
            await API.post('/teacher/create-exam', examPayload);

            toast.success("Exam created successfully! 🎉");
            setTimeout(() => {
                navigate('/teacher');
            }, 2000);
        } catch (err) {
            console.error("Error creating exam:", err);
            toast.error(err.response?.data?.message || "Error creating exam");
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="create-exam-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Toaster position="top-right" />
            
            {/* Header */}
            <motion.div 
                className="page-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="header-content">
                    <div className="header-icon">
                        <ListChecks size={28} />
                    </div>
                    <div>
                        <h1>Create New Exam {preSelectedSubject ? `- ${preSelectedSubject}` : ''}</h1>
                        <p>{preSelectedSection ? `Section: ${preSelectedSection} • ` : ''}Add exam for your subject and year</p>
                    </div>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="exam-form">
                <div className="exam-layout">
                    {/* Left Column */}
                    <div className="exam-details-column">
                        <div className="section-card">
                            <h2>
                                <FileText size={20} />
                                Exam Details
                            </h2>
                            
                            <div className="form-group">
                                <label className="form-label">Exam Title *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    placeholder="e.g., Mathematics Final Exam"
                                    value={examData.title}
                                    onChange={(e) => setExamData({...examData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <Clock size={16} />
                                        Duration (min)
                                    </label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        min="5"
                                        max="180"
                                        value={examData.duration}
                                        onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 30})}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Points per Question</label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        min="1"
                                        max="100"
                                        value={examData.totalMarks || 1}
                                        onChange={(e) => setExamData({...examData, totalMarks: parseInt(e.target.value) || 1})}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <BookOpen size={16} />
                                        Subject *
                                    </label>
                                    <select 
                                        className="form-input"
                                        value={examData.subject}
                                        onChange={(e) => setExamData({...examData, subject: e.target.value, year: ''})}
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {getUniqueSubjects().map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Calendar size={16} />
                                        Year *
                                    </label>
                                    <select 
                                        className="form-input"
                                        value={examData.year}
                                        onChange={(e) => setExamData({...examData, year: e.target.value})}
                                        required
                                        disabled={!examData.subject}
                                    >
                                        <option value="">Select Year</option>
                                        {getYearsForSubject().map(year => (
                                            <option key={year} value={year}>Year {year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Enter exam description..."
                                    value={examData.description}
                                    onChange={(e) => setExamData({...examData, description: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            {/* Schedule Exam */}
                            <div className="schedule-section">
                                <div className="schedule-toggle">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={examData.isScheduled}
                                            onChange={(e) => setExamData({...examData, isScheduled: e.target.checked})}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="schedule-label">
                                        <Clock size={16} />
                                        Schedule Exam
                                    </span>
                                </div>

                                {examData.isScheduled && (
                                    <motion.div 
                                        className="schedule-fields"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <div className="schedule-row">
                                            <div className="form-group">
                                                <label className="form-label">Start Date</label>
                                                <input 
                                                    type="date" 
                                                    className="form-input"
                                                    value={examData.startDate}
                                                    onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                                                    required={examData.isScheduled}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Start Time</label>
                                                <input 
                                                    type="time" 
                                                    className="form-input"
                                                    value={examData.startTime}
                                                    onChange={(e) => setExamData({...examData, startTime: e.target.value})}
                                                    required={examData.isScheduled}
                                                />
                                            </div>
                                        </div>
                                        <div className="schedule-row">
                                            <div className="form-group">
                                                <label className="form-label">End Date</label>
                                                <input 
                                                    type="date" 
                                                    className="form-input"
                                                    value={examData.endDate}
                                                    onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                                                    required={examData.isScheduled}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">End Time</label>
                                                <input 
                                                    type="time" 
                                                    className="form-input"
                                                    value={examData.endTime}
                                                    onChange={(e) => setExamData({...examData, endTime: e.target.value})}
                                                    required={examData.isScheduled}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Password Protection */}
                            <div className="schedule-section">
                                <div className="schedule-toggle">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={examData.isPasswordProtected}
                                            onChange={(e) => setExamData({...examData, isPasswordProtected: e.target.checked, password: e.target.checked ? examData.password : ''})}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span className="schedule-label">
                                        <Lock size={16} />
                                        Password Protected
                                    </span>
                                </div>

                                {examData.isPasswordProtected && (
                                    <motion.div 
                                        className="schedule-fields"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <div className="form-group">
                                            <label className="form-label">Exam Password</label>
                                            <input 
                                                type="text" 
                                                className="form-input"
                                                placeholder="Enter exam password"
                                                value={examData.password}
                                                onChange={(e) => setExamData({...examData, password: e.target.value})}
                                                required={examData.isPasswordProtected}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="exam-summary-bar">
                                <span><strong>{examQuestions.length}</strong> questions</span>
                                <span><strong>{examQuestions.length * (examData.totalMarks || 1)}</strong> total marks</span>
                                <span><strong>{examData.duration}</strong> minutes</span>
                            </div>
                        </div>

                        <motion.button 
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Creating Exam...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Create Exam with All Questions
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Right Column - Questions */}
                    <div className="questions-column">
                        <div className="section-header">
                            <h2>Questions & Answers</h2>
                        </div>

                        <div className="questions-stack">
                            <AnimatePresence>
                                {examQuestions.map((q, index) => (
                                    <motion.div
                                        key={q.id}
                                        className="question-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="question-card-header">
                                            <span className="question-badge">Question {index + 1}</span>
                                            <button 
                                                type="button"
                                                className="remove-btn"
                                                onClick={() => removeQuestionFromExam(q.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="question-type-selector">
                                            <button
                                                type="button"
                                                className={`type-btn ${q.questionType === 'mcq' ? 'active' : ''}`}
                                                onClick={() => updateQuestion(q.id, 'questionType', 'mcq')}
                                            >
                                                <List size={16} />
                                                Multiple Choice
                                            </button>
                                            <button
                                                type="button"
                                                className={`type-btn ${q.questionType === 'detailed' ? 'active' : ''}`}
                                                onClick={() => updateQuestion(q.id, 'questionType', 'detailed')}
                                            >
                                                <AlignLeft size={16} />
                                                Descriptive
                                            </button>
                                        </div>

                                        <div className="form-group">
                                            <textarea
                                                className="form-textarea question-text-input"
                                                placeholder="Enter your question here..."
                                                value={q.questionText}
                                                onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                                                rows={2}
                                            />
                                        </div>

                                        {/* Image Upload */}
                                        <div className="image-upload-section">
                                            {q.imagePreview ? (
                                                <div className="image-preview">
                                                    <img src={q.imagePreview} alt="Question" />
                                                    <button 
                                                        type="button"
                                                        className="remove-image-btn"
                                                        onClick={() => removeImage(q.id)}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="image-upload-label">
                                                    <Upload size={18} />
                                                    <span>Add Image</span>
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(q.id, e)}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* MCQ Options */}
                                        {q.questionType === 'mcq' && (
                                            <>
{/* Multiple Correct Toggle */}
                                                <div className="multiple-correct-toggle">
                                                    <label className="toggle-switch">
<input
                                                            type="checkbox"
                                                            checked={q.isMultipleCorrect || false}
                                                            onChange={(e) => {
                                                                setExamQuestions(prevQuestions => 
                                                                    prevQuestions.map(question => {
                                                                        if (question.id === q.id) {
                                                                            if (e.target.checked) {
                                                                                return {
                                                                                    ...question,
                                                                                    isMultipleCorrect: true,
                                                                                    correctAnswers: [],
                                                                                    correctAnswer: ''
                                                                                };
                                                                            } else {
                                                                                return {
                                                                                    ...question,
                                                                                    isMultipleCorrect: false,
                                                                                    correctAnswers: [],
                                                                                    correctAnswer: ''
                                                                                };
                                                                            }
                                                                        }
                                                                        return question;
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                    <span>Multiple Correct Answers</span>
                                                </div>

                                                <div className="options-container">
                                                    {q.options.map((option, optIndex) => (
                                                        <div key={optIndex} className="option-row">
                                                            <label className={`option-radio ${q.isMultipleCorrect ? (isOptionCorrect(q, optIndex) ? 'selected' : '') : (q.correctAnswer === option ? 'selected' : '')}`}>
                                                                <input
                                                                    type={q.isMultipleCorrect ? "checkbox" : "radio"}
                                                                    name={`correct-${q.id}`}
                                                                    checked={q.isMultipleCorrect ? isOptionCorrect(q, optIndex) : q.correctAnswer === option}
                                                                    onChange={() => q.isMultipleCorrect ? toggleCorrectAnswer(q.id, optIndex) : updateQuestion(q.id, 'correctAnswer', option)}
                                                                    disabled={!option.trim()}
                                                                />
                                                                <span className={`radio-mark ${q.isMultipleCorrect ? 'checkbox' : 'radio'}`}>
                                                                    {q.isMultipleCorrect && isOptionCorrect(q, optIndex) && <Check size={12} />}
                                                                </span>
                                                            </label>
                                                            <input 
                                                                type="text"
                                                                className="form-input option-input"
                                                                placeholder={`Option ${optIndex + 1}`}
                                                                value={option}
                                                                onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                                                            />
                                                            {q.options.length > 2 && (
                                                                <button 
                                                                    type="button"
                                                                    className="remove-option-btn"
                                                                    onClick={() => removeOption(q.id, optIndex)}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    
                                                    {q.options.length < 6 && (
                                                        <button 
                                                            type="button"
                                                            className="add-option-btn"
                                                            onClick={() => addOption(q.id)}
                                                        >
                                                            <Plus size={14} />
                                                            Add Option
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="correct-answer-hint">
                                                    <Check size={14} />
                                                    <span>
                                                        {q.isMultipleCorrect 
                                                            ? 'Check all correct answers' 
                                                            : 'Click to mark correct answer'}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        {/* Descriptive Answer */}
                                        {q.questionType === 'detailed' && (
                                            <div className="detailed-answer-section">
                                                <label className="form-label">Expected Answer (Optional)</label>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Enter expected answer or key points..."
                                                    value={q.expectedAnswer || ''}
                                                    onChange={(e) => updateQuestion(q.id, 'expectedAnswer', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                        )}

                                        <div className="question-footer">
                                            <input 
                                                type="text"
                                                className="form-input category-input"
                                                placeholder="Category (optional)"
                                                value={q.category}
                                                onChange={(e) => updateQuestion(q.id, 'category', e.target.value)}
                                            />
                                            
                                            <button 
                                                type="button"
                                                className="btn btn-primary add-question-btn"
                                                onClick={addQuestionToExam}
                                            >
                                                <Plus size={16} />
                                                Add Next Question
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </form>

            <style>{`
                .create-exam-page {
                    min-height: 100vh;
                    background: #f1f5f9;
                    padding-bottom: 2rem;
                }

                .loading-container {
                    min-height: 60vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }

                .page-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 2rem;
                    margin: -2rem -1.5rem 2rem;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .header-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    color: white;
                    margin-bottom: 0.25rem;
                }

                .page-header p {
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                }

                .exam-form {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .exam-layout {
                    display: grid;
                    grid-template-columns: 400px 1fr;
                    gap: 2rem;
                    align-items: start;
                }

                .exam-details-column {
                    position: sticky;
                    top: 2rem;
                }

                .section-card {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    margin-bottom: 1.5rem;
                }

                .section-card h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.25rem;
                    color: #111827;
                    margin-bottom: 1.5rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                }

                .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .exam-summary-bar {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 12px;
                    margin-top: 0.5rem;
                }

                .exam-summary-bar span {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .exam-summary-bar strong {
                    color: #111827;
                }

                .questions-column {
                    min-width: 0;
                }

                .section-header h2 {
                    font-size: 1.5rem;
                    color: #111827;
                    margin-bottom: 1.5rem;
                }

                .questions-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .question-card {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    border: 2px solid #e5e7eb;
                }

                .question-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .question-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .remove-btn {
                    background: #fee2e2;
                    border: none;
                    border-radius: 10px;
                    padding: 0.5rem;
                    color: #dc2626;
                    cursor: pointer;
                }

                .question-type-selector {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .type-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: #f1f5f9;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                }

                .type-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: transparent;
                    color: white;
                }

                .question-text-input {
                    min-height: 60px;
                    font-weight: 500;
                }

                .image-upload-section {
                    margin-bottom: 1rem;
                }

                .image-preview {
                    position: relative;
                    display: inline-block;
                }

                .image-preview img {
                    max-width: 200px;
                    max-height: 150px;
                    border-radius: 8px;
                }

                .remove-image-btn {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    background: #dc2626;
                    border: none;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                }

                .image-upload-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: #f1f5f9;
                    border: 2px dashed #e5e7eb;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

.multiple-correct-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.625rem 1rem;
                    background: #fef3c7;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #92400e;
                }

                .multiple-correct-toggle .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .multiple-correct-toggle .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                    position: absolute;
                    z-index: 1;
                    cursor: pointer;
                }

                .multiple-correct-toggle .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: 0.3s;
                    border-radius: 24px;
                    pointer-events: none;
                }

                .multiple-correct-toggle .toggle-slider::before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                }

                .multiple-correct-toggle .toggle-switch input:checked + .toggle-slider {
                    background: #667eea;
                }

                .multiple-correct-toggle .toggle-switch input:checked + .toggle-slider::before {
                    transform: translateX(20px);
                }

                .options-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .option-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .option-radio {
                    position: relative;
                    cursor: pointer;
                }

                .option-radio input {
                    position: absolute;
                    opacity: 0;
                }

                .radio-mark {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #d1d5db;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    background: white;
                }

                .radio-mark.checkbox {
                    border-radius: 4px;
                }

                .option-radio.selected .radio-mark {
                    border-color: #22c55e;
                    background: #22c55e;
                    color: white;
                }

                .option-input {
                    flex: 1;
                }

                .remove-option-btn {
                    background: transparent;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                }

                .add-option-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: 1px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 0.875rem;
                    width: fit-content;
                }

                .correct-answer-hint {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    color: #6b7280;
                    padding: 0.5rem;
                    background: #f0fdf4;
                    border-radius: 6px;
                    width: fit-content;
                }

                .detailed-answer-section {
                    margin-bottom: 1rem;
                }

                .question-footer {
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .category-input {
                    font-size: 0.875rem;
                    max-width: 300px;
                }

                .add-question-btn {
                    width: 100%;
                    justify-content: center;
                    padding: 0.875rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 2rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    width: 100%;
                    justify-content: center;
                }

                .btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1.125rem;
                }

                .schedule-section {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 2px solid #e2e8f0;
                }

                .schedule-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .schedule-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    color: #475569;
                }

                .schedule-fields {
                    margin-top: 1rem;
                    overflow: hidden;
                }

                .schedule-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .exam-layout {
                        grid-template-columns: 1fr;
                    }

                    .exam-details-column {
                        position: static;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default TeacherCreateExam;

