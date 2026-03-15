import { useEffect, useState, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    PlusCircle, 
    BookOpen, 
    BarChart3, 
    FileText, 
    Image as ImageIcon,
    Users,
    Clock,
    AlertCircle,
    Settings,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Folder,
    FolderOpen,
    X,
    PieChart,
    CheckCircle,
    XCircle,
    UserCheck,
    GraduationCap,
    ArrowLeft,
    Edit2,
    Save,
    Eye,
    Search,
    Filter,
    ChevronDown as ChevronDownIcon,
    ChevronUp as ChevronUpIcon
} from 'lucide-react';

const SubjectAdmin = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { subject, year, section, teachingSubjectIndex } = useParams();
    
    // State for subject-specific data
    const [subjectAnalytics, setSubjectAnalytics] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedCategories, setExpandedCategories] = useState({});
    
    // Analytics modal state
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [selectedExamAnalytics, setSelectedExamAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [selectedExamTitle, setSelectedExamTitle] = useState('');
    
// Enhanced student analytics state
    const [studentList, setStudentList] = useState([]); // studentsSummary
    const [expandedStudents, setExpandedStudents] = useState({}); // Track expanded rows
    const [editingScore, setEditingScore] = useState(null); // {studentId, examIndex}
    const [newScore, setNewScore] = useState('');
    const [updatingScore, setUpdatingScore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExamId, setSelectedExamId] = useState(null);

    // Decode subject from URL
    const decodedSubject = subject ? decodeURIComponent(subject) : '';
    const parsedYear = year ? parseInt(year) : null;

    // Group questions by category - using useMemo to prevent infinite loops
    const groupedQuestions = useMemo(() => {
        return questions.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(q);
            return acc;
        }, {});
    }, [questions]);

    // Get all unique categories
    const categories = ['all', ...Object.keys(groupedQuestions).sort()];

    // Toggle category expansion
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Expand all categories
    const expandAll = () => {
        const allExpanded = {};
        categories.forEach(cat => {
            if (cat !== 'all') allExpanded[cat] = true;
        });
        setExpandedCategories(allExpanded);
    };

    // Collapse all categories
    const collapseAll = () => {
        setExpandedCategories({});
    };

    useEffect(() => {
        // Check if user is logged in
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchSubjectData = async () => {
            try {
                setLoading(true);
                
                console.log('Fetching subject data for:', { decodedSubject, parsedYear, section });
                
                let allQuestions = [];
                
                // Fetch subject-specific analytics
    if (decodedSubject && parsedYear && section) {
                    let url = `/teacher/subject-analytics/${encodeURIComponent(decodedSubject)}/${parsedYear}/${section}`;
                    if (teachingSubjectIndex !== undefined) {
                        url += `/${teachingSubjectIndex}`;
                    }
                    const analyticsRes = await API.get(url);
                    console.log('Subject analytics response:', analyticsRes.data);
                    const data = analyticsRes.data;
                    setSubjectAnalytics(data);
                    setExams(data.exams || []);
                    
                    // Get questions from analytics (questions in exams)
                    const examQuestions = data.questions || [];
                    
                    // Also fetch standalone questions for this subject from the questions endpoint
                    try {
                        const questionsRes = await API.get('/teacher/questions', {
                            params: { category: decodedSubject }
                        });
                        const standaloneQuestions = questionsRes.data || [];
                        
                        // Combine and deduplicate questions
                        const combinedQuestions = [...examQuestions];
                        standaloneQuestions.forEach(sq => {
                            if (!combinedQuestions.some(eq => eq._id === sq._id)) {
                                combinedQuestions.push(sq);
                            }
                        });
                        
                        setQuestions(combinedQuestions);
                        allQuestions = combinedQuestions;
                    } catch (qErr) {
                        console.log('Error fetching standalone questions:', qErr);
                        // Fall back to just exam questions
                        setQuestions(examQuestions);
                        allQuestions = examQuestions;
                    }
                } else {
                    // Fallback: fetch all data (for backward compatibility)
                    console.log('Missing params, using fallback');
                    const [qRes, eRes] = await Promise.all([
                        API.get('/teacher/questions'),
                        API.get('/teacher/exams')
                    ]);
                    setQuestions(qRes.data);
                    setExams(eRes.data);
                    allQuestions = qRes.data || [];
                }
                
                // Auto-expand first few categories after data is loaded
                const grouped = allQuestions.reduce((acc, q) => {
                    const category = q.category || 'Uncategorized';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(q);
                    return acc;
                }, {});
                
                const cats = Object.keys(grouped).sort();
                const initialExpanded = {};
                cats.slice(0, 3).forEach(cat => {
                    initialExpanded[cat] = true;
                });
                setExpandedCategories(initialExpanded);
            } catch (err) {
                console.error("Error fetching subject data", err);
                console.error("Error response:", err.response?.data);
                
                // Show specific error message based on error type
                if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                    toast.error("Cannot connect to server. Please ensure the backend is running.");
                } else if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate('/login');
                } else if (err.response?.status === 403) {
                    toast.error("Access denied. You don't have permission to view this subject.");
                    navigate('/teacher');
                } else if (err.response?.data?.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error("Failed to load subject data. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSubjectData();
    }, [user, navigate, decodedSubject, parsedYear, section]);

    const fetchAnalytics = async (examId, examTitle) => {
        try {
            setAnalyticsLoading(true);
            setSelectedExamTitle(examTitle || 'Exam Analytics');
            setSelectedExamId(examId);
            
            // Try to fetch teacher-specific exam analytics first
            let endpoint = `/teacher/exams/${examId}/analytics`;
            let { data } = await API.get(endpoint);
            
            // Check if data exists
            if (!data || data.totalSubmissions === 0) {
                // Fallback to admin endpoint
                try {
                    const adminRes = await API.get(`/admin/analytics/${examId}`);
                    data = adminRes.data;
                } catch (adminErr) {
                    // Ignore and use existing data
                }
            }
            
            if (!data || data.totalSubmissions === 0) {
                toast.error("No data available for this exam yet.");
                return;
            }
            
            // Set analytics data and show modal
            setSelectedExamAnalytics(data);
            // Use studentsSummary (new shape)
            setStudentList(data.studentsSummary || data.students || []);
            setShowAnalyticsModal(true);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            toast.error("No data available for this exam yet.");
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Fetch overall subject analytics
    const fetchSubjectAnalytics = async () => {
        try {
            const url = `/teacher/subject-analytics/${encodeURIComponent(decodedSubject)}/${parsedYear}/${section}`;
            const { data } = await API.get(url);
            
            setSelectedExamAnalytics(data);
            setSelectedExamTitle(`${decodedSubject} - Overall Analytics`);
            // Use new studentsSummary structure
            setStudentList(data.studentsSummary || []);
            setShowAnalyticsModal(true);
        } catch (err) {
            console.error('Subject analytics error:', err);
            toast.error('No subject analytics available');
        }
    };

    // Close analytics modal
    const closeAnalyticsModal = () => {
        setShowAnalyticsModal(false);
        setSelectedExamAnalytics(null);
        setSelectedExamTitle('');
        setStudentList([]);
        setEditingScore(null);
        setNewScore('');
        setSearchTerm('');
        setSelectedExamId(null);
    };

    // Enhanced: Edit score for specific student exam
    const handleEditScore = (studentId, examIndex, currentScore) => {
        setEditingScore({ studentId, examIndex });
        setNewScore(currentScore.toString());
    };

    // Enhanced: Save score for specific exam submission
    const handleSaveScore = async (studentId, submissionId, examIndex) => {
        if (!newScore.trim()) {
            toast.error('Please enter a score');
            return;
        }

        const scoreValue = parseInt(newScore);
        if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
            toast.error('Score must be between 0 and 100');
            return;
        }

        try {
            setUpdatingScore(true);
            const response = await API.put('/teacher/submission/score', {
                submissionId,
                score: scoreValue
            });

            // Update specific exam score in studentList
            setStudentList(prev => prev.map(student => {
                if (student._id === studentId) {
                    const updatedExams = [...student.examsAttempted];
                    updatedExams[examIndex] = {
                        ...updatedExams[examIndex],
                        score: response.data.newPercentage || scoreValue
                    };
                    
                    const newTotal = updatedExams.reduce((sum, e) => sum + e.score, 0);
                    return {
                        ...student,
                        examsAttempted: updatedExams,
                        avgScore: Math.round(newTotal / student.examCount * 10) / 10
                    };
                }
                return student;
            }));

            setEditingScore(null);
            setNewScore('');
            toast.success('Exam score updated successfully');
        } catch (err) {
            console.error('Error updating score:', err);
            toast.error(err.response?.data?.message || 'Failed to update score');
        } finally {
            setUpdatingScore(false);
        }
    };

    // Enhanced filter for students and their exams
    const filteredStudents = studentList.filter(student => {
        const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        
        // If search term in student info, include even if no matching exams
        return true;
    }).map(student => ({
        ...student,
        // Filter exams too for display
        filteredExams: student.examsAttempted.filter(exam => 
            exam.examTitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }));

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
            className="admin-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            {/* Subject Admin Header */}
            <motion.div 
                className="admin-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <button className="back-btn" onClick={() => navigate('/teacher')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="header-icon">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1>{decodedSubject || 'Subject Admin'}</h1>
                        <p>Year {parsedYear} • {section}</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Link to="/teacher/add-question" state={{ subject: decodedSubject, year: parsedYear, section }} className="btn btn-primary">
                        <PlusCircle size={18} />
                        Add Question
                    </Link>
                    <Link to="/teacher/create-exam" state={{ subject: decodedSubject, year: parsedYear, section }} className="btn btn-success">
                        <FileText size={18} />
                        Create Exam
                    </Link>
                </div>
            </motion.div>

            {/* Subject-Specific Stats Cards */}
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
                        <span className="stat-value">{subjectAnalytics?.totalExams || exams.length}</span>
                        <span className="stat-label">Exams</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon success">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectAnalytics?.totalQuestions || questions.length}</span>
                        <span className="stat-label">Questions</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon warning">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectAnalytics?.totalSubmissions || 0}</span>
                        <span className="stat-label">Submissions</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon info">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{subjectAnalytics?.averageScore || 0}%</span>
                        <span className="stat-label">Avg. Score</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <BarChart3 size={18} />
                    Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exams')}
                >
                    <BookOpen size={18} />
                    Exams
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('questions')}
                >
                    <FileText size={18} />
                    Question Bank
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        className="tab-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="content-grid">
                            {/* Recent Exams */}
                            <div className="content-card">
                                <div className="card-header">
                                    <h3>
                                        <BookOpen size={20} />
                                        Recent Exams
                                    </h3>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('exams')}>
                                        View All
                                    </button>
                                </div>
                                <div className="card-list">
                                    {exams.length === 0 ? (
                                        <div className="empty-list">
                                            <AlertCircle size={40} />
                                            <p>No exams created yet</p>
                                        </div>
                                    ) : (
                                        exams.slice(0, 5).map(exam => (
                                            <div key={exam._id} className="list-item">
                                                <div className="item-info">
                                                    <h4>{exam.title}</h4>
                                                    <span className="item-meta">
                                                        <Clock size={14} />
                                                        {exam.duration} mins
                                                    </span>
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => fetchAnalytics(exam._id, exam.title)}
                                                >
                                                    <BarChart3 size={14} />
                                                    Stats
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="content-card">
                                <div className="card-header">
                                    <h3>
                                        <Settings size={20} />
                                        Quick Actions
                                    </h3>
                                </div>
                                <div className="quick-actions">
                                    <Link to="/teacher/add-question" state={{ subject: decodedSubject, year: parsedYear, section }} className="action-btn">
                                        <div className="action-icon primary">
                                            <PlusCircle size={24} />
                                        </div>
                                        <span>Add Question</span>
                                    </Link>
                                    <Link to="/teacher/create-exam" state={{ subject: decodedSubject, year: parsedYear, section }} className="action-btn">
                                        <div className="action-icon success">
                                            <FileText size={24} />
                                        </div>
                                        <span>Create Exam</span>
                                    </Link>
                                    <button 
                                        className="action-btn"
                                        onClick={fetchSubjectAnalytics}
                                        disabled={!subjectAnalytics || subjectAnalytics.totalSubmissions === 0}
                                    >
                                        <div className="action-icon info">
                                            <BarChart3 size={24} />
                                        </div>
                                        <span>View Analytics</span>
                                    </button>
                                    <Link to="/teacher/materials" state={{ subject: decodedSubject, year: parsedYear, section }} className="action-btn">
                                        <div className="action-icon warning">
                                            <Users size={24} />
                                        </div>
                                        <span>Study Materials</span>
                                    </Link>
                                </div>
                                
                                {/* Student Submissions Section in Quick Actions */}
                                {subjectAnalytics?.studentSubmissions && subjectAnalytics.studentSubmissions.length > 0 && (
                                    <div className="quick-student-submissions">
                                        <div className="quick-submissions-header">
                                            <h4>
                                                <Users size={18} />
                                                Recent Student Submissions ({subjectAnalytics.studentSubmissions.length})
                                            </h4>
                                        </div>
                                        <div className="quick-submissions-list">
                                            {subjectAnalytics.studentSubmissions.slice(0, 5).map((submission, idx) => (
                                                <div key={idx} className="quick-submission-item">
                                                    <div className="submission-info">
                                                        <span className="student-name">{submission.studentName}</span>
                                                        <span className="exam-title">{submission.examTitle}</span>
                                                    </div>
                                                    <div className="submission-score">
                                                        <span className={`score-pill ${submission.score >= 70 ? 'good' : submission.score >= 40 ? 'average' : 'poor'}`}>
                                                            {submission.score}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {subjectAnalytics.studentSubmissions.length > 5 && (
                                                <button 
                                                    className="view-more-btn"
                                                    onClick={fetchSubjectAnalytics}
                                                >
                                                    View All Submissions →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'exams' && (
                    <motion.div 
                        key="exams"
                        className="tab-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="content-card full-width">
                            <div className="card-header">
                                <h3>
                                    <BookOpen size={20} />
                                    All Exams ({exams.length})
                                </h3>
                                <Link to="/teacher/create-exam" state={{ subject: decodedSubject, year: parsedYear, section }} className="btn btn-primary btn-sm">
                                    <PlusCircle size={16} />
                                    New Exam
                                </Link>
                            </div>
                            <div className="exams-table">
                                {exams.length === 0 ? (
                                    <div className="empty-list">
                                        <BookOpen size={48} />
                                        <h4>No Exams Yet</h4>
                                        <p>Create your first exam to get started</p>
                                        <Link to="/teacher/create-exam" state={{ subject: decodedSubject, year: parsedYear, section }} className="btn btn-primary">
                                            Create Exam
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Exam Title</th>
                                                    <th>Duration</th>
                                                    <th>Questions</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {exams.map(exam => (
                                                    <tr key={exam._id}>
                                                        <td>
                                                            <div className="exam-title-cell">
                                                                <FileText size={18} />
                                                                <span>{exam.title}</span>
                                                            </div>
                                                        </td>
                                                        <td>{exam.duration} mins</td>
                                                        <td>{exam.questions?.length || 0}</td>
                                                        <td>
                                                            <span className="badge badge-success">Active</span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button 
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => fetchAnalytics(exam._id, exam.title)}
                                                                >
                                                                    <BarChart3 size={14} />
                                                                    Stats
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'questions' && (
                    <motion.div 
                        key="questions"
                        className="tab-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="content-card full-width">
                            <div className="card-header question-bank-header">
                                <div className="header-left">
                                    <FileText size={20} />
                                    <h3>Question Bank</h3>
                                    <span className="total-count">({questions.length} questions)</span>
                                </div>
                                <div className="header-actions">
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={expandAll}
                                    >
                                        <ChevronDown size={14} />
                                        Expand All
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={collapseAll}
                                    >
                                        <ChevronUp size={14} />
                                        Collapse All
                                    </button>
                                    <Link to="/teacher/add-question" state={{ subject: decodedSubject, year: parsedYear, section }} className="btn btn-primary btn-sm">
                                        <PlusCircle size={16} />
                                        Add Question
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Category Tabs */}
                            <div className="category-tabs">
                                <button 
                                    className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    <Folder size={16} />
                                    All ({questions.length})
                                </button>
                                {Object.entries(groupedQuestions).map(([category, catQuestions]) => (
                                    <button 
                                        key={category}
                                        className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            toggleCategory(category);
                                        }}
                                    >
                                        {expandedCategories[category] ? <FolderOpen size={16} /> : <Folder size={16} />}
                                        {category} ({catQuestions.length})
                                    </button>
                                ))}
                            </div>

                            {/* Questions by Category */}
                            <div className="category-questions">
                                {selectedCategory === 'all' ? (
                                    // Show all categories
                                    Object.entries(groupedQuestions).map(([category, catQuestions]) => (
                                        <div key={category} className="category-section">
                                            <div 
                                                className="category-title-bar"
                                                onClick={() => toggleCategory(category)}
                                            >
                                                <div className="category-info">
                                                    {expandedCategories[category] ? (
                                                        <ChevronUp size={20} />
                                                    ) : (
                                                        <ChevronDown size={20} />
                                                    )}
                                                    <FolderOpen size={20} color="#667eea" />
                                                    <span className="category-name">{category}</span>
                                                    <span className="category-badge">{catQuestions.length}</span>
                                                </div>
                                            </div>
                                            {expandedCategories[category] && (
                                                <div className="questions-by-category">
                                                    <div className="questions-grid">
                                                        {catQuestions.map((q, idx) => (
                                                            <div 
                                                                key={q._id}
                                                                className="question-card"
                                                            >
                                                                <div className="question-header">
                                                                    <span className="badge badge-primary">{q.category || 'General'}</span>
                                                                    {q.questionType === 'detailed' && (
                                                                        <span className="badge badge-detailed">Detailed</span>
                                                                    )}
                                                                    {q.image && <ImageIcon size={18} color="#3b82f6" />}
                                                                </div>
                                                                <p className="question-text">{q.questionText}</p>
                                                                <div className="question-options">
                                                                    {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                                                        <span key={i} className={`option-tag ${q.correctAnswer === opt ? 'correct' : ''}`}>
                                                                            {String.fromCharCode(65 + i)}. {opt}
                                                                        </span>
                                                                    ))}
                                                                    {q.questionType === 'detailed' && (
                                                                        <span className="option-tag detailed">
                                                                            Expected: {q.expectedAnswer?.substring(0, 50) || 'See details'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="question-footer">
                                                                    <span className="question-id">#{q._id?.substring(0, 8)}</span>
                                                                    <span className="question-date">
                                                                        {new Date(q.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Show only selected category
                                    <div className="category-section">
                                        <div className="category-section-header">
                                            <FolderOpen size={24} color="#667eea" />
                                            <span className="category-name">{selectedCategory}</span>
                                            <span className="category-badge large">{groupedQuestions[selectedCategory]?.length || 0}</span>
                                        </div>
                                        <div className="questions-grid">
                                            {groupedQuestions[selectedCategory]?.map((q, idx) => (
                                                <motion.div 
                                                    key={q._id}
                                                    className="question-card"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <div className="question-header">
                                                        <span className="badge badge-primary">{q.category || 'General'}</span>
                                                        {q.questionType === 'detailed' && (
                                                                            <span className="badge badge-detailed">Detailed</span>
                                                                        )}
                                                        {q.image && <ImageIcon size={18} color="#3b82f6" />}
                                                    </div>
                                                    <p className="question-text">{q.questionText}</p>
                                                    <div className="question-options">
                                                                        {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                                                            <span key={i} className={`option-tag ${q.correctAnswer === opt ? 'correct' : ''}`}>
                                                                                {String.fromCharCode(65 + i)}. {opt}
                                                                            </span>
                                                                        ))}
                                                                        {q.questionType === 'detailed' && (
                                                                            <span className="option-tag detailed">
                                                                                Expected: {q.expectedAnswer?.substring(0, 50) || 'See details'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="question-footer">
                                                                        <span className="question-id">#{q._id?.substring(0, 8)}</span>
                                                                        <span className="question-date">
                                                                            {new Date(q.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analytics Modal Popup */}
            <AnimatePresence>
                {showAnalyticsModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAnalyticsModal}
                    >
                        <motion.div 
                            className="analytics-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="modal-header">
                                <div className="modal-title">
                                    <BarChart3 size={24} />
                                    <div>
                                        <h2>{selectedExamTitle}</h2>
                                        <p>Exam Performance Analytics</p>
                                    </div>
                                </div>
                                <button className="modal-close" onClick={closeAnalyticsModal}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="modal-content">
                                {analyticsLoading ? (
                                    <div className="modal-loading">
                                        <div className="spinner"></div>
                                        <p>Loading analytics...</p>
                                    </div>
                                ) : selectedExamAnalytics ? (
                                    <>
                                        {/* Key Metrics */}
                                        <div className="analytics-metrics">
                                            <div className="metric-item">
                                                <div className="metric-icon primary">
                                                    <Users size={20} />
                                                </div>
                                                <div className="metric-text">
                                                    <span className="metric-value">{selectedExamAnalytics.totalSubmissions}</span>
                                                    <span className="metric-label">Total Submissions</span>
                                                </div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-icon success">
                                                    <TrendingUp size={20} />
                                                </div>
                                                <div className="metric-text">
                                                    <span className="metric-value">{selectedExamAnalytics.averageScore?.toFixed(1) || 0}%</span>
                                                    <span className="metric-label">Average Score</span>
                                                </div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-icon warning">
                                                    <BarChart3 size={20} />
                                                </div>
                                                <div className="metric-text">
                                                    <span className="metric-value">{selectedExamAnalytics.highestScore || 0}%</span>
                                                    <span className="metric-label">Highest Score</span>
                                                </div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-icon info">
                                                    <Clock size={20} />
                                                </div>
                                                <div className="metric-text">
                                                    <span className="metric-value">{selectedExamAnalytics.lowestScore || 0}%</span>
                                                    <span className="metric-label">Lowest Score</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Charts Section */}
                                        <div className="analytics-charts">
                                            {/* Pass/Fail Pie Chart */}
                                            <div className="chart-card">
                                                <div className="chart-title">
                                                    <PieChart size={18} />
                                                    <span>Pass/Fail Ratio</span>
                                                </div>
                                                <div className="pie-chart-container">
                                                    {(() => {
                                                        const passCount = selectedExamAnalytics.passCount || 0;
                                                        const failCount = (selectedExamAnalytics.totalSubmissions || 0) - passCount;
                                                        const total = passCount + failCount || 1;
                                                        
                                                        return (
                                                            <svg viewBox="0 0 100 100" className="pie-chart">
                                                                <circle 
                                                                    r="25" 
                                                                    cx="50" 
                                                                    cy="50" 
                                                                    fill="transparent"
                                                                    stroke="#22c55e"
                                                                    strokeWidth="50"
                                                                    strokeDasharray={`${(passCount / total) * 157} 157`}
                                                                    strokeDashoffset="0"
                                                                    transform="rotate(-90 50 50)"
                                                                />
                                                                <circle 
                                                                    r="25" 
                                                                    cx="50" 
                                                                    cy="50" 
                                                                    fill="transparent"
                                                                    stroke="#ef4444"
                                                                    strokeWidth="50"
                                                                    strokeDasharray={`${(failCount / total) * 157} 157`}
                                                                    strokeDashoffset={`-${(passCount / total) * 157}`}
                                                                    transform="rotate(-90 50 50)"
                                                                />
                                                            </svg>
                                                        );
                                                    })()}
                                                    <div className="pie-center">
                                                        <span className="total-num">{selectedExamAnalytics.totalSubmissions}</span>
                                                        <span className="total-label">Students</span>
                                                    </div>
                                                </div>
                                                <div className="chart-legend">
                                                    <div className="legend-item">
                                                        <span className="legend-dot pass"></span>
                                                        <span>Pass ({selectedExamAnalytics.passCount})</span>
                                                    </div>
                                                    <div className="legend-item">
                                                        <span className="legend-dot fail"></span>
                                                        <span>Fail {(selectedExamAnalytics.totalSubmissions || 0) - selectedExamAnalytics.passCount}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Distribution Bar Chart */}
                                            <div className="chart-card">
                                                <div className="chart-title">
                                                    <BarChart3 size={18} />
                                                    <span>Score Distribution</span>
                                                </div>
                                                <div className="bar-chart">
                                                    {(() => {
                                                        // Calculate score ranges from individual scores
                                                        const scoreRanges = [
                                                            { label: '0-20%', min: 0, max: 20, count: 0 },
                                                            { label: '21-40%', min: 21, max: 40, count: 0 },
                                                            { label: '41-60%', min: 41, max: 60, count: 0 },
                                                            { label: '61-80%', min: 61, max: 80, count: 0 },
                                                            { label: '81-100%', min: 81, max: 100, count: 0 }
                                                        ];
                                                        
                                                        const scores = selectedExamAnalytics.scoreDistribution || [];
                                                        scores.forEach(score => {
                                                            const range = scoreRanges.find(r => score >= r.min && score <= r.max);
                                                            if (range) range.count++;
                                                        });
                                                        
                                                        const maxCount = Math.max(...scoreRanges.map(r => r.count), 1);
                                                        
                                                        return scoreRanges.map((range, idx) => (
                                                            <div key={idx} className="bar-item">
                                                                <span className="bar-label">{range.label}</span>
                                                                <div className="bar-track">
                                                                    <div 
                                                                        className="bar-fill" 
                                                                        style={{ width: `${(range.count / maxCount) * 100}%` }}
                                                                    >
                                                                        <span className="bar-value">{range.count}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Stats */}
                                        <div className="analytics-stats-row">
                                            <div className="stat-item-inline">
                                                <CheckCircle size={18} className="icon-success" />
                                                <span>Pass: {selectedExamAnalytics.passCount}</span>
                                            </div>
                                            <div className="stat-item-inline">
                                                <XCircle size={18} className="icon-fail" />
                                                <span>Fail: {(selectedExamAnalytics.totalSubmissions || 0) - selectedExamAnalytics.passCount}</span>
                                            </div>
                                            <div className="stat-item-inline">
                                                <TrendingUp size={18} className="icon-pass-rate" />
                                                <span>Pass Rate: {((selectedExamAnalytics.passCount / (selectedExamAnalytics.totalSubmissions || 1)) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="stat-item-inline">
                                                <BarChart3 size={18} className="icon-avg-time" />
                                                <span>Median: {selectedExamAnalytics.medianScore?.toFixed(1) || 0}%</span>
                                            </div>
                                        </div>

                                        {/* Student List Section */}
                                            <div className="student-list-section">
                                                <div className="student-list-header">
                                                    <h3>
                                                        <Users size={20} />
                                                        Student Exam Details ({filteredStudents.length}/{studentList.length})
                                                    </h3>
                                                    <div className="search-box">
                                                        <Search size={16} />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Search students or exams..." 
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="student-table-container">
                                                    {filteredStudents.length === 0 ? (
                                                        <div className="no-students">
                                                            <Users size={40} />
                                                            <p>No students or exams found</p>
                                                        </div>
                                                    ) : (
                                                        <div className="expandable-students">
                                                            {filteredStudents.map((student) => (
                                                                <div key={student._id} className="student-row-wrapper">
                                                                    {/* Student Summary Row */}
                                                                    <div 
                                                                        className="student-summary-row"
                                                                        onClick={() => {
                                                                            setExpandedStudents(prev => ({
                                                                                ...prev,
                                                                                [student._id]: !prev[student._id]
                                                                            }));
                                                                        }}
                                                                    >
                                                                        <div className="student-info-cell">
                                                                            <div className="student-avatar">
                                                                                {student.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <span>{student.name}</span>
                                                                        </div>
                                                                        <div className="cell">{student.email}</div>
                                                                        <div className="cell">
                                                                            <span className={`score-badge ${student.avgScore >= 70 ? 'good' : student.avgScore >= 40 ? 'average' : 'poor'}`}>
                                                                                {student.avgScore}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="cell">{student.examCount} exams</div>
                                                                        <div className="expand-toggle">
                                                                            {expandedStudents[student._id] ? (
                                                                                <ChevronUp size={18} />
                                                                            ) : (
                                                                                <ChevronDown size={18} />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Expanded Exam Details */}
                                                                    {expandedStudents[student._id] && (
                                                                        <div className="student-exams-list">
                                                                            {student.filteredExams.length > 0 ? (
                                                                                student.filteredExams.map((exam, examIndex) => (
                                                                                    <div key={examIndex} className="exam-detail-row">
                                                                                        <div className="exam-title-cell">{exam.examTitle}</div>
                                                                                        <div className="score-cell">
                                                                                            {editingScore?.studentId === student._id && editingScore.examIndex === examIndex ? (
                                                                                                <div className="score-edit">
                                                                                                    <input 
                                                                                                        type="number"
                                                                                                        className="score-input"
                                                                                                        value={newScore}
                                                                                                        onChange={(e) => setNewScore(e.target.value)}
                                                                                                        min="0" max="100"
                                                                                                        disabled={updatingScore}
                                                                                                    />
                                                                                                    <span>%</span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className={`score-badge ${exam.score >= 70 ? 'good' : exam.score >= 40 ? 'average' : 'poor'}`}>
                                                                                                    {exam.score}%
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="date-cell">
                                                                                            {new Date(exam.submittedAt).toLocaleDateString()}
                                                                                        </div>
                                                                                        <div className="actions-cell">
                                                                                            {editingScore?.studentId === student._id && editingScore.examIndex === examIndex ? (
                                                                                                <>
                                                                                                    <button 
                                                                                                        className="btn-icon save"
                                                                                                        onClick={() => handleSaveScore(student._id, exam.submissionId, examIndex)}
                                                                                                        disabled={updatingScore}
                                                                                                    >
                                                                                                        <Save size={14} />
                                                                                                    </button>
                                                                                                    <button 
                                                                                                        className="btn-icon cancel"
                                                                                                        onClick={() => {
                                                                                                            setEditingScore(null);
                                                                                                            setNewScore('');
                                                                                                        }}
                                                                                                        disabled={updatingScore}
                                                                                                    >
                                                                                                        <X size={14} />
                                                                                                    </button>
                                                                                                </>
                                                                                            ) : (
                                                                                                <button 
                                                                                                    className="btn-icon edit"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        handleEditScore(student._id, examIndex, exam.score);
                                                                                                    }}
                                                                                                    title="Edit Score"
                                                                                                >
                                                                                                    <Edit2 size={14} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="no-exams-found">
                                                                                    No matching exams found
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                    </>
                                ) : (
                                    <div className="modal-error">
                                        <AlertCircle size={48} />
                                        <p>No data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .admin-dashboard {
                    min-height: 100vh;
                    background: #f1f5f9;
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
                }

                .admin-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    margin: -2rem -1.5rem 2rem;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: white;
                }

                .header-icon {
                    width: 56px;
                    height: 56px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                .header-content h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                    color: white;
                }

                .header-content p {
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                    font-size: 0.875rem;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                    transform: translateY(-2px);
                }

                .btn-success {
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-success:hover {
                    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .btn-secondary:hover {
                    background: #e2e8f0;
                }

                .btn-sm {
                    padding: 0.5rem 0.875rem;
                    font-size: 0.8rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    padding: 0 1.5rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                }

                .stat-card .stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-card .stat-icon.primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .stat-card .stat-icon.success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .stat-card .stat-icon.warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .stat-card .stat-icon.info {
                    background: #f3e8ff;
                    color: #9333ea;
                }

                .stat-card .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-card .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1;
                }

                .stat-card .stat-label {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 0.25rem;
                }

                .tab-navigation {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0 1.5rem;
                    margin-bottom: 1.5rem;
                    background: white;
                    padding: 0.5rem;
                    border-radius: 12px;
                    width: fit-content;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 10px;
                    transition: all 0.2s;
                }

                .tab-btn:hover {
                    background: #f1f5f9;
                    color: #374151;
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .tab-content {
                    padding: 0 1.5rem;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .content-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e5e7eb;
                }

                .content-card.full-width {
                    grid-column: 1 / -1;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .card-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.125rem;
                    color: #111827;
                    margin: 0;
                }

                .card-list {
                    padding: 1rem;
                }

                .list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 10px;
                    margin-bottom: 0.75rem;
                }

                .list-item:last-child {
                    margin-bottom: 0;
                }

                .item-info h4 {
                    font-size: 1rem;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .item-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .quick-actions {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    padding: 1.5rem;
                }

                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.5rem;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    text-decoration: none;
                    color: #374151;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }

                .action-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-icon.primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .action-icon.success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .action-icon.warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .action-icon.info {
                    background: #f3e8ff;
                    color: #9333ea;
                }

                .action-btn span {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                /* Quick Student Submissions */
                .quick-student-submissions {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #e5e7eb;
                }

                .quick-submissions-header {
                    margin-bottom: 1rem;
                }

                .quick-submissions-header h4 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                    color: #1e293b;
                    margin: 0;
                }

                .quick-submissions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .quick-submission-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .submission-info {
                    display: flex;
                    flex-direction: column;
                }

                .submission-info .student-name {
                    font-weight: 500;
                    color: #1e293b;
                    font-size: 0.875rem;
                }

                .submission-info .exam-title {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .score-pill {
                    padding: 0.25rem 0.625rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .score-pill.good {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .score-pill.average {
                    background: #fef3c7;
                    color: #d97706;
                }

                .score-pill.poor {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .view-more-btn {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: transparent;
                    border: none;
                    color: #667eea;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-align: center;
                    width: 100%;
                }

                .view-more-btn:hover {
                    color: #764ba2;
                }

                .empty-list {
                    text-align: center;
                    padding: 3rem;
                    color: #6b7280;
                }

                .empty-list svg {
                    margin-bottom: 1rem;
                    color: #9ca3af;
                }

                .empty-list h4 {
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .empty-list p {
                    margin-bottom: 1.5rem;
                }

                .exams-table {
                    padding: 1rem;
                }

                .table-responsive {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }

                th {
                    font-weight: 600;
                    color: #6b7280;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                td {
                    color: #374151;
                }

                .exam-title-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 500;
                }

                .badge {
                    display: inline-flex;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .badge-success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .badge-primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .questions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1rem;
                    padding: 1rem;
                }

                .question-card {
                    padding: 1.25rem;
                    background: #f9fafb;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .question-text {
                    font-weight: 500;
                    color: #111827;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .question-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .option-tag {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    background: #e5e7eb;
                    border-radius: 4px;
                    color: #4b5563;
                }

                .option-tag.correct {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .more-questions {
                    text-align: center;
                    padding: 1rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                /* Question Bank Styles */
                .question-bank-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .question-bank-header .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .question-bank-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.25rem;
                    color: #111827;
                    margin: 0;
                }

                .total-count {
                    color: #6b7280;
                    font-size: 0.875rem;
                    font-weight: 400;
                }

                .question-bank-header .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                /* Category Tabs */
                .category-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                }

                .category-tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.813rem;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .category-tab:hover {
                    background: #f1f5f9;
                    border-color: #667eea;
                    color: #667eea;
                }

                .category-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: transparent;
                    color: white;
                }

                /* Category Questions Section */
                .category-questions {
                    padding: 1rem;
                }

                .category-section {
                    margin-bottom: 1rem;
                }

                .category-title-bar {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    background: #f1f5f9;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .category-title-bar:hover {
                    background: #e2e8f0;
                }

                .category-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    color: #374151;
                }

                .category-name {
                    font-weight: 600;
                    color: #111827;
                }

                .category-badge {
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .category-badge.large {
                    font-size: 0.875rem;
                    padding: 0.375rem 0.75rem;
                }

                .category-section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                    border-radius: 10px;
                    margin-bottom: 1rem;
                }

                .category-section-header .category-name {
                    font-size: 1.125rem;
                    color: #667eea;
                }

                .questions-by-category {
                    overflow: hidden;
                }

                /* Enhanced Question Card */
                .question-card {
                    padding: 1.25rem;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    transition: all 0.2s;
                }

                .question-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
                }

                .question-card .question-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }

                .question-card .question-text {
                    font-weight: 500;
                    color: #111827;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .question-card .question-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .question-card .question-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 0.75rem;
                    border-top: 1px solid #f1f5f9;
                }

                .question-id {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    font-family: monospace;
                }

                .question-date {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .badge-detailed {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                }

                .option-tag.detailed {
                    background: #fef3c7;
                    color: #92400e;
                }

                @media (max-width: 768px) {
                    .question-bank-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .question-bank-header .header-actions {
                        width: 100%;
                        flex-wrap: wrap;
                    }

                    .category-tabs {
                        width: 100%;
                        overflow-x: auto;
                        flex-wrap: nowrap;
                        padding: 0.75rem;
                    }

                    .category-tab {
                        flex-shrink: 0;
                        white-space: nowrap;
                    }
                }

                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .admin-header {
                        padding: 1.5rem;
                        margin: -1.5rem -1rem 1.5rem;
                    }

                    .header-content h1 {
                        font-size: 1.25rem;
                    }

                    .header-actions {
                        width: 100%;
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                        padding: 0 1rem;
                    }

                    .tab-navigation {
                        width: 100%;
                        overflow-x: auto;
                        padding: 0.5rem;
                    }

                    .tab-content {
                        padding: 0 1rem;
                    }

                    .quick-actions {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Analytics Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 2rem;
                }

                .analytics-modal {
                    background: white;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .modal-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .modal-title h2 {
                    font-size: 1.25rem;
                    margin: 0;
                    color: white;
                }

                .modal-title p {
                    font-size: 0.875rem;
                    opacity: 0.85;
                    margin: 0;
                }

                .modal-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }

                .modal-content {
                    padding: 2rem;
                    max-height: calc(90vh - 100px);
                    overflow-y: auto;
                }

                .modal-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    gap: 1rem;
                    color: #6b7280;
                }

                .modal-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    gap: 1rem;
                    color: #6b7280;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Analytics Metrics */
                .analytics-metrics {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .metric-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .metric-item .metric-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .metric-item .metric-icon.primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .metric-item .metric-icon.success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .metric-item .metric-icon.warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .metric-item .metric-icon.info {
                    background: #f3e8ff;
                    color: #9333ea;
                }

                .metric-item .metric-text {
                    display: flex;
                    flex-direction: column;
                }

                .metric-item .metric-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1;
                }

                .metric-item .metric-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }

                /* Charts */
                .analytics-charts {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .chart-card {
                    background: #f8fafc;
                    border-radius: 14px;
                    padding: 1.25rem;
                    border: 1px solid #e2e8f0;
                }

                .chart-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: #334155;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }

                .pie-chart-container {
                    position: relative;
                    width: 160px;
                    height: 160px;
                    margin: 0 auto 1rem;
                }

                .pie-chart {
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }

                .pie-center {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .pie-center .total-num {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .pie-center .total-label {
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: #475569;
                }

                .legend-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .legend-dot.pass { background: #22c55e; }
                .legend-dot.fail { background: #ef4444; }

                .bar-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .bar-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .bar-label {
                    width: 65px;
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .bar-track {
                    flex: 1;
                    height: 24px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 0.5rem;
                    min-width: 30px;
                    transition: width 0.5s ease;
                }

                .bar-value {
                    color: white;
                    font-weight: 600;
                    font-size: 0.7rem;
                }

                /* Stats Row */
                .analytics-stats-row {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }

                .stat-item-inline {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: #f1f5f9;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #475569;
                }

                .stat-item-inline .icon-success { color: #16a34a; }
                .stat-item-inline .icon-fail { color: #dc2626; }
                .stat-item-inline .icon-pass-rate { color: #667eea; }
                .stat-item-inline .icon-avg-time { color: #d97706; }

                /* View Students Section */
                .view-students-section {
                    display: flex;
                    justify-content: center;
                    margin: 1.5rem 0;
                }

                .view-students-btn {
                    padding: 0.75rem 1.5rem;
                    font-size: 0.95rem;
                }

                /* Student List Section */
                .student-list-section {
                    margin-top: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 1.5rem;
                }

                .student-list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .student-list-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.1rem;
                    color: #1e293b;
                    margin: 0;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f1f5f9;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .search-box input {
                    border: none;
                    background: transparent;
                    outline: none;
                    font-size: 0.875rem;
                    width: 200px;
                }

                .student-table-container {
                    overflow-x: auto;
                    max-height: 600px;
                    overflow-y: auto;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                }

                /* Expandable Students */
                .expandable-students {
                    width: 100%;
                }

                .student-row-wrapper {
                    border-bottom: 1px solid #f1f5f9;
                    animation: fadeIn 0.2s ease;
                }

                .student-row-wrapper:last-child {
                    border-bottom: none;
                }

                .student-summary-row {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1fr 1fr 0.5fr;
                    align-items: center;
                    padding: 1rem 0.75rem;
                    cursor: pointer;
                    background: white;
                    transition: all 0.2s;
                    gap: 0.5rem;
                }

                .student-summary-row:hover {
                    background: #f8fafc;
                }

                .student-info-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .cell {
                    font-size: 0.875rem;
                    color: #374151;
                }

                .expand-toggle {
                    display: flex;
                    justify-content: center;
                    color: #667eea;
                }

                .student-exams-list {
                    background: #f8fafc;
                    border-top: 1px solid #e5e7eb;
                }

                .exam-detail-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    padding: 0.75rem 1rem;
                    align-items: center;
                    gap: 0.75rem;
                    border-bottom: 1px solid #f0f9ff;
                    font-size: 0.8rem;
                }

                .exam-detail-row:hover {
                    background: white;
                }

                .exam-title-cell {
                    font-weight: 500;
                    color: #1e293b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .no-exams-found {
                    text-align: center;
                    padding: 1.5rem;
                    color: #6b7280;
                    font-style: italic;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Legacy table styles preserved */
                .student-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .student-table thead {
                    background: #f8fafc;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }

                .student-table th {
                    padding: 0.875rem 0.75rem;
                    text-align: left;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 1px solid #e2e8f0;
                    white-space: nowrap;
                }

                .student-table td {
                    padding: 0.75rem;
                    color: #374151;
                    border-bottom: 1px solid #f1f5f9;
                }

                .student-table tbody tr:hover {
                    background: #f8fafc;
                }

                .student-name {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    color: #1e293b;
                }

                .student-name-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .student-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .student-email {
                    color: #64748b;
                    font-size: 0.8rem;
                }

                .score-cell {
                    min-width: 80px;
                }

                .score-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.8rem;
                }

                .score-badge.good {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .score-badge.average {
                    background: #fef3c7;
                    color: #d97706;
                }

                .score-badge.poor {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .score-edit {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .score-input {
                    width: 60px;
                    padding: 0.375rem 0.5rem;
                    border: 2px solid #667eea;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-align: center;
                }

                .score-input:focus {
                    outline: none;
                    border-color: #764ba2;
                }

                .score-suffix {
                    color: #64748b;
                    font-weight: 500;
                }

                .date-cell {
                    color: #64748b;
                    font-size: 0.8rem;
                    white-space: nowrap;
                }

                .actions-cell {
                    min-width: 80px;
                }

                .btn-icon {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    margin-right: 0.25rem;
                }

                .btn-icon.edit {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .btn-icon.edit:hover {
                    background: #dbeafe;
                }

                .btn-icon.save {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .btn-icon.save:hover {
                    background: #bbf7d0;
                }

                .btn-icon.cancel {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .btn-icon.cancel:hover {
                    background: #fecaca;
                }

                .no-students {
                    text-align: center;
                    color: #64748b;
                    padding: 2rem !important;
                }

                /* Responsive Modal */
                @media (max-width: 768px) {
                    .modal-overlay {
                        padding: 1rem;
                    }

                    .analytics-modal {
                        max-height: 95vh;
                    }

                    .modal-header {
                        padding: 1.25rem 1.5rem;
                    }

                    .modal-title h2 {
                        font-size: 1rem;
                    }

                    .modal-content {
                        padding: 1.5rem;
                    }

                    .analytics-metrics {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .analytics-charts {
                        grid-template-columns: 1fr;
                    }

                    .analytics-stats-row {
                        gap: 0.75rem;
                    }

                    .stat-item-inline {
                        font-size: 0.75rem;
                        padding: 0.5rem 0.75rem;
                    }
                }

                /* Back Button */
                .back-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(1.05);
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
            `}</style>
        </motion.div>
    );
};

export default SubjectAdmin;

