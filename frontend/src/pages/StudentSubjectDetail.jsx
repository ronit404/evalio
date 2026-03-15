
import { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    BookOpen, 
    FileText, 
    Clock,
    CheckCircle,
    PlayCircle,
    ChevronDown,
    ChevronUp,
    Folder,
    FolderOpen,
    Image,
    Download,
    File,
    ArrowLeft,
    Trophy,
    AlertCircle,
    Lock,
    X,
    Search,
    BarChart3
} from 'lucide-react';

const StudentSubjectDetail = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { subject } = useParams();
    
    const decodedSubject = subject ? decodeURIComponent(subject) : '';
    
    const [subjectData, setSubjectData] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    
    // Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examPassword, setExamPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [verifyingPassword, setVerifyingPassword] = useState(false);

    // Group questions by category
    const groupedQuestions = useMemo(() => {
        if (!subjectData?.questions) return {};
        return subjectData.questions.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(q);
            return acc;
        }, {});
    }, [subjectData?.questions]);

    const categories = ['all', ...Object.keys(groupedQuestions).sort()];

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const expandAll = () => {
        const allExpanded = {};
        categories.forEach(cat => {
            if (cat !== 'all') allExpanded[cat] = true;
        });
        setExpandedCategories(allExpanded);
    };

    const collapseAll = () => {
        setExpandedCategories({});
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchSubjectData();
    }, [user, navigate, decodedSubject]);

    const fetchSubjectData = async () => {
        try {
            setLoading(true);
            const [subjectRes, materialsRes] = await Promise.all([
                API.get(`/student/subject/${encodeURIComponent(decodedSubject)}`),
                API.get(`/materials/subject?subject=${encodeURIComponent(decodedSubject)}`)
            ]);
            setSubjectData(subjectRes.data);
            setMaterials(materialsRes.data || []);
            
            const cats = Object.keys(groupedQuestions).sort();
            const initialExpanded = {};
            cats.slice(0, 3).forEach(cat => {
                initialExpanded[cat] = true;
            });
            setExpandedCategories(initialExpanded);
        } catch (err) {
            console.error("Error fetching subject data:", err);
            if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate('/login');
            } else {
                toast.error("Failed to load subject data");
            }
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (score, totalPoints) => {
        if (!totalPoints || totalPoints === 0) return 0;
        return Math.round((score / totalPoints) * 100);
    };

    const getExamSubmission = (examId) => {
        return subjectData?.examSubmissions?.[examId];
    };

    const handleStartExam = (exam) => {
        const submission = getExamSubmission(exam._id);
        if (submission && submission.status === 'Completed') {
            navigate(`/results`);
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

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedExam(null);
        setExamPassword('');
        setPasswordError('');
    };

    const filteredQuestions = searchTerm
        ? subjectData?.questions?.filter(q => 
            q.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.category?.toLowerCase().includes(searchTerm.toLowerCase())
        ) || []
        : subjectData?.questions || [];

    const filteredGroupedQuestions = useMemo(() => {
        return filteredQuestions.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(q);
            return acc;
        }, {});
    }, [filteredQuestions]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading {decodedSubject}...</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="subject-detail-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            <motion.div 
                className="page-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <button className="back-btn" onClick={() => navigate('/student')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-content">
                    <div className="header-icon">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1>{decodedSubject}</h1>
                        <p>Subject Dashboard</p>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                className="stats-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon primary">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectData?.stats?.totalExams || 0}</span>
                        <span className="stat-label">Total Exams</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon success">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectData?.stats?.completedExams || 0}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon warning">
                        <PlayCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectData?.stats?.availableExams || 0}</span>
                        <span className="stat-label">Available</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon info">
                        <Trophy size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectData?.stats?.averageScore || 0}%</span>
                        <span className="stat-label">Avg. Score</span>
                    </div>
                </motion.div>
            </motion.div>

            <div className="tab-navigation">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <BarChart3 size={18} /> Overview
                </button>
                <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
                    <BookOpen size={18} /> Exams
                </button>
                <button className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
                    <FileText size={18} /> Question Bank
                </button>
                <button className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
                    <Download size={18} /> Study Materials
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div key="overview" className="tab-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <div className="content-grid">
                            <div className="content-card">
                                <div className="card-header">
                                    <h3><Trophy size={20} /> Your Performance</h3>
                                </div>
                                <div className="performance-stats">
                                    <div className="perf-stat">
                                        <span className="perf-value">{subjectData?.stats?.averageScore || 0}%</span>
                                        <span className="perf-label">Average Score</span>
                                    </div>
                                    <div className="perf-stat">
                                        <span className="perf-value">{subjectData?.stats?.bestScore || 0}%</span>
                                        <span className="perf-label">Best Score</span>
                                    </div>
                                    <div className="perf-stat">
                                        <span className="perf-value">{subjectData?.stats?.totalQuestions || 0}</span>
                                        <span className="perf-label">Questions</span>
                                    </div>
                                </div>
                            </div>
                            <div className="content-card">
                                <div className="card-header">
                                    <h3><BookOpen size={20} /> Recent Exams</h3>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('exams')}>View All</button>
                                </div>
                                <div className="card-list">
                                    {subjectData?.exams?.slice(0, 3).map(exam => {
                                        const submission = getExamSubmission(exam._id);
                                        return (
                                            <div key={exam._id} className="list-item">
                                                <div className="item-info">
                                                    <h4>{exam.title}</h4>
                                                    <span className="item-meta"><Clock size={14} /> {exam.duration} mins</span>
                                                </div>
                                                {submission ? (
                                                    <span className={`status-badge ${submission.status === 'Completed' ? 'completed' : 'pending'}`}>
                                                        {calculatePercentage(submission.score, submission.totalPoints)}%
                                                    </span>
                                                ) : exam.examStatus === 'available' ? (
                                                    <span className="status-badge available">Start</span>
                                                ) : (
                                                    <span className="status-badge disabled">{exam.examStatus}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {(!subjectData?.exams || subjectData.exams.length === 0) && (
                                        <div className="empty-list"><AlertCircle size={40} /><p>No exams available</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'exams' && (
                    <motion.div key="exams" className="tab-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <div className="exams-list">
                            {(!subjectData?.exams || subjectData.exams.length === 0) ? (
                                <div className="empty-state"><BookOpen size={64} /><h3>No Exams Available</h3><p>No exams have been created for this subject yet</p></div>
                            ) : (
                                subjectData.exams.map(exam => {
                                    const submission = getExamSubmission(exam._id);
                                    const percentage = submission ? calculatePercentage(submission.score, submission.totalPoints) : null;
                                    const isAvailable = !submission && exam.examStatus === 'available';
                                    return (
                                        <motion.div key={exam._id} className={`exam-card ${submission ? 'completed' : ''} ${!isAvailable && !submission ? 'disabled' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="exam-icon"><FileText size={24} /></div>
                                            <div className="exam-details">
                                                <h3>{exam.title}</h3>
                                                <div className="exam-meta">
                                                    <span><Clock size={14} /> {exam.duration} mins</span>
                                                </div>
                                            </div>
                                            <div className="exam-actions">
                                                {submission ? (
                                                    <div className="score-display">
                                                        <span className={`score ${percentage >= 70 ? 'good' : percentage >= 50 ? 'average' : 'low'}`}>{percentage}%</span>
                                                        <span className="score-label">Completed</span>
                                                    </div>
                                                ) : isAvailable ? (
                                                    <button className="btn btn-primary" onClick={() => handleStartExam(exam)}>
                                                        <PlayCircle size={18} /> Start Exam
                                                    </button>
                                                ) : (
                                                    <span className={`status-badge ${exam.examStatus}`}>{exam.examStatus === 'upcoming' ? 'Upcoming' : 'Ended'}</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'questions' && (
                    <motion.div key="questions" className="tab-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <div className="filter-bar">
                            <div className="search-box">
                                <Search size={18} className="search-icon" />
                                <input type="text" placeholder="Search questions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="filter-actions">
                                <button className="btn btn-secondary" onClick={expandAll}><ChevronDown size={16} /> Expand All</button>
                                <button className="btn btn-secondary" onClick={collapseAll}><ChevronUp size={16} /> Collapse All</button>
                            </div>
                        </div>
                        <div className="category-tabs">
                            <button className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => { setSelectedCategory('all'); expandAll(); }}>
                                <Folder size={16} /> All ({subjectData?.questions?.length || 0})
                            </button>
                            {Object.entries(groupedQuestions).map(([category, catQuestions]) => (
                                <button key={category} className={`category-tab ${selectedCategory === category ? 'active' : ''}`} onClick={() => { setSelectedCategory(category); toggleCategory(category); }}>
                                    {expandedCategories[category] ? <FolderOpen size={16} /> : <Folder size={16} />} {category} ({catQuestions.length})
                                </button>
                            ))}
                        </div>
                        <div className="questions-container">
                            {filteredQuestions.length === 0 ? (
                                <div className="empty-state"><BookOpen size={64} /><h3>No Questions Found</h3><p>{searchTerm ? 'Try a different search term' : 'No questions available for this subject'}</p></div>
                            ) : selectedCategory === 'all' ? (
                                Object.entries(filteredGroupedQuestions).map(([category, catQuestions]) => (
                                    <div key={category} className="category-section">
                                        <div className="category-title-bar" onClick={() => toggleCategory(category)}>
                                            <div className="category-info">
                                                {expandedCategories[category] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                <FolderOpen size={20} color="#667eea" />
                                                <span className="category-name">{category}</span>
                                                <span className="category-badge">{catQuestions.length}</span>
                                            </div>
                                        </div>
                                        {expandedCategories[category] && (
                                            <div className="questions-grid">
                                                {catQuestions.map((q, idx) => (
                                                    <motion.div key={q._id} className="question-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                                                        <div className="question-header">
                                                            <span className="badge badge-primary">{q.category || 'General'}</span>
                                                            {q.questionType === 'detailed' && <span className="badge badge-detailed">Detailed</span>}
                                                            {q.image && <Image size={18} color="#3b82f6" />}
                                                        </div>
                                                        <p className="question-text">{q.questionText}</p>
                                                        <div className="question-options">
                                                            {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                                                <span key={i} className="option-tag">{String.fromCharCode(65 + i)}. {opt}</span>
                                                            ))}
                                                            {q.questionType === 'detailed' && <span className="option-tag detailed">See answer key</span>}
                                                        </div>
                                                        <div className="question-footer">
                                                            <span className="question-id">#{q._id?.substring(0, 8)}</span>
                                                            <span className="question-points">{q.points || 1} point(s)</span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="category-section single">
                                    <div className="category-section-header">
                                        <FolderOpen size={24} color="#667eea" />
                                        <span className="category-name">{selectedCategory}</span>
                                        <span className="category-badge large">{filteredGroupedQuestions[selectedCategory]?.length || 0}</span>
                                    </div>
                                    <div className="questions-grid">
                                        {filteredGroupedQuestions[selectedCategory]?.map((q, idx) => (
                                            <motion.div key={q._id} className="question-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                                <div className="question-header">
                                                    <span className="badge badge-primary">{q.category || 'General'}</span>
                                                    {q.questionType === 'detailed' && <span className="badge badge-detailed">Detailed</span>}
                                                </div>
                                                <p className="question-text">{q.questionText}</p>
                                                <div className="question-options">
                                                    {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                                        <span key={i} className="option-tag">{String.fromCharCode(65 + i)}. {opt}</span>
                                                    ))}
                                                </div>
                                                <div className="question-footer">
                                                    <span className="question-id">#{q._id?.substring(0, 8)}</span>
                                                    <span className="question-points">{q.points || 1} point(s)</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'materials' && (
                    <motion.div key="materials" className="tab-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        <div className="materials-grid">
                            {materials.length === 0 ? (
                                <div className="empty-state"><Download size={64} /><h3>No Study Materials</h3><p>Study materials will appear here once uploaded by your instructor</p></div>
                            ) : (
                                materials.map((material, index) => (
                                    <motion.div key={material._id} className="material-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                        <div className="card-header">
                                            <div className="material-icon"><File size={24} /></div>
                                            <span className="file-type-badge">{material.fileType?.toUpperCase() || 'FILE'}</span>
                                        </div>
                                        <div className="card-body">
                                            <h3>{material.title}</h3>
                                            {material.description && <p className="description">{material.description}</p>}
                                            <span className="file-name"><File size={14} /> {material.fileName}</span>
                                        </div>
                                        <div className="card-footer">
                                            <span className="upload-date">{new Date(material.createdAt).toLocaleDateString()}</span>
                                            <a href={`http://localhost:5000${material.file}`} target="_blank" rel="noopener noreferrer" className="btn-download">
                                                <Download size={18} /> Download
                                            </a>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div className="password-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="password-modal-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                            <div className="password-modal-header">
                                <Lock size={28} className="lock-icon" />
                                <h2>Enter Exam Password</h2>
                                <button className="close-btn" onClick={closePasswordModal}>×</button>
                            </div>
                            <p className="password-modal-text">This exam is password protected. Please enter the password to continue.</p>
                            <div className="password-input-container">
                                <input type="password" className="password-input" placeholder="Enter exam password" value={examPassword} onChange={(e) => { setExamPassword(e.target.value); setPasswordError(''); }} onKeyPress={(e) => { if (e.key === 'Enter') verifyPassword(); }} autoFocus />
                            </div>
                            {passwordError && <p className="password-error">{passwordError}</p>}
                            <div className="password-modal-actions">
                                <button className="btn-cancel" onClick={closePasswordModal}>Cancel</button>
                                <button className="btn-verify" onClick={verifyPassword} disabled={verifyingPassword}>{verifyingPassword ? 'Verifying...' : 'Verify Password'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .subject-detail-page { min-height: 100vh; background: #f1f5f9; padding-bottom: 2rem; }
                .loading-container { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
                .page-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; display: flex; align-items: center; gap: 1rem; margin: -2rem -1.5rem 2rem; }
                .back-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.15); border: none; border-radius: 10px; color: white; cursor: pointer; flex-shrink: 0; }
                .back-btn:hover { background: rgba(255,255,255,0.25); }
                .header-content { display: flex; align-items: center; gap: 1rem; }
                .header-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
                .page-header h1 { font-size: 1.5rem; color: white; margin-bottom: 0.25rem; }
                .page-header p { color: rgba(255,255,255,0.7); margin: 0; font-size: 0.875rem; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; padding: 0 1.5rem; margin-bottom: 2rem; }
                .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .stat-card .stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-card .stat-icon.primary { background: #dbeafe; color: #2563eb; }
                .stat-card .stat-icon.success { background: #dcfce7; color: #16a34a; }
                .stat-card .stat-icon.warning { background: #fef3c7; color: #d97706; }
                .stat-card .stat-icon.info { background: #f3e8ff; color: #9333ea; }
                .stat-card .stat-info { display: flex; flex-direction: column; }
                .stat-card .stat-value { font-size: 1.75rem; font-weight: 700; color: #111827; line-height: 1; }
                .stat-card .stat-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
                .tab-navigation { display: flex; gap: 0.5rem; padding: 0 1.5rem; margin-bottom: 1.5rem; background: white; padding: 0.5rem; border-radius: 12px; width: fit-content; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border: none; background: transparent; color: #6b7280; font-weight: 500; cursor: pointer; border-radius: 10px; }
                .tab-btn:hover { background: #f1f5f9; }
                .tab-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .tab-content { padding: 0 1.5rem; }
                .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .content-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
                .card-header h3 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.125rem; color: #111827; margin: 0; }
                .performance-stats { display: flex; justify-content: space-around; padding: 1.5rem; }
                .perf-stat { text-align: center; }
                .perf-value { display: block; font-size: 2rem; font-weight: 700; color: #667eea; }
                .perf-label { font-size: 0.875rem; color: #6b7280; }
                .card-list { padding: 1rem; }
                .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 10px; margin-bottom: 0.75rem; }
                .item-info h4 { font-size: 1rem; color: #111827; margin: 0 0 0.25rem; }
                .item-meta { display: flex; align-items: center; gap: 0.5rem; color: #6b7280; font-size: 0.875rem; }
                .status-badge { padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                .status-badge.completed { background: #dcfce7; color: #16a34a; }
                .status-badge.available { background: #dbeafe; color: #2563eb; }
                .status-badge.upcoming { background: #fef3c7; color: #d97706; }
                .status-badge.expired, .status-badge.disabled { background: #f3f4f6; color: #9ca3af; }
                .empty-list { text-align: center; padding: 2rem; color: #6b7280; }
                .exams-list { display: flex; flex-direction: column; gap: 1rem; }
                .exam-card { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: white; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .exam-card.disabled { opacity: 0.6; }
                .exam-card.completed { border-left: 4px solid #22c55e; }
                .exam-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; }
                .exam-details { flex: 1; }
                .exam-details h3 { font-size: 1.125rem; color: #111827; margin: 0 0 0.5rem; }
                .exam-meta { display: flex; gap: 1.5rem; color: #6b7280; font-size: 0.875rem; }
                .exam-actions { display: flex; align-items: center; }
                .score-display { text-align: center; }
                .score { display: block; font-size: 1.5rem; font-weight: 700; }
                .score.good { color: #16a34a; }
                .score.average { color: #d97706; }
                .score.low { color: #dc2626; }
                .score-label { font-size: 0.75rem; color: #6b7280; }
                .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; }
                .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .btn-primary:hover { box-shadow: 0 10px 20px rgba(102,126,234,0.3); }
                .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
                .btn-sm { padding: 0.5rem 0.875rem; font-size: 0.8rem; }
                .filter-bar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
                .search-box { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; flex: 1; max-width: 400px; }
                .search-icon { color: #94a3b8; }
                .search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; }
                .filter-actions { display: flex; gap: 0.5rem; }
                .category-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
                .category-tab { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.813rem; color: #64748b; cursor: pointer; }
                .category-tab:hover { background: #f1f5f9; }
                .category-tab.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .category-section { margin-bottom: 1rem; }
                .category-section.single { background: white; border-radius: 16px; padding: 1.5rem; }
                .category-title-bar { display: flex; align-items: center; padding: 0.75rem 1rem; background: white; border-radius: 12px; cursor: pointer; margin-bottom: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .category-info { display: flex; align-items: center; gap: 0.75rem; }
                .category-name { font-weight: 600; color: #1e293b; }
                .category-badge { background: #667eea; color: white; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; }
                .category-badge.large { font-size: 0.875rem; padding: 0.375rem 0.75rem; }
                .category-section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
                .questions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
                .question-card { padding: 1.25rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
                .question-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,0.1); }
                .question-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
                .question-text { font-weight: 500; color: #1e293b; margin-bottom: 1rem; }
                .question-options { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
                .option-tag { font-size: 0.75rem; padding: 0.375rem 0.625rem; background: #f1f5f9; border-radius: 6px; color: #475569; }
                .option-tag.detailed { background: #fef3c7; color: #92400e; }
                .question-footer { display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
                .question-id { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }
                .question-points { font-size: 0.75rem; color: #64748b; }
                .badge { padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
                .badge-primary { background: #dbeafe; color: #2563eb; }
                .badge-detailed { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
                .materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .material-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s; }
                .material-card:hover { transform: translateY(-8px); box-shadow: 0 12px 20px rgba(0,0,0,0.15); }
                .material-card .card-header { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 1.5rem; display: flex; justify-content: space-between; }
                .material-icon { width: 56px; height: 56px; background: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #667eea; }
                .file-type-badge { padding: 0.375rem 0.75rem; background: white; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: #64748b; }
                .material-card .card-body { padding: 1.5rem; }
                .material-card h3 { font-size: 1.125rem; color: #1e293b; margin-bottom: 0.75rem; }
                .material-card .description { font-size: 0.875rem; color: #64748b; margin-bottom: 1rem; }
                .material-card .file-name { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; }
                .material-card .card-footer { padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
                .material-card .upload-date { font-size: 0.75rem; color: #94a3b8; }
                .material-card .btn-download { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; }
                .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 20px; }
                .empty-state svg { color: #cbd5e1; margin-bottom: 1.5rem; }
                .empty-state h3 { color: #334155; margin-bottom: 0.75rem; }
                .empty-state p { color: #64748b; }
                .password-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
                .password-modal-content { background: white; border-radius: 20px; padding: 2rem; max-width: 400px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
                .password-modal-header { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
                .lock-icon { color: #667eea; }
                .password-modal-header h2 { font-size: 1.5rem; color: #1e293b; margin: 0; }
                .close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; }
                .password-modal-text { text-align: center; color: #64748b; margin-bottom: 1.5rem; }
                .password-input-container { margin-bottom: 1rem; }
                .password-input { width: 100%; padding: 1rem; font-size: 1rem; border: 2px solid #e2e8f0; border-radius: 12px; }
                .password-input:focus { outline: none; border-color: #667eea; }
                .password-error { color: #dc2626; font-size: 0.875rem; text-align: center; margin-bottom: 1rem; }
                .password-modal-actions { display: flex; gap: 1rem; }
                .btn-cancel { flex: 1; padding: 0.875rem; border: 2px solid #e2e8f0; border-radius: 12px; background: white; color: #64748b; font-weight: 600; cursor: pointer; }
                .btn-cancel:hover { border-color: #667eea; color: #667eea; }
                .btn-verify { flex: 1; padding: 0.875rem; border: none; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; }
                .btn-verify:disabled { opacity: 0.7; }
                .spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
                @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } .tab-navigation { width: 100%; overflow-x: auto; } .exam-card { flex-direction: column; } }
            `}</style>
        </motion.div>
    );
};

export default StudentSubjectDetail;

