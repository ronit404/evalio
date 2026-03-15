import { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FileText, 
    BookOpen, 
    ChevronDown,
    ChevronUp,
    Folder,
    FolderOpen,
    Image,
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Award
} from 'lucide-react';

const StudentQuestionBank = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [examResults, setExamResults] = useState([]);
    const [examQuestions, setExamQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examQuestionsLoading, setExamQuestionsLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'completed'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchQuestions();
        fetchExamResults();
    }, [user, navigate]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/student/questions');
            setQuestions(data);
            
            // Auto-expand first few categories
            const cats = Object.keys(groupedQuestions(data)).sort();
            const initialExpanded = {};
            cats.slice(0, 3).forEach(cat => {
                initialExpanded[cat] = true;
            });
            setExpandedCategories(initialExpanded);
        } catch (err) {
            console.error("Error fetching questions:", err);
            toast.error("Failed to load question bank");
        } finally {
            setLoading(false);
        }
    };

    // Fetch completed exam results with question analysis
    const fetchExamResults = async () => {
        try {
            const { data } = await API.get('/student/my-results');
            setExamResults(data);
        } catch (err) {
            console.error("Error fetching exam results:", err);
        }
    };

    // Get questions from completed exams
    const loadExamQuestions = async () => {
        if (examQuestions.length > 0) return; // Already loaded
        
        setExamQuestionsLoading(true);
        const examQs = [];
        
        try {
            for (const result of examResults) {
                try {
                    const { data } = await API.get(`/student/my-results/${result._id}`);
                    if (data && data.questionAnalysis) {
                        data.questionAnalysis.forEach(q => {
                            examQs.push({
                                ...q,
                                examTitle: data.exam?.title || 'Exam',
                                examId: result._id,
                                isFromExam: true
                            });
                        });
                    }
                } catch (err) {
                    console.error("Error fetching result details:", err);
                }
            }
            setExamQuestions(examQs);
        } finally {
            setExamQuestionsLoading(false);
        }
    };

    // Load exam questions when switching to completed view
    useEffect(() => {
        if (viewMode === 'completed' && examResults.length > 0 && examQuestions.length === 0) {
            loadExamQuestions();
        }
    }, [viewMode, examResults]);

    // Group questions by category
    const groupedQuestions = (questionsData) => {
        return questionsData.reduce((acc, q) => {
            const category = q.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(q);
            return acc;
        }, {});
    };

    // Get all unique categories
    const categories = ['all', ...Object.keys(groupedQuestions(questions)).sort()];

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

    // Filter questions by search term
    const filteredQuestions = searchTerm
        ? questions.filter(q => 
            q.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : questions;

    // Get filtered grouped questions
    const filteredGroupedQuestions = groupedQuestions(filteredQuestions);

    // Group exam questions by exam title
    const groupedExamQuestions = () => {
        const grouped = {};
        examQuestions.forEach(q => {
            const examTitle = q.examTitle || 'Exam';
            if (!grouped[examTitle]) {
                grouped[examTitle] = [];
            }
            grouped[examTitle].push(q);
        });
        return grouped;
    };

    // Calculate total exam questions count
    const totalExamQuestions = examQuestions.length;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading Question Bank...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="student-question-bank"
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
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1>Question Bank</h1>
                        <p>Browse and practice questions from your course</p>
                    </div>
                </div>
                <div className="view-toggle">
                    <button 
                        className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                        onClick={() => setViewMode('all')}
                    >
                        <BookOpen size={16} />
                        All Questions
                    </button>
                    <button 
                        className={`toggle-btn ${viewMode === 'completed' ? 'active' : ''}`}
                        onClick={() => {
                            setViewMode('completed');
                            loadExamQuestions();
                        }}
                    >
                        <CheckCircle size={16} />
                        My Exam Questions
                    </button>
                </div>
            </motion.div>

            {/* Search and Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search questions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <button className="btn btn-secondary" onClick={expandAll}>
                        <ChevronDown size={16} />
                        Expand All
                    </button>
                    <button className="btn btn-secondary" onClick={collapseAll}>
                        <ChevronUp size={16} />
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                <button 
                    className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedCategory('all');
                        expandAll();
                    }}
                >
                    <Folder size={16} />
                    All ({questions.length})
                </button>
                {Object.entries(groupedQuestions(questions)).map(([category, catQuestions]) => (
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

            {/* Questions Content */}
            <div className="questions-container">
                {/* Show exam questions view if in completed mode */}
                {viewMode === 'completed' ? (
                    examQuestionsLoading ? (
                        <div className="loading-container">
                            <div className="spinner spinner-lg"></div>
                            <p>Loading your exam questions...</p>
                        </div>
                    ) : totalExamQuestions === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={64} />
                            <h3>No Exam Questions Yet</h3>
                            <p>Complete an exam to see your questions here</p>
                        </div>
                    ) : (
                        <div className="exam-questions-view">
                            <div className="exam-questions-header">
                                <h2>Questions from Your Completed Exams</h2>
                                <span className="total-count">{totalExamQuestions} questions</span>
                            </div>
                            {Object.entries(groupedExamQuestions()).map(([examTitle, examQs]) => (
                                <div key={examTitle} className="exam-section">
                                    <div className="exam-title-bar">
                                        <Award size={20} color="#667eea" />
                                        <span className="exam-name">{examTitle}</span>
                                        <span className="exam-count">{examQs.length} questions</span>
                                    </div>
                                    <div className="questions-grid">
                                        {examQs.map((q, idx) => (
                                            <motion.div 
                                                key={q.questionId}
                                                className={`question-card exam-question ${q.isCorrect ? 'correct' : q.isSkipped ? 'skipped' : 'incorrect'}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                            >
                                                <div className="question-header">
                                                    <span className="badge badge-primary">Q{q.questionNumber}</span>
                                                    {q.isCorrect ? (
                                                        <span className="status-badge correct"><CheckCircle size={14} /> Correct</span>
                                                    ) : q.isSkipped ? (
                                                        <span className="status-badge skipped"><Award size={14} /> Skipped</span>
                                                    ) : (
                                                        <span className="status-badge incorrect"><XCircle size={14} /> Incorrect</span>
                                                    )}
                                                    <span className="points-badge">{q.points} point(s)</span>
                                                </div>
                                                <p className="question-text">{q.questionText}</p>
                                                <div className="question-options">
                                                    {q.options?.slice(0, 4).map((opt, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={`option-tag ${
                                                                q.correctAnswer?.includes(opt) ? 'correct-answer' : 
                                                                q.yourAnswer === opt ? 'your-answer' : ''
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + i)}. {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="answer-review">
                                                    <div className="your-answer-row">
                                                        <span className="answer-label">Your Answer:</span>
                                                        <span className={`answer-value ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                                            {q.yourAnswer || 'Not answered'}
                                                        </span>
                                                    </div>
                                                    {!q.isCorrect && (
                                                        <div className="correct-answer-row">
                                                            <span className="answer-label">Correct Answer:</span>
                                                            <span className="answer-value correct">{q.correctAnswer}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : filteredQuestions.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={64} />
                        <h3>No Questions Found</h3>
                        <p>{searchTerm ? 'Try a different search term' : 'No questions available yet'}</p>
                    </div>
                ) : selectedCategory === 'all' ? (
                    // Show all categories
                    Object.entries(filteredGroupedQuestions).map(([category, catQuestions]) => (
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
                                <div className="questions-grid">
                                    {catQuestions.map((q, idx) => (
                                        <motion.div 
                                            key={q._id}
                                            className="question-card"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                        >
                                            <div className="question-header">
                                                <span className="badge badge-primary">{q.category || 'General'}</span>
                                                {q.questionType === 'detailed' && (
                                                    <span className="badge badge-detailed">Detailed</span>
                                                )}
                                                {q.isMultipleCorrect && (
                                                    <span className="badge badge-multiple">Multiple Answer</span>
                                                )}
                                                {q.image && <Image size={18} color="#3b82f6" />}
                                            </div>
                                            <p className="question-text">{q.questionText}</p>
                                            <div className="question-options">
                                                {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                                    <span key={i} className="option-tag">
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </span>
                                                ))}
                                                {q.questionType === 'detailed' && (
                                                    <span className="option-tag detailed">
                                                        See answer key for expected response
                                                    </span>
                                                )}
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
                    // Show only selected category
                    <div className="category-section single">
                        <div className="category-section-header">
                            <FolderOpen size={24} color="#667eea" />
                            <span className="category-name">{selectedCategory}</span>
                            <span className="category-badge large">{filteredGroupedQuestions[selectedCategory]?.length || 0}</span>
                        </div>
                        <div className="questions-grid">
                            {filteredGroupedQuestions[selectedCategory]?.map((q, idx) => (
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
                                        {q.isMultipleCorrect && (
                                            <span className="badge badge-multiple">Multiple Answer</span>
                                        )}
                                        {q.image && <Image size={18} color="#3b82f6" />}
                                    </div>
                                    <p className="question-text">{q.questionText}</p>
                                    <div className="question-options">
                                        {q.questionType === 'mcq' && q.options?.slice(0, 4).map((opt, i) => (
                                            <span key={i} className="option-tag">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </span>
                                        ))}
                                        {q.questionType === 'detailed' && (
                                            <span className="option-tag detailed">
                                                See answer key for expected response
                                            </span>
                                        )}
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

            <style>{`
                .student-question-bank {
                    min-height: 100vh;
                    background: #f8fafc;
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
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                }

                .toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .toggle-btn.active {
                    background: white;
                    color: #1e293b;
                    border-color: white;
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

                .filter-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    padding: 0 1.5rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    flex: 1;
                    max-width: 400px;
                }

                .search-box .search-icon {
                    color: #94a3b8;
                }

                .search-box input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 0.875rem;
                    color: #334155;
                }

                .search-box input::placeholder {
                    color: #94a3b8;
                }

                .filter-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    font-size: 0.813rem;
                    font-weight: 600;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: white;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }

                .btn-secondary:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                }

                .category-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 0 1.5rem 1rem;
                }

                .category-tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.813rem;
                    font-weight: 500;
                    color: #64748b;
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

                .questions-container {
                    padding: 0 1.5rem 2rem;
                }

                .category-section {
                    margin-bottom: 1.5rem;
                }

                .category-section.single {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .category-title-bar {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    background: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 0.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .category-title-bar:hover {
                    background: #f8fafc;
                }

                .category-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    color: #334155;
                }

                .category-name {
                    font-weight: 600;
                    color: #1e293b;
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
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .category-section-header .category-name {
                    font-size: 1.25rem;
                    color: #667eea;
                }

                .questions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1rem;
                }

                .question-card {
                    padding: 1.25rem;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }

                .question-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
                }

                .question-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    flex-wrap: wrap;
                }

                .question-text {
                    font-weight: 500;
                    color: #1e293b;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                    font-size: 0.95rem;
                }

                .question-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .option-tag {
                    font-size: 0.75rem;
                    padding: 0.375rem 0.625rem;
                    background: #f1f5f9;
                    border-radius: 6px;
                    color: #475569;
                }

                .option-tag.detailed {
                    background: #fef3c7;
                    color: #92400e;
                }

                .question-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 0.75rem;
                    border-top: 1px solid #f1f5f9;
                }

                .question-id {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-family: monospace;
                }

                .question-points {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .badge {
                    display: inline-flex;
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .badge-primary {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .badge-detailed {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                }

                .badge-multiple {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    grid-column: 1 / -1;
                }

                .empty-state svg {
                    color: #cbd5e1;
                    margin-bottom: 1.5rem;
                }

                .empty-state h3 {
                    color: #334155;
                    margin-bottom: 0.75rem;
                    font-size: 1.5rem;
                }

                .empty-state p {
                    color: #64748b;
                    font-size: 1rem;
                }

                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .filter-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-box {
                        max-width: none;
                    }

                    .filter-actions {
                        justify-content: center;
                    }

                    .category-tabs {
                        overflow-x: auto;
                        flex-wrap: nowrap;
                        padding: 0.75rem 1.5rem;
                    }

                    .category-tab {
                        flex-shrink: 0;
                    }

                    .questions-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .page-header {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                /* Exam Questions View Styles */
                .exam-questions-view {
                    padding: 0;
                }

                .exam-questions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .exam-questions-header h2 {
                    font-size: 1.25rem;
                    color: #1e293b;
                    margin: 0;
                }

                .total-count {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.375rem 0.875rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .exam-section {
                    margin-bottom: 2rem;
                }

                .exam-title-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .exam-name {
                    font-weight: 600;
                    color: #1e293b;
                    flex: 1;
                }

                .exam-count {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .question-card.exam-question {
                    border-left: 4px solid;
                }

                .question-card.exam-question.correct {
                    border-left-color: #22c55e;
                }

                .question-card.exam-question.incorrect {
                    border-left-color: #ef4444;
                }

                .question-card.exam-question.skipped {
                    border-left-color: #f59e0b;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.625rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .status-badge.correct {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .status-badge.incorrect {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .status-badge.skipped {
                    background: #fef3c7;
                    color: #d97706;
                }

                .option-tag.correct-answer {
                    background: #dcfce7;
                    color: #16a34a;
                    border: 1px solid #22c55e;
                }

                .option-tag.your-answer {
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #ef4444;
                }

                .answer-review {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px dashed #e2e8f0;
                }

                .your-answer-row, .correct-answer-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .answer-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 500;
                    min-width: 100px;
                }

                .answer-value {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .answer-value.correct {
                    color: #16a34a;
                }

                .answer-value.incorrect {
                    color: #dc2626;
                }
            `}</style>
        </motion.div>
    );
};

export default StudentQuestionBank;

