import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    PlayCircle, 
    CheckCircle, 
    Clock, 
    BookOpen,
    ChevronRight,
    Calendar,
    AlertCircle,
    Lock,
    X,
    User,
    GraduationCap,
    FolderOpen,
    Trophy
} from 'lucide-react';

const StudentDashboard = () => {
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examPassword, setExamPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [verifyingPassword, setVerifyingPassword] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Track previous location to detect navigation back from exam
    const [prevLocation, setPrevLocation] = useState(null);

    // Redirect admin users to admin dashboard
    useEffect(() => {
        if (user?.isAdmin) {
            navigate('/admin');
        }
    }, [user, navigate]);

    // Check if student needs to select subjects - removed, now showing all subjects directly

    // Calculate percentage from raw score
    const calculatePercentage = (score, totalPoints) => {
        if (!totalPoints || totalPoints === 0) return 0;
        return Math.round((score / totalPoints) * 100);
    };

    // Fetch data function
    const fetchData = async () => {
        setLoading(true);
        try {
            const [examsRes, resultsRes, subjectsRes] = await Promise.all([
                API.get('/student/exams'),
                API.get('/student/my-results'),
                API.get('/student/available-subjects')
            ]);
            setExams(examsRes.data);
            setResults(resultsRes.data);
            // Store available subjects (not just enrolled ones)
            if (subjectsRes.data && subjectsRes.data.availableSubjects) {
                setAvailableSubjects(subjectsRes.data.availableSubjects);
            }
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            
            if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                toast.error("Cannot connect to server. Please ensure the backend is running.");
            } else if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate('/login');
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Failed to load data. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, navigate]);

    // Refresh data when navigating back from exam page
    useEffect(() => {
        // Detect if we just came back from exam page
        if (prevLocation && prevLocation.pathname.startsWith('/exam/') && location.pathname === '/student') {
            fetchData(); // Refresh results and exams
        }
        // Update previous location for next render
        setPrevLocation(location);
    }, [location, prevLocation, navigate]);

    const getResultForExam = (examId) => {
        return results.find(r => r.exam._id === examId || r.exam === examId);
    };

    // Handle starting an exam - check for password protection
    const handleStartExam = (exam) => {
        const submission = getResultForExam(exam._id);
        
        if (submission) {
            return;
        }
        
        if (exam.isPasswordProtected) {
            setSelectedExam(exam);
            setShowPasswordModal(true);
            setExamPassword('');
            setPasswordError('');
        } else {
            navigate(`/exam/${exam._id}`);
        }
    };

    // Verify exam password
    const verifyPassword = async () => {
        if (!examPassword.trim()) {
            setPasswordError('Please enter the exam password');
            return;
        }

        setVerifyingPassword(true);
        setPasswordError('');

        try {
            const response = await API.post('/student/verify-password', {
                examId: selectedExam._id,
                password: examPassword
            });

            if (response.data.valid) {
                setShowPasswordModal(false);
                navigate(`/exam/${selectedExam._id}`);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setPasswordError('Incorrect password. Please try again.');
            } else {
                setPasswordError(err.response?.data?.message || 'Failed to verify password');
            }
        } finally {
            setVerifyingPassword(false);
        }
    };

    // Close password modal
    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedExam(null);
        setExamPassword('');
        setPasswordError('');
    };

    // Group exams by subject
    const getExamsBySubject = () => {
        const subjectMap = {};
        
        exams.forEach(exam => {
            const subject = exam.subject || 'General';
            if (!subjectMap[subject]) {
                subjectMap[subject] = [];
            }
            subjectMap[subject].push(exam);
        });
        
        return subjectMap;
    };

// Get all available subjects for the student's section
    const getSubjects = () => {
        // Use available subjects from API (all subjects available for the section)
        if (availableSubjects && availableSubjects.length > 0) {
            return availableSubjects.map(sub => ({
                subject: sub.subject,
                teacherName: sub.teachers && sub.teachers.length > 0 ? sub.teachers[0].teacherName : null,
                teacherId: sub.teachers && sub.teachers.length > 0 ? sub.teachers[0].teacherId : null
            }));
        }
        
        // Fallback: use enrolled subjects from user
        if (user?.enrolledSubjects && user.enrolledSubjects.length > 0) {
            const subjectMap = {};
            user.enrolledSubjects.forEach(es => {
                if (!subjectMap[es.subject]) {
                    subjectMap[es.subject] = {
                        subject: es.subject,
                        teacherName: es.teacherName,
                        teacherId: es.teacherId
                    };
                }
            });
            return Object.values(subjectMap);
        }
        
        // Last fallback: group from exams
        const subjectMap = getExamsBySubject();
        return Object.keys(subjectMap).map(subject => ({
            subject,
            teacherName: null,
            teacherId: null
        }));
    };

    // Get exams for a specific subject
    const getExamsForSubject = (subjectName) => {
        return exams.filter(exam => (exam.subject || 'General') === subjectName);
    };

    // Container variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading your assessments...</p>
            </div>
        );
    }

    const subjects = getSubjects();

    return (
        <motion.div 
            className="dashboard-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            {/* Hero Section */}
            <motion.div 
                className="dashboard-hero"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hero-content">
                    <motion.div 
                        className="hero-icon"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <BookOpen size={32} />
                    </motion.div>
                    <div>
                        <h1>Welcome back, {user?.name || 'Student'}!</h1>
                        <p>
                            {user?.year ? `Year ${user.year}` : ''} 
                            {user?.department ? ` - ${user.department}` : ''} 
                            {user?.section ? ` - ${user.section}` : ''}
                        </p>
                    </div>
                </div>
                <div className="hero-stats">
                    <div className="hero-stat">
                        <span className="stat-value">{subjects.length}</span>
                        <span className="stat-label">Subjects</span>
                    </div>
                    <div className="hero-stat">
                        <span className="stat-value">{results.length}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
            </motion.div>

{/* Subjects Section */}
            <div className="section-container">
                <motion.div 
                    className="section-header"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>
                        <FolderOpen size={24} />
                        Your Subjects
                    </h2>
                    <div className="section-actions">
                        <span className="badge badge-primary">{subjects.length} subjects</span>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {subjects.length === 0 ? (
                        <motion.div 
                            className="empty-state"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <BookOpen size={64} />
                            <h3>No Subjects Enrolled</h3>
                            <p>Contact your administrator to get enrolled in subjects</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className="subjects-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {subjects.map((subject, index) => {
                                const subjectExams = getExamsForSubject(subject.subject);
                                const completedCount = subjectExams.filter(e => getResultForExam(e._id)).length;
                                const availableCount = subjectExams.filter(e => {
                                    const result = getResultForExam(e._id);
                                    return !result && e.examStatus !== 'upcoming' && e.examStatus !== 'expired';
                                }).length;
                                
                                return (
                                    <motion.div 
                                        key={subject.subject}
                                        className={`subject-card ${selectedSubject === subject.subject ? 'selected' : ''}`}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02, y: -5 }}
                                        onClick={() => setSelectedSubject(selectedSubject === subject.subject ? null : subject.subject)}
                                    >
                                        <div className="subject-card-header">
                                            <div className="subject-icon">
                                                <BookOpen size={24} />
                                            </div>
                                            <span className="subject-badge">
                                                {completedCount}/{subjectExams.length} done
                                            </span>
                                        </div>
                                        
                                        <h3 className="subject-title">{subject.subject}</h3>
                                        
                                        {subject.teacherName && (
                                            <div className="teacher-info">
                                                <User size={14} />
                                                <span>{subject.teacherName}</span>
                                            </div>
                                        )}

                                        <div className="subject-meta">
                                            <div className="meta-item">
                                                <PlayCircle size={16} />
                                                <span>{availableCount} Available</span>
                                            </div>
                                            <div className="meta-item">
                                                <CheckCircle size={16} />
                                                <span>{completedCount} Completed</span>
                                            </div>
                                        </div>

                                        {selectedSubject === subject.subject && (
                                            <motion.div 
                                                className="subject-exams"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                            >
                                                {subjectExams.length === 0 ? (
                                                    <p className="no-exams">No exams for this subject</p>
                                                ) : (
                                                    subjectExams.map(exam => {
                                                        const submission = getResultForExam(exam._id);
                                                        const isAvailable = !submission && exam.examStatus !== 'upcoming' && exam.examStatus !== 'expired';
                                                        
                                                        return (
                                                            <div 
                                                                key={exam._id} 
                                                                className={`exam-item ${submission ? 'completed' : ''} ${!isAvailable ? 'disabled' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isAvailable) handleStartExam(exam);
                                                                }}
                                                            >
                                                                <div className="exam-info">
                                                                    <span className="exam-name">{exam.title}</span>
                                                                    <span className="exam-details">
                                                                        <Clock size={12} /> {exam.duration} mins
                                                                    </span>
                                                                </div>
                                                                {submission ? (
                                                                    <span className="exam-status completed">
                                                                        {calculatePercentage(submission.score, submission.totalPoints)}%
                                                                    </span>
                                                                ) : isAvailable ? (
                                                                    <span className="exam-status available">Start</span>
                                                                ) : (
                                                                    <span className="exam-status disabled">Ended</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </motion.div>
                                        )}

                                        {!selectedSubject && (
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/student/subject/${encodeURIComponent(subject.subject)}`);
                                                }}
                                            >
                                                View Details
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recent Results Section */}
            {results.length > 0 && (
                <motion.div 
                    className="section-container recent-results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="section-header">
                        <h2>
                            <Trophy size={24} />
                            Recent Performance
                        </h2>
                    </div>
                    <div className="results-list">
                        {results.slice(-3).reverse().map((result, index) => {
                            const percentage = calculatePercentage(result.score || 0, result.totalPoints || 1);
                            return (
                            <motion.div 
                                key={result._id}
                                className="result-item"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                            >
                                <div className="result-info">
                                    <h4>{result.exam.title || 'Exam'}</h4>
                                    <span className="result-date">
                                        {new Date(result.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="result-score-display">
                                    <span className={`score ${percentage >= 70 ? 'good' : percentage >= 50 ? 'average' : 'low'}`}>
                                        {percentage}%
                                    </span>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div 
                        className="password-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="password-modal-content"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <div className="password-modal-header">
                                <Lock size={28} className="lock-icon" />
                                <h2>Enter Exam Password</h2>
                                <button className="close-btn" onClick={closePasswordModal}>×</button>
                            </div>
                            <p className="password-modal-text">
                                This exam is password protected. Please enter the password to continue.
                            </p>
                            <div className="password-input-container">
                                <input 
                                    type="password"
                                    className="password-input"
                                    placeholder="Enter exam password"
                                    value={examPassword}
                                    onChange={(e) => {
                                        setExamPassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            verifyPassword();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            {passwordError && <p className="password-error">{passwordError}</p>}
                            <div className="password-modal-actions">
                                <button className="btn-cancel" onClick={closePasswordModal}>Cancel</button>
                                <button 
                                    className="btn-verify" 
                                    onClick={verifyPassword}
                                    disabled={verifyingPassword}
                                >
                                    {verifyingPassword ? 'Verifying...' : 'Verify Password'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .dashboard-container {
                    min-height: 100vh;
                }

                .dashboard-hero {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 2.5rem;
                    border-radius: 0 0 2rem 2rem;
                    margin: -2rem -1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }

                .hero-content {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    color: white;
                }

                .hero-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                .hero-content h1 {
                    font-size: 1.75rem;
                    margin-bottom: 0.25rem;
                    color: white;
                }

                .hero-content p {
                    color: rgba(255, 255, 255, 0.85);
                    margin: 0;
                }

                .hero-stats {
                    display: flex;
                    gap: 2rem;
                }

                .hero-stat {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                }

                .hero-stat .stat-value {
                    display: block;
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                }

                .hero-stat .stat-label {
                    font-size: 0.875rem;
                    color: rgba(255, 255, 255, 0.8);
                }

                .loading-container {
                    min-height: 60vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }

                .loading-container p {
                    color: #6b7280;
                    font-size: 1rem;
                }

                .section-container {
                    padding: 0 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }

                .section-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.5rem;
                    color: #111827;
                }

                .badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

.badge-primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .section-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-outline {
                    background: transparent;
                    border: 2px solid #e5e7eb;
                    color: #6b7280;
                }

                .btn-outline:hover {
                    border-color: #667eea;
                    color: #667eea;
                }

                .subjects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .subject-card {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .subject-card.selected {
                    border-color: #667eea;
                }

                .subject-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .subject-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .subject-badge {
                    padding: 0.25rem 0.75rem;
                    background: #f3f4f6;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                }

                .subject-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 0.5rem;
                }

                .teacher-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }

                .subject-meta {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 1rem;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .subject-exams {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                }

                .no-exams {
                    text-align: center;
                    color: #9ca3af;
                    padding: 1rem;
                }

                .exam-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: #f9fafb;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .exam-item:hover:not(.disabled) {
                    background: #f1f5f9;
                }

                .exam-item.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .exam-item.completed {
                    opacity: 0.7;
                }

                .exam-info {
                    display: flex;
                    flex-direction: column;
                }

                .exam-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                }

                .exam-details {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .exam-status {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .exam-status.completed {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .exam-status.available {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .exam-status.disabled {
                    background: #f3f4f6;
                    color: #9ca3af;
                }

                .btn-sm {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .btn-secondary {
                    background: #f1f5f9;
                    color: #374151;
                    border: none;
                    width: 100%;
                    justify-content: center;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    border: 2px dashed #e5e7eb;
                }

                .empty-state svg {
                    color: #9ca3af;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #6b7280;
                    margin: 0;
                }

                .recent-results {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .results-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .result-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 12px;
                }

                .result-info h4 {
                    font-size: 1rem;
                    color: #111827;
                    margin-bottom: 0.25rem;
                }

                .result-date {
                    font-size: 0.875rem;
                    color: #6b7280;
                }

                .result-score-display .score {
                    font-size: 1.25rem;
                    font-weight: 700;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                }

                .result-score-display .score.good {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .result-score-display .score.average {
                    background: #fef3c7;
                    color: #d97706;
                }

                .result-score-display .score.low {
                    background: #fee2e2;
                    color: #dc2626;
                }

                /* Password Modal Styles */
                .password-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }

                .password-modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                }

                .password-modal-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .lock-icon {
                    color: #667eea;
                    margin-bottom: 0.5rem;
                }

                .password-modal-header h2 {
                    font-size: 1.5rem;
                    color: #1e293b;
                    margin: 0;
                    text-align: center;
                }

                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #64748b;
                    cursor: pointer;
                }

                .password-modal-text {
                    text-align: center;
                    color: #64748b;
                    margin-bottom: 1.5rem;
                }

                .password-input-container {
                    margin-bottom: 1rem;
                }

                .password-input {
                    width: 100%;
                    padding: 1rem;
                    font-size: 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .password-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .password-error {
                    color: #dc2626;
                    font-size: 0.875rem;
                    text-align: center;
                    margin-bottom: 1rem;
                }

                .password-modal-actions {
                    display: flex;
                    gap: 1rem;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 0.875rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel:hover {
                    border-color: #667eea;
                    color: #667eea;
                }

                .btn-verify {
                    flex: 1;
                    padding: 0.875rem;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-verify:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }

                .btn-verify:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .dashboard-hero {
                        padding: 1.5rem;
                        border-radius: 0 0 1.5rem 1.5rem;
                        margin: -1.5rem -1rem 1.5rem;
                    }

                    .hero-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .hero-content h1 {
                        font-size: 1.5rem;
                    }

                    .hero-stats {
                        width: 100%;
                        justify-content: center;
                    }

                    .stats-overview {
                        grid-template-columns: 1fr;
                        padding: 0 1rem;
                    }

                    .subjects-grid {
                        grid-template-columns: 1fr;
                    }

                    .section-container {
                        padding: 0 1rem;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default StudentDashboard;

