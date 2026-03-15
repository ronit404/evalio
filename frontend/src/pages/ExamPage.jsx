import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    AlertTriangle, 
    Send, 
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    FileQuestion,
    Timer,
    Flag,
    Monitor,
    XCircle,
    Circle,
    Eye,
    AlertCircle
} from 'lucide-react';

const FULLSCREEN_TIMEOUT = 5;

const ExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Check if admin - redirect to admin dashboard
    useEffect(() => {
        if (user && user.isAdmin) {
            toast.error("Admins cannot attempt exams. Use the admin dashboard to view student results.");
            navigate('/admin');
        }
    }, [user, navigate]);

    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [multipleAnswers, setMultipleAnswers] = useState({}); // For multiple correct questions
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [warningCount, setWarningCount] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdown, setCountdown] = useState(FULLSCREEN_TIMEOUT);
    const [countdownInterval, setCountdownInterval] = useState(null);

    useEffect(() => {
        const fetchExam = async () => {
            setLoading(true);
            try {
                const { data } = await API.get(`/student/exams/${id}`);
                setExam(data);
                setTimeLeft(data.duration * 60);
                
                const initialAnswers = {};
                const initialFlags = {};
                const initialMultipleAnswers = {}; // For multiple correct questions
                data.questions.forEach(q => {
                    initialAnswers[q._id] = null;
                    initialFlags[q._id] = false;
                    initialMultipleAnswers[q._id] = []; // Array to store multiple selected options
                });
                setAnswers(initialAnswers);
                setFlaggedQuestions(initialFlags);
                setMultipleAnswers(initialMultipleAnswers);
            } catch (err) {
                console.error("Error loading exam:", err);
                if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                    toast.error("Cannot connect to server. Please ensure the backend is running.");
                } else if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate('/login');
                } else if (err.response?.status === 404) {
                    toast.error("Exam not found.");
                    navigate('/');
                } else if (err.response?.data?.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error("Failed to load exam");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [id, navigate]);

    useEffect(() => {
        if (timeLeft <= 0 && exam && !isSubmitted) {
            handleSubmit();
            return;
        }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, exam, isSubmitted]);

    const exitFullscreen = useCallback(() => {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log("Exit fullscreen failed:", err));
        }
    }, []);

    const enterFullscreen = useCallback(() => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Fullscreen request failed:", err);
            });
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                setShowCountdown(false);
                setShowWarning(false);
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    setCountdownInterval(null);
                }
            } else if (!isSubmitted) {
                handleViolation('fullscreen');
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isSubmitted, countdownInterval]);

    const startCountdown = useCallback(() => {
        setShowCountdown(true);
        setCountdown(FULLSCREEN_TIMEOUT);

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    enterFullscreen();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setCountdownInterval(interval);
    }, [countdownInterval, enterFullscreen]);

    const handleViolation = useCallback((type) => {
        if (isSubmitted) return;

        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);

        // Check for termination after 3 violations
        if (newWarningCount >= 3) {
            handleTermination();
            return;
        }

        let message = '';
        switch (type) {
            case 'tab':
                message = `⚠️ Tab switching detected! Stay on the exam page. (${newWarningCount}/3 warnings)`;
                break;
            case 'fullscreen':
                message = `⚠️ You exited fullscreen! Please return to fullscreen mode. (${newWarningCount}/3 warnings)`;
                break;
            case 'esc':
                message = `⚠️ ESC key is disabled! Please stay in fullscreen. (${newWarningCount}/3 warnings)`;
                break;
            default:
                message = `⚠️ Please stay in fullscreen mode during the exam! (${newWarningCount}/3 warnings)`;
        }

        setWarningMessage(message);
        setShowWarning(true);
        toast.error(message, { duration: 4000, icon: '⚠️' });
        
        startCountdown();

        setTimeout(() => {
            setShowWarning(false);
        }, 2000);
    }, [warningCount, isSubmitted, startCountdown]);

    const handleTermination = useCallback(async () => {
        if (isSubmitted) return;
        
        setIsSubmitted(true);
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
            setCountdownInterval(null);
        }

        try {
            const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => {
                // Check if this question has multiple answers
                const multiAnswers = multipleAnswers[questionId];
                if (multiAnswers && multiAnswers.length > 0) {
                    return {
                        questionId,
                        selectedOption: multiAnswers, // Send as array for multiple correct questions
                        isMultipleCorrect: true
                    };
                }
                return {
                    questionId,
                    selectedOption
                };
            });
            
            await API.post('/student/submit', {
                examId: id,
                answers: answersArray,
                tabSwitches,
                warningCount: warningCount,
                status: 'Terminated'
            });
            
            toast.error("🚫 Your exam has been terminated due to multiple violations!", { duration: 10000 });
            setTimeout(() => navigate('/'), 5000);
        } catch (err) {
            console.error("Termination error:", err);
            toast.error("Exam terminated due to violations");
            setTimeout(() => navigate('/'), 5000);
        }
    }, [isSubmitted, countdownInterval, answers, id, tabSwitches, warningCount, navigate]);

    useEffect(() => {
        const requestFullscreen = () => {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log("Fullscreen request failed:", err);
                });
            }
        };
        const timer = setTimeout(requestFullscreen, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isSubmitted) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                handleViolation('esc');
                return;
            }
            if (e.key === 'ContextMenu') {
                e.preventDefault();
                toast.error("Right click is disabled during exam!", { duration: 2000 });
            }
            if ((e.ctrlKey || e.metaKey) && ['t', 'w', 'n', 'r', 'p', 'j', 'i', 's', 'h'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                toast.error("⚠️ This action is disabled during the exam!", { duration: 2000 });
            }
            if (e.key === 'F5') {
                e.preventDefault();
                toast.error("Refresh is disabled during the exam!", { duration: 2000 });
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitted, handleViolation]);

    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            toast.error("Right click is disabled during exam!", { duration: 2000 });
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted) {
                setTabSwitches(prev => prev + 1);
                handleViolation('tab');
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isSubmitted, handleViolation]);

    const toggleFlag = (questionId) => {
        setFlaggedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
        const isNowFlagged = !flaggedQuestions[questionId];
        toast(isNowFlagged ? "Question marked for review" : "Question unmarked", { duration: 1500 });
    };

    const handleOptionChange = (questionId, option) => {
        const question = exam?.questions?.find(q => q._id === questionId);
        const isMultipleCorrect = question?.isMultipleCorrect;
        
        if (isMultipleCorrect) {
            // Handle multiple correct answers (checkboxes)
            setMultipleAnswers(prev => {
                const currentAnswers = prev[questionId] || [];
                if (currentAnswers.includes(option)) {
                    // Remove option if already selected
                    return { ...prev, [questionId]: currentAnswers.filter(a => a !== option) };
                } else {
                    // Add option if not selected
                    return { ...prev, [questionId]: [...currentAnswers, option] };
                }
            });
        } else {
            // Handle single answer (radio)
            setAnswers(prev => ({ ...prev, [questionId]: option }));
        }
    };

    const handleDetailedAnswerChange = (questionId, text) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerClass = () => {
        if (timeLeft > 300) return 'safe';
        if (timeLeft > 60) return 'warning';
        return 'danger';
    };
    
    const timerClass = `timer ${getTimerClass()}`;

    const getProgress = () => {
        const answered = Object.values(answers).filter(a => a !== null && a !== '').length;
        return (answered / (exam?.questions?.length || 1)) * 100;
    };

    const handleSubmit = async () => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
            setCountdownInterval(null);
        }
        
        setTimeout(() => {
            exitFullscreen();
        }, 500);

        try {
            const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => {
                // Check if this question has multiple answers
                const multiAnswers = multipleAnswers[questionId];
                if (multiAnswers && multiAnswers.length > 0) {
                    return {
                        questionId,
                        selectedOption: multiAnswers, // Send as array for multiple correct questions
                        isMultipleCorrect: true
                    };
                }
                return {
                    questionId,
                    selectedOption
                };
            });
            await API.post('/student/submit', {
                examId: id,
                answers: answersArray,
                tabSwitches,
                warningCount,
                status: 'Completed'
            });
            toast.success("🎉 Exam submitted successfully!");
            setTimeout(() => navigate('/student'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed");
            setIsSubmitted(false);
        }
    };

    const confirmSubmit = () => {
        setShowSubmitModal(true);
    };

    const goToQuestion = (index) => {
        setCurrentQuestion(index);
    };

    const closeSubmitModal = () => {
        setShowSubmitModal(false);
    };

    const finalSubmit = () => {
        setShowSubmitModal(false);
        handleSubmit();
    };

    if (loading) {
        return (
            <div className="exam-loading">
                <div className="spinner spinner-lg"></div>
                <p>Loading exam...</p>
            </div>
        );
    }

    if (!exam) return null;

    const questions = exam.questions || [];
    const currentQ = questions[currentQuestion];
    const answeredCount = Object.values(answers).filter(a => a !== null && a !== '').length + Object.values(multipleAnswers).filter(a => a && a.length > 0).length;
    const flaggedCount = Object.values(flaggedQuestions).filter(f => f === true).length;
    const unansweredCount = questions.length - answeredCount;
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
        <motion.div className="exam-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', borderRadius: '12px' } }} />

            {/* Fullscreen Countdown Overlay */}
            <AnimatePresence>
                {showCountdown && (
                    <motion.div className="countdown-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="countdown-content">
                            <Monitor size={60} className="countdown-icon" />
                            <h2>Return to Fullscreen</h2>
                            <div className="countdown-timer">{countdown}</div>
                            <motion.button 
                                className="fullscreen-btn"
                                onClick={enterFullscreen}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Monitor size={20} />
                                Click to Enter Fullscreen
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warning Banner */}
            <AnimatePresence>
                {showWarning && (
                    <motion.div 
                        className="warning-banner" 
                        initial={{ y: -100, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: -100, opacity: 0 }}
                    >
                        <AlertTriangle size={20} />
                        <span>{warningMessage}</span>
                        <motion.button 
                            className="warning-fullscreen-btn" 
                            onClick={enterFullscreen}
                            whileHover={{ scale: 1.05 }}
                        >
                            <Monitor size={16} /> Enter Fullscreen
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Review Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="submit-modal" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                            <div className="modal-header">
                                <h2>Review Your Exam</h2>
                                <button className="close-modal" onClick={closeSubmitModal}><XCircle size={24} /></button>
                            </div>
                            
                            <div className="modal-stats">
                                <div className="stat-card answered">
                                    <CheckCircle size={28} />
                                    <div className="stat-info">
                                        <span className="stat-number">{answeredCount}</span>
                                        <span className="stat-label">Answered</span>
                                    </div>
                                </div>
                                <div className="stat-card unanswered">
                                    <Circle size={28} />
                                    <div className="stat-info">
                                        <span className="stat-number">{unansweredCount}</span>
                                        <span className="stat-label">Unanswered</span>
                                    </div>
                                </div>
                                <div className="stat-card flagged">
                                    <Flag size={28} />
                                    <div className="stat-info">
                                        <span className="stat-number">{flaggedCount}</span>
                                        <span className="stat-label">Flagged</span>
                                    </div>
                                </div>
                            </div>

                            <div className="question-review-grid">
                                <h3>Question Overview</h3>
                                <div className="review-grid">
                                    {questions.map((q, index) => {
                                        const isAnswered = (answers[q._id] !== null && answers[q._id] !== '') || (multipleAnswers[q._id] && multipleAnswers[q._id].length > 0);
                                        const isFlagged = flaggedQuestions[q._id];
                                        return (
                                            <motion.button
                                                key={q._id}
                                                className={`review-btn ${isAnswered ? 'answered' : 'unanswered'} ${isFlagged ? 'flagged' : ''}`}
                                                onClick={() => { goToQuestion(index); closeSubmitModal(); }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {index + 1}
                                                {isFlagged && <Flag size={10} className="review-flag-icon" />}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {unansweredCount > 0 && (
                                <div className="modal-warning">
                                    <AlertCircle size={20} />
                                    <span>You have <strong>{unansweredCount}</strong> unanswered question(s)</span>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn-review" onClick={closeSubmitModal}>
                                    <Eye size={18} /> Review Answers
                                </button>
                                <button className="btn-submit" onClick={finalSubmit}>
                                    <Send size={18} /> Submit Exam
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exam Header */}
            <div className="exam-header">
                <div className="exam-info">
                    <FileQuestion size={24} />
                    <div>
                        <h1>{exam.title}</h1>
                        <p>Question {currentQuestion + 1} of {questions.length}</p>
                    </div>
                </div>
                
                <div className="exam-meta-right">
                    <div className={timerClass}><Timer size={20} /><span>{formatTime(timeLeft)}</span></div>
                    {warningCount > 0 && (
                        <div className={`warning-counter ${warningCount >= 2 ? 'danger' : 'warning'}`}>
                            <AlertTriangle size={16} />
                            <span>{warningCount}/3 warnings</span>
                        </div>
                    )}
                    <div className="progress-info">
                        <span>{answeredCount}/{questions.length} answered</span>
                        <div className="progress-container">
                            <motion.div className="progress-bar" initial={{ width: 0 }} animate={{ width: `${getProgress()}%` }} transition={{ duration: 0.3 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content with Sidebar */}
            <div className="exam-container">
                {/* Question Sidebar */}
                <div className="question-sidebar">
                    <div className="sidebar-header">
                        <h3>Questions</h3>
                    </div>
                    
                    <div className="sidebar-stats">
                        <div className="stat-item">
                            <span className="stat-dot attempted"></span>
                            <span>Attempted: {answeredCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-dot unattempted"></span>
                            <span>Unattempted: {unansweredCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-dot flagged"></span>
                            <span>Flagged: {flaggedCount}</span>
                        </div>
                    </div>

                    <div className="question-grid">
                        {questions.map((q, index) => {
                            const isAnswered = (answers[q._id] !== null && answers[q._id] !== '') || (multipleAnswers[q._id] && multipleAnswers[q._id].length > 0);
                            const isFlagged = flaggedQuestions[q._id];
                            const isCurrent = currentQuestion === index;
                            return (
                                <motion.button
                                    key={q._id}
                                    className={`sidebar-q-btn ${isAnswered ? 'attempted' : 'unattempted'} ${isFlagged ? 'flagged' : ''} ${isCurrent ? 'current' : ''}`}
                                    onClick={() => goToQuestion(index)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {index + 1}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="sidebar-legend">
                        <div className="legend-item">
                            <span className="legend-dot attempted"></span>
                            <span>Attempted</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot unattempted"></span>
                            <span>Unattempted</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot flagged"></span>
                            <span>Flagged</span>
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="exam-content">
                    <div className="question-content">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentQuestion} className="question-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                <div className="question-header">
                                    <div className="question-badges">
                                        <span className="question-badge">Question {currentQuestion + 1}</span>
                                        <span className="points-badge">{exam.pointsPerQuestion || 1} point(s)</span>
                                        {flaggedQuestions[currentQ?._id] && <span className="flag-badge"><Flag size={14} /> Flagged</span>}
                                    </div>
                                    <button className={`flag-btn ${flaggedQuestions[currentQ?._id] ? 'flagged' : ''}`} onClick={() => toggleFlag(currentQ._id)}>
                                        <Flag size={20} /><span>{flaggedQuestions[currentQ?._id] ? 'Unflag' : 'Flag for Review'}</span>
                                    </button>
                                </div>
                                
                                <div className="question-text">
                                    <p>{currentQ?.questionText}</p>
                                    {currentQ?.image && <img src={`http://localhost:5000${currentQ.image}`} alt="Question visual" className="question-image" />}
                                </div>

                                {(currentQ?.questionType === 'mcq' || !currentQ?.questionType) && currentQ?.options?.length > 0 && (
                                    <div className="options-container">
                                        {currentQ?.options?.map((option, index) => {
                                            const isMultipleCorrect = currentQ?.isMultipleCorrect;
                                            const isSelected = isMultipleCorrect 
                                                ? (multipleAnswers[currentQ._id] || []).includes(option)
                                                : answers[currentQ._id] === option;
                                            
                                            return (
                                                <motion.div 
                                                    key={index} 
                                                    className={`option-item ${isSelected ? 'selected' : ''}`} 
                                                    onClick={() => handleOptionChange(currentQ._id, option)} 
                                                    whileHover={{ scale: 1.01 }} 
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <span className={`option-letter ${isMultipleCorrect ? 'checkbox' : ''} ${isSelected ? 'selected' : ''}`}>
                                                        {isMultipleCorrect && isSelected && <CheckCircle size={16} />}
                                                        {!isMultipleCorrect && String.fromCharCode(65 + index)}
                                                    </span>
                                                    <span className="option-text">{option}</span>
                                                    {isSelected && <CheckCircle size={20} className="check-icon" />}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentQ?.questionType === 'detailed' && (
                                    <div className="detailed-answer-container">
                                        <label className="detailed-label"><FileQuestion size={18} />Write your detailed answer below:</label>
                                        <textarea className="detailed-textarea" placeholder={currentQ?.expectedAnswer ? `Hint: ${currentQ.expectedAnswer.slice(0, 200)}...` : "Type your answer here..."} value={answers[currentQ._id] || ''} onChange={(e) => handleDetailedAnswerChange(currentQ._id, e.target.value)} rows={8} />
                                        <span className="char-count">{answers[currentQ._id]?.length || 0} characters</span>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="question-nav">
                            <motion.button className="nav-btn prev" onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))} disabled={currentQuestion === 0} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <ChevronLeft size={20} />Previous
                            </motion.button>
                            
                            {isLastQuestion ? (
                                <motion.button className="nav-btn submit" onClick={confirmSubmit} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Send size={20} />Submit Exam
                                </motion.button>
                            ) : (
                                <motion.button className="nav-btn next" onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    Save & Next<ChevronRight size={20} />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .exam-page { min-height: 100vh; background: #f8fafc; }
                .exam-loading { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }

                /* Countdown Overlay */
                .countdown-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; z-index: 10000; }
                .countdown-content { text-align: center; color: white; }
                .countdown-icon { margin-bottom: 1.5rem; color: #f59e0b; }
                .countdown-content h2 { font-size: 2rem; margin-bottom: 1rem; }
                .countdown-timer { font-size: 7rem; font-weight: 700; margin: 1.5rem 0; color: #f59e0b; animation: pulse 1s infinite; }
                .countdown-content p { font-size: 1.25rem; opacity: 0.8; margin-bottom: 2rem; }
                .fullscreen-btn { display: inline-flex; align-items: center; gap: 0.75rem; padding: 1rem 2rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 600; cursor: pointer; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

                /* Warning Banner */
                .warning-banner { position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 0.75rem 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; z-index: 1000; font-weight: 500; }
                .warning-fullscreen-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; margin-left: 1rem; }

                /* Submit Modal */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
                .submit-modal { background: white; border-radius: 24px; padding: 2rem; max-width: 500px; width: 90%; max-height: 85vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .modal-header h2 { font-size: 1.5rem; color: #1e293b; margin: 0; }
                .close-modal { background: none; border: none; color: #64748b; cursor: pointer; padding: 0.25rem; }
                .modal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
                .stat-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 12px; }
                .stat-card.answered { background: #dcfce7; color: #16a34a; }
                .stat-card.unanswered { background: #f1f5f9; color: #64748b; }
                .stat-card.flagged { background: #ede9fe; color: #7c3aed; }
                .stat-info { display: flex; flex-direction: column; }
                .stat-number { font-size: 1.5rem; font-weight: 700; }
                .stat-label { font-size: 0.75rem; opacity: 0.8; }
                .question-review-grid { margin-bottom: 1.5rem; }
                .question-review-grid h3 { font-size: 1rem; color: #475569; margin-bottom: 0.75rem; }
                .review-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; max-height: 200px; overflow-y: auto; }
                .review-btn { width: 45px; height: 45px; border-radius: 10px; border: 2px solid; background: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; }
                .review-btn.attempted { border-color: #22c55e; color: #16a34a; background: #dcfce7; }
                .review-btn.unanswered { border-color: #e2e8f0; color: #94a3b8; }
                .review-btn.flagged { background: #ede9fe; border-color: #7c3aed; }
                .review-flag-icon { position: absolute; top: 2px; right: 2px; color: #7c3aed; }
                .modal-warning { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; background: #fef3c7; border-radius: 12px; color: #b45309; margin-bottom: 1.5rem; }
                .modal-actions { display: flex; gap: 1rem; }
                .btn-review { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; background: white; color: #475569; font-weight: 600; cursor: pointer; }
                .btn-review:hover { border-color: #667eea; color: #667eea; }
                .btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border: none; border-radius: 12px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; font-weight: 600; cursor: pointer; }
                .btn-submit:hover { box-shadow: 0 10px 20px rgba(34,197,94,0.3); }

                /* Exam Header */
                .exam-header { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .exam-info { display: flex; align-items: center; gap: 1rem; }
                .exam-info svg { color: #667eea; }
                .exam-info h1 { font-size: 1.25rem; color: #1e293b; margin: 0 0 0.25rem; }
                .exam-info p { color: #64748b; font-size: 0.875rem; margin: 0; }
                .exam-meta-right { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
                .timer { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 1.125rem; }
                .timer-safe { background: var(--grade-a-bg); color: var(--grade-a); }
                .timer-warning { background: var(--grade-c-bg); color: var(--grade-c); animation: timerPulse 1s infinite; }
                .timer-danger { background: var(--grade-f-bg); color: var(--grade-f); animation: timerPulse 0.5s infinite; }
                @keyframes timerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                
                .warning-counter { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; }
                .warning-counter.warning { background: #fef3c7; color: #d97706; }
                .warning-counter.danger { background: #fee2e2; color: #dc2626; animation: pulse 1s infinite; }
                
                .progress-info { display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px; }
                .progress-info span { font-size: 0.875rem; color: #64748b; }
                .progress-container { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
                .progress-bar { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 4px; transition: width 0.3s ease; }

                /* Exam Container with Sidebar */
                .exam-container { display: flex; min-height: calc(100vh - 80px); }
                
                /* Question Sidebar */
                .question-sidebar { width: 280px; background: white; border-right: 1px solid #e2e8f0; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .sidebar-header h3 { font-size: 1.125rem; color: #1e293b; margin: 0; }
                .sidebar-stats { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: #f8fafc; border-radius: 12px; }
                .stat-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: #475569; }
                .stat-dot { width: 12px; height: 12px; border-radius: 4px; }
                .stat-dot.attempted { background: #22c55e; }
                .stat-dot.unattempted { background: #e2e8f0; }
                .stat-dot.flagged { background: #7c3aed; }
                .question-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; flex: 1; overflow-y: auto; }
                .sidebar-q-btn { width: 40px; height: 40px; border-radius: 8px; border: 2px solid; font-weight: 600; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .sidebar-q-btn.attempted { background: #22c55e; border-color: #22c55e; color: white; }
                .sidebar-q-btn.unattempted { background: white; border-color: #e2e8f0; color: #64748b; }
                .sidebar-q-btn.flagged { background: #ede9fe; border-color: #7c3aed; color: #7c3aed; }
                .sidebar-q-btn.current { box-shadow: 0 0 0 3px rgba(102,126,234,0.5); }
                .sidebar-q-btn:hover { transform: scale(1.1); }
                .sidebar-legend { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
                .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748b; }
                .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
                .legend-dot.attempted { background: #22c55e; }
                .legend-dot.unattempted { background: #e2e8f0; }
                .legend-dot.flagged { background: #7c3aed; }

                /* Question Content */
                .exam-content { flex: 1; padding: 2rem; max-width: 800px; margin: 0 auto; }
                .question-content { display: flex; flex-direction: column; gap: 1.5rem; }
                .question-card { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .question-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
                .question-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; }
                .question-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; }
                .points-badge { background: #f1f5f9; color: #64748b; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; }
                .flag-badge { background: #ede9fe; color: #7c3aed; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 0.35rem; }
                .flag-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border: 2px solid #e2e8f0; border-radius: 10px; background: white; color: #64748b; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
                .flag-btn:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
                .flag-btn.flagged { background: #ede9fe; border-color: #7c3aed; color: #7c3aed; }
                .question-text { font-size: 1.125rem; color: #1e293b; line-height: 1.7; margin-bottom: 2rem; }
                .question-image { max-width: 100%; border-radius: 12px; margin-top: 1rem; border: 1px solid #e2e8f0; }
                .options-container { display: flex; flex-direction: column; gap: 0.75rem; }
                .option-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; cursor: pointer; transition: all 0.2s; }
                .option-item:hover { background: #f1f5f9; border-color: #667eea; }
                .option-item.selected { background: #dbeafe; border-color: #3b82f6; }
                .option-letter { width: 36px; height: 36px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #64748b; flex-shrink: 0; }
                .option-item.selected .option-letter { background: #3b82f6; color: white; }
                .option-text { flex: 1; font-weight: 500; color: #475569; }
                .option-item.selected .option-text { color: #1e40af; }
                .check-icon { color: #3b82f6; flex-shrink: 0; }
                .question-nav { display: flex; justify-content: space-between; gap: 1rem; }
                .nav-btn { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-size: 1rem; }
                .nav-btn.prev { background: #f1f5f9; color: #475569; }
                .nav-btn.prev:hover:not(:disabled) { background: #e2e8f0; }
                .nav-btn.next { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .nav-btn.next:hover { box-shadow: 0 10px 20px rgba(102,126,234,0.3); transform: translateY(-2px); }
                .nav-btn.submit { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; }
                .nav-btn.submit:hover { box-shadow: 0 10px 20px rgba(34,197,94,0.3); transform: translateY(-2px); }
                .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .exam-container { flex-direction: column; }
                    .question-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #e2e8f0; flex-direction: row; flex-wrap: wrap; align-items: center; }
                    .sidebar-header { width: 100%; }
                    .sidebar-stats { flex-direction: row; gap: 1rem; }
                    .question-grid { grid-template-columns: repeat(10, 1fr); }
                    .exam-header { padding: 1rem; }
                    .exam-info h1 { font-size: 1rem; }
                    .question-card { padding: 1.5rem; }
                    .question-nav { flex-direction: column; }
                    .nav-btn { width: 100%; justify-content: center; }
                    .exam-meta-right { gap: 1rem; }
                }

                .detailed-answer-container { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
                .detailed-label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: #475569; margin-bottom: 0.75rem; font-size: 0.938rem; }
                .detailed-label svg { color: #667eea; }
                .detailed-textarea { width: 100%; padding: 1rem; font-size: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; resize: vertical; min-height: 200px; font-family: inherit; transition: all 0.2s; background: #f8fafc; line-height: 1.6; }
                .detailed-textarea:focus { outline: none; border-color: #667eea; background: white; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
                .detailed-textarea::placeholder { color: #94a3b8; }
                .char-count { display: block; text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; }
            `}</style>
        </motion.div>
    );
};

export default ExamPage;

