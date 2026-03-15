import { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    Users,
    FileText,
    BarChart3,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    X,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Download,
    RefreshCw,
    Award,
    TrendingUp,
    PieChart,
    List,
    ArrowUpDown,
    Calendar,
    Mail
} from 'lucide-react';

const ViewStudents = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExam, setSelectedExam] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [submissionDetails, setSubmissionDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [exams, setExams] = useState([]);
    const [stats, setStats] = useState(null);
    const [viewMode, setViewMode] = useState('students'); // 'students' or 'submissions'

    // Group submissions by student
    const getStudentsData = () => {
        const studentMap = {};
        
        submissions.forEach(sub => {
            const studentId = sub.student?._id;
            if (!studentId) return;
            
            if (!studentMap[studentId]) {
                studentMap[studentId] = {
                    student: sub.student,
                    submissions: [],
                    totalAttempts: 0,
                    scores: [],
                    completedExams: new Set(),
                    firstAttempt: sub.createdAt,
                    lastAttempt: sub.createdAt
                };
            }
            
            const student = studentMap[studentId];
            student.submissions.push(sub);
            student.totalAttempts++;
            if (sub.scorePercentage > 0) {
                student.scores.push(sub.scorePercentage);
            }
            if (sub.status === 'Completed') {
                student.completedExams.add(sub.exam?._id);
            }
            if (new Date(sub.createdAt) < new Date(student.firstAttempt)) {
                student.firstAttempt = sub.createdAt;
            }
            if (new Date(sub.createdAt) > new Date(student.lastAttempt)) {
                student.lastAttempt = sub.createdAt;
            }
        });
        
        return Object.values(studentMap).map(s => ({
            student: s.student,
            totalAttempts: s.totalAttempts,
            examsCompleted: s.completedExams.size,
            averageScore: s.scores.length > 0 
                ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) 
                : 0,
            bestScore: s.scores.length > 0 ? Math.max(...s.scores) : 0,
            firstAttempt: s.firstAttempt,
            lastAttempt: s.lastAttempt
        }));
    };

    // Check if user is admin
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!user.isAdmin) {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/admin/all-submissions');
            setSubmissions(data);
            
            // Get unique exams for filter
            const uniqueExams = [...new Set(data.map(s => s.exam?._id))].filter(Boolean);
            const examOptions = data.map(s => ({
                _id: s.exam?._id,
                title: s.exam?.title
            })).filter((v, i, a) => a.findIndex(t => t._id === v._id) === i);
            setExams(examOptions);
            
            // Calculate overall stats
            calculateStats(data);
        } catch (err) {
            console.error("Error fetching submissions:", err);
            if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate('/login');
            } else if (err.response?.status === 403) {
                toast.error("Access denied. Admin privileges required.");
                navigate('/');
            } else {
                toast.error("Failed to load student submissions");
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalSubmissions = data.length;
        const completedSubmissions = data.filter(s => s.status === 'Completed').length;
        const terminatedSubmissions = data.filter(s => s.status === 'Terminated').length;
        
        // Use scorePercentage for calculations
        const scores = data.filter(s => s.scorePercentage > 0).map(s => s.scorePercentage);
        const averageScore = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        
        const uniqueStudents = [...new Set(data.map(s => s.student?._id))].filter(Boolean).length;
        
        setStats({
            totalSubmissions,
            completedSubmissions,
            terminatedSubmissions,
            averageScore,
            highestScore,
            lowestScore,
            uniqueStudents
        });
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissionDetails = async (submissionId) => {
        setDetailsLoading(true);
        try {
            // Get the submission details - we'll need to get exam details to analyze questions
            const submission = submissions.find(s => s._id === submissionId);
            if (submission) {
                // For now, show submission details without question-level analysis
                // (Question analysis requires more complex backend endpoint)
                setSubmissionDetails(submission);
                setShowModal(true);
            }
        } catch (err) {
            console.error("Error loading details:", err);
            toast.error("Failed to load submission details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const openDetails = (submission) => {
        setSelectedSubmission(submission);
        fetchSubmissionDetails(submission._id);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSubmission(null);
        setSubmissionDetails(null);
    };

    // Filter and sort submissions
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = !searchTerm || 
            sub.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesExam = selectedExam === 'all' || sub.exam?._id === selectedExam;
        const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
        
        return matchesSearch && matchesExam && matchesStatus;
    }).sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'date':
                comparison = new Date(b.createdAt) - new Date(a.createdAt);
                break;
            case 'score':
                comparison = b.scorePercentage - a.scorePercentage;
                break;
            case 'name':
                comparison = (a.student?.name || '').localeCompare(b.student?.name || '');
                break;
            default:
                comparison = 0;
        }
        return sortOrder === 'desc' ? comparison : -comparison;
    });

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        return 'poor';
    };

    const getStatusBadge = (status) => {
        if (status === 'Completed') {
            return <span className="badge badge-success">Completed</span>;
        }
        return <span className="badge badge-danger">Terminated</span>;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading student data...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="view-students-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <motion.div 
                className="page-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="header-content">
                    <div className="header-icon">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1>View Students</h1>
                        <p>View student performance and their exam attempts</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={fetchSubmissions}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* Stats Overview */}
            {stats && (
                <motion.div 
                    className="stats-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className="stat-card" variants={itemVariants}>
                        <div className="stat-icon primary">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.uniqueStudents}</span>
                            <span className="stat-label">Unique Students</span>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                        <div className="stat-icon success">
                            <FileText size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.totalSubmissions}</span>
                            <span className="stat-label">Total Attempts</span>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                        <div className="stat-icon warning">
                            <Award size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.averageScore}%</span>
                            <span className="stat-label">Average Score</span>
                        </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                        <div className="stat-icon info">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.highestScore}%</span>
                            <span className="stat-label">Highest Score</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Filters and Search */}
            <motion.div 
                className="filters-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="search-box">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by student name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-group">
                    <select 
                        value={selectedExam} 
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Exams</option>
                        {exams.map(exam => (
                            <option key={exam._id} value={exam._id}>
                                {exam.title}
                            </option>
                        ))}
                    </select>
                    
                    <select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Terminated">Terminated</option>
                    </select>
                    
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="score">Sort by Score</option>
                        <option value="name">Sort by Name</option>
                    </select>
                    
                    <button 
                        className="sort-btn"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'desc' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                </div>
            </motion.div>

            {/* Submissions/Students Table */}
            <motion.div 
                className="submissions-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="section-header">
                    <h2>
                        {viewMode === 'students' ? (
                            <><Users size={20} /> Unique Students ({getStudentsData().filter(s => !searchTerm || s.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())).length})</>
                        ) : (
                            <><FileText size={20} /> All Submissions ({filteredSubmissions.length})</>
                        )}
                    </h2>
                </div>

                {/* Unique Students Table */}
                {viewMode === 'students' ? (
                (() => {
                        const studentsData = getStudentsData().filter(s =>
                            !searchTerm || 
                            s.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).sort((a, b) => {
                            let comparison = 0;
                            switch (sortBy) {
                                case 'date':
                                    comparison = new Date(b.lastAttempt) - new Date(a.lastAttempt);
                                    break;
                                case 'score':
                                    comparison = b.averageScore - a.averageScore;
                                    break;
                                case 'name':
                                    comparison = (a.student?.name || '').localeCompare(b.student?.name || '');
                                    break;
                                default:
                                    comparison = 0;
                            }
                            return sortOrder === 'desc' ? comparison : -comparison;
                        });

                        return studentsData.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <h3>No Students Found</h3>
                                <p>No students match your search</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="submissions-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Attempts</th>
                                            <th>Exams Completed</th>
                                            <th>Average Score</th>
                                            <th>Best Score</th>
                                            <th>Last Attempt</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsData.map((student, index) => (
                                            <motion.tr 
                                                key={student.student?._id || index}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                transition={{ delay: index * 0.02 }}
                                            >
                                                <td>
                                                    <div className="student-cell">
                                                        <div className="student-avatar">
                                                            {student.student?.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="student-info">
                                                            <span className="student-name">{student.student?.name || 'Unknown'}</span>
                                                            <span className="student-email">{student.student?.email || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="attempts-badge">{student.totalAttempts}</span>
                                                </td>
                                                <td>
                                                    <span className="exam-count">{student.examsCompleted}</span>
                                                </td>
                                                <td>
                                                    <div className={`score-cell ${getScoreColor(student.averageScore)}`}>
                                                        <span className="score-value">{student.averageScore}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`score-cell ${getScoreColor(student.bestScore)}`}>
                                                        <span className="score-value">{student.bestScore}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="date-cell">
                                                        <Calendar size={14} />
                                                        {new Date(student.lastAttempt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            // Switch to submissions view filtered by this student first
                                                            setSearchTerm(student.student?.email || '');
                                                            setViewMode('submissions');
                                                            
                                                            // Show toast notification instead of native alert
                                                            toast.success(`Student: ${student.student?.name}\nEmail: ${student.student?.email}\nAttempts: ${student.totalAttempts}\nExams Completed: ${student.examsCompleted}`, {
                                                                duration: 3000,
                                                            });
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()
                ) : (
                    // Submissions View (original)
                    filteredSubmissions.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>No Submissions Found</h3>
                            <p>No student submissions match your filters</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="submissions-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Exam</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                        <th>Tab Switches</th>
                                        <th>Warnings</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubmissions.map((sub, index) => (
                                        <motion.tr 
                                            key={sub._id}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            transition={{ delay: index * 0.02 }}
                                        >
                                            <td>
                                                <div className="student-cell">
                                                    <div className="student-avatar">
                                                        {sub.student?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="student-info">
                                                        <span className="student-name">{sub.student?.name || 'Unknown'}</span>
                                                        <span className="student-email">{sub.student?.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="exam-title">{sub.exam?.title || 'Unknown Exam'}</span>
                                            </td>
                                            <td>
                                                <div className={`score-cell ${getScoreColor(sub.scorePercentage)}`}>
                                                    <span className="score-value">{sub.scorePercentage}%</span>
                                                    <span className="score-points">({sub.score}/{sub.totalPoints})</span>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(sub.status)}</td>
                                            <td>
                                                <span className={`tab-switches ${sub.tabSwitches > 0 ? 'warning' : ''}`}>
                                                    {sub.tabSwitches}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`warnings ${sub.warningCount > 0 ? 'warning' : ''}`}>
                                                    {sub.warningCount}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="date-cell">
                                                    <Calendar size={14} />
                                                    {new Date(sub.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => openDetails(sub)}
                                                        disabled={detailsLoading && selectedSubmission?._id === sub._id}
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => navigate(`/admin/submission/${sub._id}`)}
                                                        title="View & Grade Submission"
                                                    >
                                                        <Award size={14} />
                                                        Grade
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </motion.div>

            {/* Detailed Modal */}
            <AnimatePresence>
                {showModal && submissionDetails && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div 
                            className="detail-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Submission Details</h2>
                                <button className="close-btn" onClick={closeModal}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-content">
                                {/* Student Info */}
                                <div className="detail-section">
                                    <h3><Users size={18} /> Student Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Name</span>
                                            <span className="detail-value">{submissionDetails.student?.name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">{submissionDetails.student?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Exam Info */}
                                <div className="detail-section">
                                    <h3><FileText size={18} /> Exam Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Exam Title</span>
                                            <span className="detail-value">{submissionDetails.exam?.title}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Status</span>
                                            <span className="detail-value">{getStatusBadge(submissionDetails.status)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Score Info */}
                                <div className="detail-section">
                                    <h3><BarChart3 size={18} /> Performance</h3>
                                    <div className="score-overview">
                                        <div className={`big-score-card ${getScoreColor(submissionDetails.scorePercentage)}`}>
                                            <span className="big-score">{submissionDetails.scorePercentage}%</span>
                                            <span className="score-label">Score</span>
                                        </div>
                                        <div className="score-breakdown">
                                            <div className="breakdown-item">
                                                <span className="breakdown-label">Marks Obtained</span>
                                                <span className="breakdown-value">{submissionDetails.score}/{submissionDetails.totalPoints}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="breakdown-label">Tab Switches</span>
                                                <span className="breakdown-value warning">{submissionDetails.tabSwitches}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span className="breakdown-label">Warnings</span>
                                                <span className="breakdown-value warning">{submissionDetails.warningCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="detail-section">
                                    <h3><Clock size={18} /> Timeline</h3>
                                    <div className="timeline">
                                        <div className="timeline-item">
                                            <span className="timeline-label">Submitted At</span>
                                            <span className="timeline-value">
                                                {new Date(submissionDetails.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .view-students-page {
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

                .loading-container p {
                    color: #6b7280;
                }

                /* Header */
                .page-header {
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
                    gap: 1.5rem;
                    color: white;
                }

                .header-icon {
                    width: 64px;
                    height: 64px;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    margin-bottom: 0.25rem;
                    color: white;
                }

                .page-header p {
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                }

                /* Buttons */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    text-decoration: none;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-primary:hover {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                .btn-sm {
                    padding: 0.5rem 0.875rem;
                    font-size: 0.813rem;
                }

                .btn-success {
                    background: #22c55e;
                    color: white;
                }

                .btn-success:hover {
                    background: #16a34a;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                /* Stats Grid */
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
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-card .stat-icon.primary { background: #dbeafe; color: #2563eb; }
                .stat-card .stat-icon.success { background: #dcfce7; color: #16a34a; }
                .stat-card .stat-icon.warning { background: #fef3c7; color: #d97706; }
                .stat-card .stat-icon.info { background: #f3e8ff; color: #9333ea; }

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

                /* Filters */
                .filters-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    padding: 0 1.5rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    flex: 1;
                    max-width: 400px;
                }

                .search-box svg {
                    color: #9ca3af;
                }

                .search-box input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 0.938rem;
                    background: transparent;
                }

                .filter-group {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }

                /* View Toggle */
                .view-toggle {
                    display: flex;
                    gap: 0.25rem;
                    background: white;
                    padding: 0.25rem;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }

                .toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 500;
                    font-size: 0.875rem;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .toggle-btn:hover {
                    background: #f1f5f9;
                    color: #374151;
                }

                .toggle-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .attempts-badge, .exam-count {
                    display: inline-flex;
                    padding: 0.375rem 0.75rem;
                    border-radius: 8px;
                    font-weight: 600;
                    background: #f1f5f9;
                    color: #475569;
                    font-size: 0.875rem;
                }

                .filter-select {
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    font-size: 0.875rem;
                    cursor: pointer;
                    min-width: 140px;
                }

                .sort-btn {
                    padding: 0.75rem;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sort-btn:hover {
                    background: #f1f5f9;
                }

                /* Submissions Table */
                .submissions-section {
                    padding: 0 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .section-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.25rem;
                    color: #111827;
                }

                .table-container {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .submissions-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .submissions-table th,
                .submissions-table td {
                    padding: 1rem;
                    text-align: left;
                    border-bottom: 1px solid #f1f5f9;
                }

                .submissions-table th {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #64748b;
                    font-size: 0.813rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .submissions-table tbody tr:hover {
                    background: #f8fafc;
                }

                /* Student Cell */
                .student-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .student-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .student-info {
                    display: flex;
                    flex-direction: column;
                }

                .student-name {
                    font-weight: 600;
                    color: #111827;
                }

                .student-email {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .exam-title {
                    font-weight: 500;
                    color: #374151;
                }

                .score-cell {
                    display: flex;
                    flex-direction: column;
                }

                .score-cell .score-value {
                    font-weight: 700;
                    font-size: 1rem;
                }

                .score-cell .score-points {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

                .score-cell.excellent .score-value { color: #16a34a; }
                .score-cell.good .score-value { color: #2563eb; }
                .score-cell.average .score-value { color: #d97706; }
                .score-cell.poor .score-value { color: #dc2626; }

                .badge {
                    display: inline-flex;
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .badge-success {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .badge-danger {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .tab-switches, .warnings {
                    display: inline-flex;
                    padding: 0.25rem 0.625rem;
                    border-radius: 6px;
                    font-weight: 600;
                    background: #f1f5f9;
                    color: #64748b;
                }

                .tab-switches.warning, .warnings.warning {
                    background: #fef3c7;
                    color: #d97706;
                }

                .date-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    font-size: 0.875rem;
                }

                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .empty-state svg {
                    margin-bottom: 1rem;
                    color: #9ca3af;
                }

                .empty-state h3 {
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #6b7280;
                }

                /* Modal */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(4px);
                    padding: 1rem;
                }

                .detail-modal {
                    background: white;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .modal-header h2 {
                    font-size: 1.25rem;
                    color: #111827;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                }

                .close-btn:hover {
                    background: #f1f5f9;
                    color: #111827;
                }

                .modal-content {
                    padding: 1.5rem;
                }

                .detail-section {
                    margin-bottom: 1.5rem;
                }

                .detail-section h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1rem;
                    color: #374151;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .detail-label {
                    font-size: 0.75rem;
                    color: #9ca3af;
                    text-transform: uppercase;
                }

                .detail-value {
                    font-weight: 500;
                    color: #111827;
                }

                .score-overview {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }

                .big-score-card {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .big-score-card.excellent { background: linear-gradient(135deg, #dcfce7, #22c55e); }
                .big-score-card.good { background: linear-gradient(135deg, #dbeafe, #3b82f6); }
                .big-score-card.average { background: linear-gradient(135deg, #fef3c7, #f59e0b); }
                .big-score-card.poor { background: linear-gradient(135deg, #fee2e2, #ef4444); }

                .big-score {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                }

                .score-label {
                    font-size: 0.625rem;
                    color: rgba(255, 255, 255, 0.8);
                    text-transform: uppercase;
                }

                .score-breakdown {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .breakdown-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0.75rem;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .breakdown-label {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .breakdown-value {
                    font-weight: 600;
                    color: #111827;
                }

                .breakdown-value.warning {
                    color: #d97706;
                }

                .timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .timeline-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.75rem;
                    background: #f8fafc;
                    border-radius: 8px;
                }

                .timeline-label {
                    color: #64748b;
                }

                .timeline-value {
                    font-weight: 500;
                    color: #111827;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .page-header {
                        padding: 1.5rem;
                        margin: -1.5rem -1rem 1.5rem;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                        padding: 0 1rem;
                    }

                    .filters-section {
                        flex-direction: column;
                        padding: 0 1rem;
                    }

                    .search-box {
                        max-width: 100%;
                    }

                    .submissions-section {
                        padding: 0 1rem;
                        overflow-x: auto;
                    }

                    .table-container {
                        min-width: 800px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default ViewStudents;

