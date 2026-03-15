import { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
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
    UserCheck
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
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
    
    // Exam selection modal state
    const [showExamSelectionModal, setShowExamSelectionModal] = useState(false);

    // Group questions by category
    const groupedQuestions = questions.reduce((acc, q) => {
        const category = q.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(q);
        return acc;
    }, {});

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
        // Check if user is logged in and is admin
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchAdminData = async () => {
            try {
                const [qRes, eRes] = await Promise.all([
                    API.get('/admin/questions'),
                    API.get('/student/exams')
                ]);
                setQuestions(qRes.data);
                setExams(eRes.data);
                
                // Auto-expand first few categories
                const cats = Object.keys(groupedQuestions).sort();
                const initialExpanded = {};
                cats.slice(0, 3).forEach(cat => {
                    initialExpanded[cat] = true;
                });
                setExpandedCategories(initialExpanded);
            } catch (err) {
                console.error("Error fetching admin data", err);
                
                // Show specific error message based on error type
                if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                    toast.error("Cannot connect to server. Please ensure the backend is running.");
                } else if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate('/login');
                } else if (err.response?.status === 403) {
                    toast.error("Access denied. Admin privileges required.");
                    navigate('/');
                } else if (err.response?.data?.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error("Failed to load admin data. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, [user, navigate, groupedQuestions]);

    const fetchAnalytics = async (examId, examTitle) => {
        try {
            setAnalyticsLoading(true);
            setSelectedExamTitle(examTitle || 'Exam Analytics');
            
            // Fetch analytics data first
            const { data } = await API.get(`/admin/analytics/${examId}`);
            
            // Check if data exists
            if (!data || data.totalSubmissions === 0) {
                toast.error("No data available for this exam yet.");
                return;
            }
            
            // Set analytics data and show modal
            setSelectedExamAnalytics(data);
            setShowAnalyticsModal(true);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            toast.error("No data available for this exam yet.");
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Close analytics modal
    const closeAnalyticsModal = () => {
        setShowAnalyticsModal(false);
        setSelectedExamAnalytics(null);
        setSelectedExamTitle('');
    };

    // Open exam selection modal for analytics
    const openExamSelectionModal = () => {
        console.log('Opening exam selection modal, exams:', exams.length);
        setShowExamSelectionModal(true);
    };

    // Close exam selection modal
    const closeExamSelectionModal = () => {
        setShowExamSelectionModal(false);
    };

    // Handle exam selection for analytics
    const handleExamSelectForAnalytics = async (exam) => {
        setShowExamSelectionModal(false);
        await fetchAnalytics(exam._id, exam.title);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading Admin Dashboard...</p>
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
            
            {/* Admin Header */}
            <motion.div 
                className="admin-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="header-content">
                    <div className="header-icon">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h1>Admin Command Center</h1>
                        <p>Manage your exams and question bank</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Link to="/admin/add-question" className="btn btn-primary">
                        <PlusCircle size={18} />
                        Add Question
                    </Link>
                    <Link to="/admin/create-exam" className="btn btn-success">
                        <FileText size={18} />
                        Create Exam
                    </Link>
                </div>
            </motion.div>

            {/* Stats Cards */}
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
                        <span className="stat-value">{exams.length}</span>
                        <span className="stat-label">Active Exams</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon success">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{questions.length}</span>
                        <span className="stat-label">Questions</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon warning">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{questions.length * 5 || 0}</span>
                        <span className="stat-label">Total Submissions</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon info">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">85%</span>
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
                                    <Link to="/admin/add-question" className="action-btn">
                                        <div className="action-icon primary">
                                            <PlusCircle size={24} />
                                        </div>
                                        <span>Add Question</span>
                                    </Link>
                                    <Link to="/admin/create-exam" className="action-btn">
                                        <div className="action-icon success">
                                            <FileText size={24} />
                                        </div>
                                        <span>Create Exam</span>
                                    </Link>
                                    <Link 
                                        to="#" 
                                        className="action-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            openExamSelectionModal();
                                        }}
                                    >
                                        <div className="action-icon info">
                                            <BarChart3 size={24} />
                                        </div>
                                        <span>View Analytics</span>
                                    </Link>
                                    <Link to="/admin/view-students" className="action-btn">
                                        <div className="action-icon warning">
                                            <Users size={24} />
                                        </div>
                                        <span>View Students</span>
                                    </Link>
                                </div>
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
                                <Link to="/admin/create-exam" className="btn btn-primary btn-sm">
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
                                        <Link to="/admin/create-exam" className="btn btn-primary">
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
                                    <Link to="/admin/add-question" className="btn btn-primary btn-sm">
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

            {/* Exam Selection Modal for Analytics */}
            <AnimatePresence>
                {showExamSelectionModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeExamSelectionModal}
                    >
                        <motion.div 
                            className="exam-selection-modal"
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
                                        <h2>Select Exam for Analytics</h2>
                                        <p>Choose an exam to view its performance data</p>
                                    </div>
                                </div>
                                <button className="modal-close" onClick={closeExamSelectionModal}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="modal-content">
                                {exams.length === 0 ? (
                                    <div className="no-exams-message">
                                        <AlertCircle size={48} />
                                        <h3>No Exams Available</h3>
                                        <p>Create an exam first to view analytics</p>
                                        <Link to="/admin/create-exam" className="btn btn-primary" onClick={closeExamSelectionModal}>
                                            <PlusCircle size={18} />
                                            Create Exam
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="exam-selection-list">
                                        {exams.map(exam => (
                                            <div 
                                                key={exam._id} 
                                                className="exam-selection-item"
                                                onClick={() => handleExamSelectForAnalytics(exam)}
                                            >
                                                <div className="exam-icon">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="exam-details">
                                                    <h4>{exam.title}</h4>
                                                    <div className="exam-meta">
                                                        <span>
                                                            <Clock size={14} />
                                                            {exam.duration} mins
                                                        </span>
                                                        <span>
                                                            <FileText size={14} />
                                                            {exam.questions?.length || 0} questions
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="view-analytics-btn">
                                                    <BarChart3 size={16} />
                                                    View Analytics
                                                </button>
                                            </div>
                                        ))}
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

                /* Exam Selection Modal Styles */
                .exam-selection-modal {
                    background: white;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                .no-exams-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    text-align: center;
                    color: #64748b;
                }

                .no-exams-message h3 {
                    margin: 1rem 0 0.5rem;
                    color: #334155;
                }

                .no-exams-message p {
                    margin-bottom: 1.5rem;
                }

                .exam-selection-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .exam-selection-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .exam-selection-item:hover {
                    background: #f1f5f9;
                    border-color: #667eea;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .exam-selection-item .exam-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }

                .exam-selection-item .exam-details {
                    flex: 1;
                    min-width: 0;
                }

                .exam-selection-item .exam-details h4 {
                    font-size: 1rem;
                    color: #1e293b;
                    margin: 0 0 0.375rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .exam-selection-item .exam-meta {
                    display: flex;
                    gap: 1rem;
                    color: #64748b;
                    font-size: 0.8rem;
                }

                .exam-selection-item .exam-meta span {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .view-analytics-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.813rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .view-analytics-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                /* Disabled state for action-btn */
                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .action-btn:disabled:hover {
                    background: #f9fafb;
                    transform: none;
                    box-shadow: none;
                }
            `}</style>
        </motion.div>
    );
};

export default AdminDashboard;

