import { useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    Trophy, 
    Clock, 
    Target, 
    TrendingUp,
    ChevronRight,
    Award,
    Zap,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    PieChart,
    List,
    X,
    ArrowLeft,
    Eye
} from 'lucide-react';
// import GradeBadge from '../components/GradeBadge.jsx';

const Results = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);
    const [resultDetails, setResultDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // Redirect admin users away from results page
    useEffect(() => {
        if (user?.isAdmin) {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data } = await API.get('/student/my-results');
                setHistory(data);
            } catch (err) {
                console.error("Error loading results:", err);
                if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                    toast.error("Cannot connect to server. Please ensure the backend is running.");
                } else if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate('/login');
                } else if (err.response?.data?.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error("Failed to load results");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    const fetchResultDetails = async (resultId) => {
        setDetailsLoading(true);
        try {
            const { data } = await API.get(`/student/my-results/${resultId}`);
            setResultDetails(data);
            setShowModal(true);
        } catch (err) {
            console.error("Error loading result details:", err);
            toast.error("Failed to load result details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const openResultDetails = (result) => {
        setSelectedResult(result);
        fetchResultDetails(result._id);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedResult(null);
        setResultDetails(null);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        return 'poor';
    };

    const getScoreMessage = (percentage, score, totalPoints) => {
        if (percentage >= 80) return { text: 'Excellent! 🎉', color: '#16a34a' };
        if (percentage >= 60) return { text: 'Good Job! 👍', color: '#2563eb' };
        if (percentage >= 40) return { text: 'Keep Trying! 💪', color: '#d97706' };
        return { text: `${score}/${totalPoints} Marks`, color: '#dc2626' };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading your results...</p>
            </div>
        );
    }

    // Calculate stats - convert raw marks to percentage
    const calculatePercentage = (score, totalPoints) => {
        if (!totalPoints || totalPoints === 0) return 0;
        return Math.round((score / totalPoints) * 100);
    };

    const averageScore = history.length > 0 
        ? Math.round(history.reduce((acc, r) => acc + calculatePercentage(r.score || 0, r.totalPoints || 1), 0) / history.length)
        : 0;
    const bestScore = history.length > 0 
        ? Math.max(...history.map(r => calculatePercentage(r.score || 0, r.totalPoints || 1))) 
        : 0;
    const totalExams = history.length;

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
            className="results-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            {/* Page Header */}
            <motion.div 
                className="results-header"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="header-content">
                    <div className="header-icon">
                        <Trophy size={32} />
                    </div>
                    <div>
                        <h1>Your Performance</h1>
                        <p>Track your progress and achievements</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div 
                className="stats-overview"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon primary">
                        <Target size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{averageScore}%</span>
                        <span className="stat-label">Average Score</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon success">
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{bestScore}%</span>
                        <span className="stat-label">Best Score</span>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={itemVariants}>
                    <div className="stat-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalExams}</span>
                        <span className="stat-label">Exams Completed</span>
                    </div>
                </motion.div>
            </motion.div>

            {/* Results List */}
            <div className="results-container">
                <h2 className="section-title">Assessment History</h2>
                
                {history.length === 0 ? (
                    <motion.div 
                        className="empty-state"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="empty-icon">
                            <Zap size={48} />
                        </div>
                        <h3>No Results Yet</h3>
                        <p>Complete your first assessment to see your performance here</p>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Take an Exam
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        className="results-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
{history.map((result, index) => {
                            const percentage = calculatePercentage(result.score || 0, result.totalPoints || 1);
                            const scoreColor = getScoreColor(percentage);
                            const scoreMessage = getScoreMessage(percentage, result.score, result.totalPoints);
                            const grade = percentage >= 90 ? 'a' : percentage >= 80 ? 'b' : percentage >= 70 ? 'c' : percentage >= 60 ? 'd' : 'f';
                            
                            return (
                                <motion.div 
                                    key={result._id}
                                    className="result-card"
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                >
                                    <div className="result-header">
                                        <div className={`score-circle ${scoreColor}`}>
                                            <span className="score-value">{percentage}%</span>
                                        </div>
                                        <div className="result-meta">
                                            <span className="score-badge" style={{ backgroundColor: scoreMessage.color }}>
                                                {scoreMessage.text}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="result-body">
                                        <h3 className="exam-title">{result.exam?.title || 'Assessment'}</h3>
                                        
<div className="result-details">
                                            <div className="detail-row">
                                                <Clock size={16} />
                                                <span>{new Date(result.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}</span>
                                            </div>
                                            <div className="detail-row">
                                                <Target size={16} />
                                                <span>Score: {percentage}%</span>
                                            </div>
                                            {result.tabSwitches > 0 && (
                                                <div className="detail-row warning">
                                                    <Zap size={16} />
                                                    <span>Tab switches: {result.tabSwitches}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

<div className="result-footer">
                                        <div className={`performance-bar ${scoreColor}`}>
                                            <div 
                                                className="performance-fill" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="result-actions">
                                            <button 
                                                className="view-details-btn"
                                                onClick={() => openResultDetails(result)}
                                                disabled={detailsLoading && selectedResult?._id === result._id}
                                            >
                                                <Eye size={16} />
                                                {detailsLoading && selectedResult?._id === result._id ? 'Loading...' : 'View Details'}
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Detailed Result Modal */}
            <AnimatePresence>
                {showModal && resultDetails && (
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
                                <button className="back-btn" onClick={closeModal}>
                                    <ArrowLeft size={20} />
                                </button>
                                <h2>{resultDetails.exam?.title || 'Assessment'} - Detailed Results</h2>
                                <button className="close-btn" onClick={closeModal}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-content">
                                {/* Score Overview */}
                                <div className="score-overview">
                                    <div className="score-card">
                                        <div className={`big-score-circle ${getScoreColor(resultDetails.statistics.percentage)}`}>
                                            <span className="big-score">{resultDetails.statistics.percentage}%</span>
                                            <span className="score-label">Score</span>
                                        </div>
                                    </div>
                                    
                                    <div className="score-stats">
                                        <div className="score-stat correct">
                                            <CheckCircle size={24} />
                                            <div className="stat-content">
                                                <span className="stat-number">{resultDetails.statistics.correctAnswers}</span>
                                                <span className="stat-text">Correct</span>
                                            </div>
                                        </div>
                                        <div className="score-stat wrong">
                                            <XCircle size={24} />
                                            <div className="stat-content">
                                                <span className="stat-number">{resultDetails.statistics.wrongAnswers}</span>
                                                <span className="stat-text">Wrong</span>
                                            </div>
                                        </div>
                                        <div className="score-stat skipped">
                                            <AlertCircle size={24} />
                                            <div className="stat-content">
                                                <span className="stat-number">{resultDetails.statistics.skippedQuestions}</span>
                                                <span className="stat-text">Skipped</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pie Chart */}
                                <div className="chart-section">
                                    <h3><PieChart size={20} /> Performance Breakdown</h3>
                                    <div className="pie-chart-container">
                                        <svg viewBox="0 0 100 100" className="pie-chart">
                                            {/* Correct - Green */}
                                            <circle 
                                                r="25" 
                                                cx="50" 
                                                cy="50" 
                                                fill="transparent"
                                                stroke="#22c55e"
                                                strokeWidth="50"
                                                strokeDasharray={`${(resultDetails.statistics.correctAnswers / resultDetails.statistics.totalQuestions) * 157} 157`}
                                                strokeDashoffset="0"
                                                transform="rotate(-90 50 50)"
                                            />
                                            {/* Wrong - Red */}
                                            <circle 
                                                r="25" 
                                                cx="50" 
                                                cy="50" 
                                                fill="transparent"
                                                stroke="#ef4444"
                                                strokeWidth="50"
                                                strokeDasharray={`${(resultDetails.statistics.wrongAnswers / resultDetails.statistics.totalQuestions) * 157} 157`}
                                                strokeDashoffset={`-${(resultDetails.statistics.correctAnswers / resultDetails.statistics.totalQuestions) * 157}`}
                                                transform="rotate(-90 50 50)"
                                            />
                                            {/* Skipped - Gray */}
                                            <circle 
                                                r="25" 
                                                cx="50" 
                                                cy="50" 
                                                fill="transparent"
                                                stroke="#9ca3af"
                                                strokeWidth="50"
                                                strokeDasharray={`${(resultDetails.statistics.skippedQuestions / resultDetails.statistics.totalQuestions) * 157} 157`}
                                                strokeDashoffset={`-${((resultDetails.statistics.correctAnswers + resultDetails.statistics.wrongAnswers) / resultDetails.statistics.totalQuestions) * 157}`}
                                                transform="rotate(-90 50 50)"
                                            />
                                        </svg>
                                        <div className="pie-center">
                                            <span className="total-num">{resultDetails.statistics.totalQuestions}</span>
                                            <span className="total-label">Questions</span>
                                        </div>
                                    </div>
                                    <div className="chart-legend">
                                        <div className="legend-item">
                                            <span className="legend-dot correct"></span>
                                            <span>Correct ({resultDetails.statistics.correctAnswers})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot wrong"></span>
                                            <span>Wrong ({resultDetails.statistics.wrongAnswers})</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-dot skipped"></span>
                                            <span>Skipped ({resultDetails.statistics.skippedQuestions})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Question Analysis */}
                                <div className="questions-section">
                                    <h3><List size={20} /> Question Analysis</h3>
                                    <div className="questions-list">
                                        {resultDetails.questionAnalysis.map((q, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`question-item ${q.isCorrect ? 'correct' : q.isSkipped ? 'skipped' : 'wrong'}`}
                                            >
                                                <div className="question-status">
                                                    {q.isCorrect ? (
                                                        <CheckCircle size={20} className="icon-correct" />
                                                    ) : q.isSkipped ? (
                                                        <AlertCircle size={20} className="icon-skipped" />
                                                    ) : (
                                                        <XCircle size={20} className="icon-wrong" />
                                                    )}
                                                </div>
                                                <div className="question-info">
                                                    <span className="question-num">Q{q.questionNumber}</span>
                                                    <span className="question-text">{q.questionText?.substring(0, 80)}...</span>
                                                </div>
                                                <div className="question-answer">
                                                    {q.isSkipped ? (
                                                        <span className="answer-status skipped">Skipped</span>
                                                    ) : (
                                                        <>
                                                            <span className="your-answer">
                                                                Your: {typeof q.yourAnswer === 'string' ? q.yourAnswer?.substring(0, 20) : 'N/A'}
                                                            </span>
                                                            {!q.isCorrect && (
                                                                <span className="correct-answer">
                                                                    Correct: {q.correctAnswer?.substring(0, 20)}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Stats */}
                                <div className="extra-stats">
                                    <div className="extra-stat">
                                        <Zap size={18} />
                                        <span>Tab Switches: {resultDetails.statistics.tabSwitches}</span>
                                    </div>
                                    {resultDetails.statistics.warningCount > 0 && (
                                        <div className="extra-stat warning">
                                            <AlertCircle size={18} />
                                            <span>Warnings: {resultDetails.statistics.warningCount}</span>
                                        </div>
                                    )}
                                    <div className="extra-stat">
                                        <Clock size={18} />
                                        <span>Submitted: {new Date(resultDetails.statistics.submittedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .results-page { min-height: 100vh; background: #f1f5f9; }
                .loading-container { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
                .loading-container p { color: #6b7280; }
                .results-header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 2.5rem; margin: -2rem -1.5rem 2rem; }
                .header-content { display: flex; align-items: center; gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
                .header-icon { width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; }
                .results-header h1 { font-size: 2rem; color: white; margin-bottom: 0.25rem; }
                .results-header p { color: rgba(255,255,255,0.85); margin: 0; }
                .stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto 2rem; padding: 0 1.5rem; }
                .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .stat-card .stat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-card .stat-icon.primary { background: #dbeafe; color: #2563eb; }
                .stat-card .stat-icon.success { background: #fef3c7; color: #d97706; }
                .stat-card .stat-icon.warning { background: #f3e8ff; color: #9333ea; }
                .stat-card .stat-info { display: flex; flex-direction: column; }
                .stat-card .stat-value { font-size: 1.75rem; font-weight: 700; color: #111827; line-height: 1; }
                .stat-card .stat-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
                .results-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 2rem; }
                .section-title { font-size: 1.5rem; color: #111827; margin-bottom: 1.5rem; }
                .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .empty-icon { width: 100px; height: 100px; background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: #d97706; }
                .empty-state h3 { font-size: 1.5rem; color: #111827; margin-bottom: 0.5rem; }
                .empty-state p { color: #6b7280; margin-bottom: 1.5rem; }
                .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem; font-size: 1rem; font-weight: 600; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; }
                .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 12px rgba(102,126,234,0.3); }
                .btn-primary:hover { box-shadow: 0 10px 20px rgba(102,126,234,0.4); transform: translateY(-2px); }
                .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
                .result-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .result-header { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
                .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .score-circle.excellent { background: #dcfce7; color: #16a34a; }
                .score-circle.good { background: #dbeafe; color: #2563eb; }
                .score-circle.average { background: #fef3c7; color: #d97706; }
                .score-circle.poor { background: #fee2e2; color: #dc2626; }
                .score-value { font-size: 1.5rem; font-weight: 700; }
                .score-badge { display: inline-block; padding: 0.375rem 0.875rem; border-radius: 9999px; color: white; font-size: 0.75rem; font-weight: 600; }
                .result-body { padding: 0 1.5rem 1rem; }
                .exam-title { font-size: 1.125rem; color: #111827; margin: 0 0 1rem; }
                .result-details { display: flex; flex-direction: column; gap: 0.75rem; }
                .detail-row { display: flex; align-items: center; gap: 0.75rem; color: #6b7280; font-size: 0.875rem; }
                .detail-row.warning { color: #d97706; }
                .result-footer { padding: 1rem 1.5rem; background: #f9fafb; border-top: 1px solid #e5e7eb; }
                .performance-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; }
                .performance-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
                .performance-bar.excellent .performance-fill { background: linear-gradient(90deg, #22c55e, #16a34a); }
                .performance-bar.good .performance-fill { background: linear-gradient(90deg, #3b82f6, #2563eb); }
                .performance-bar.average .performance-fill { background: linear-gradient(90deg, #f59e0b, #d97706); }
                .performance-bar.poor .performance-fill { background: linear-gradient(90deg, #ef4444, #dc2626); }
                .result-actions { display: flex; justify-content: flex-end; }
                .view-details-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: white; border: 2px solid #667eea; border-radius: 8px; color: #667eea; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
                .view-details-btn:hover { background: #667eea; color: white; }
                .view-details-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); padding: 1rem; }
                .detail-modal { background: white; border-radius: 24px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
                .modal-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; background: white; z-index: 10; }
                .modal-header h2 { flex: 1; font-size: 1.25rem; color: #111827; margin: 0; }
                .back-btn, .close-btn { background: none; border: none; color: #6b7280; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: all 0.2s; }
                .back-btn:hover, .close-btn:hover { background: #f1f5f9; color: #111827; }
                .modal-content { padding: 1.5rem; }
                
                .score-overview { display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
                .score-card { flex: 1; min-width: 200px; display: flex; justify-content: center; }
                .big-score-circle { width: 150px; height: 150px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .big-score-circle.excellent { background: linear-gradient(135deg, #dcfce7, #22c55e); }
                .big-score-circle.good { background: linear-gradient(135deg, #dbeafe, #3b82f6); }
                .big-score-circle.average { background: linear-gradient(135deg, #fef3c7, #f59e0b); }
                .big-score-circle.poor { background: linear-gradient(135deg, #fee2e2, #ef4444); }
                .big-score { font-size: 2.5rem; font-weight: 700; color: white; }
                .score-label { font-size: 0.875rem; color: rgba(255,255,255,0.8); }
                .score-stats { flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 1rem; justify-content: center; }
                .score-stat { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; }
                .score-stat.correct { background: #dcfce7; color: #16a34a; }
                .score-stat.wrong { background: #fee2e2; color: #dc2626; }
                .score-stat.skipped { background: #f3f4f6; color: #6b7280; }
                .stat-content { display: flex; flex-direction: column; }
                .stat-number { font-size: 1.5rem; font-weight: 700; }
                .stat-text { font-size: 0.875rem; }

                .chart-section { background: #f9fafb; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
                .chart-section h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; color: #111827; margin-bottom: 1rem; }
                .pie-chart-container { position: relative; width: 200px; height: 200px; margin: 0 auto 1rem; }
                .pie-chart { width: 100%; height: 100%; transform: rotate(-90deg); }
                .pie-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .total-num { font-size: 2rem; font-weight: 700; color: #111827; }
                .total-label { font-size: 0.875rem; color: #6b7280; }
                .chart-legend { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
                .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; }
                .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
                .legend-dot.correct { background: #22c55e; }
                .legend-dot.wrong { background: #ef4444; }
                .legend-dot.skipped { background: #9ca3af; }

                .questions-section { margin-bottom: 1.5rem; }
                .questions-section h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; color: #111827; margin-bottom: 1rem; }
                .questions-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 300px; overflow-y: auto; }
                .question-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb; }
                .question-item.correct { background: #dcfce7; border-color: #86efac; }
                .question-item.wrong { background: #fee2e2; border-color: #fca5a5; }
                .question-item.skipped { background: #f3f4f6; border-color: #d1d5db; }
                .question-status { flex-shrink: 0; }
                .icon-correct { color: #16a34a; }
                .icon-wrong { color: #dc2626; }
                .icon-skipped { color: #6b7280; }
                .question-info { flex: 1; min-width: 0; }
                .question-num { display: block; font-weight: 600; color: #111827; font-size: 0.875rem; }
                .question-text { display: block; color: #6b7280; font-size: 0.813rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .question-answer { flex-shrink: 0; text-align: right; }
                .your-answer { display: block; font-size: 0.75rem; color: #dc2626; }
                .correct-answer { display: block; font-size: 0.75rem; color: #16a34a; }
                .answer-status { font-size: 0.75rem; font-weight: 600; color: #6b7280; }

                .extra-stats { display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem; background: #f9fafb; border-radius: 12px; }
                .extra-stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6b7280; }
                .extra-stat.warning { color: #d97706; }

                @media (max-width: 768px) {
                    .results-header { padding: 1.5rem; margin: -1.5rem -1rem 1.5rem; }
                    .header-content { flex-direction: column; text-align: center; }
                    .stats-overview { grid-template-columns: 1fr; padding: 0 1rem; }
                    .results-container { padding: 0 1rem; }
                    .results-grid { grid-template-columns: 1fr; }
                    .result-header { flex-direction: column; text-align: center; }
                    .score-overview { flex-direction: column; align-items: center; }
                    .score-stats { width: 100%; }
                }
            `}</style>
        </motion.div>
    );
};

export default Results;

