import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import API from '../api/axios';
import { 
    ArrowLeft, 
    CheckCircle, 
    XCircle, 
    Edit2, 
    Save, 
    X,
    User,
    BookOpen,
    Clock,
    AlertTriangle,
    Award
} from 'lucide-react';

const SubmissionDetails = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingScore, setEditingScore] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [scoreValue, setScoreValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                setLoading(true);
                const { data } = await API.get(`/admin/submission/${submissionId}`);
                setSubmission(data);
            } catch (err) {
                console.error("Error fetching submission:", err);
                toast.error("Failed to load submission details");
            } finally {
                setLoading(false);
            }
        };
        
        if (submissionId) {
            fetchSubmission();
        }
    }, [submissionId]);

    const handleEditStart = (question) => {
        setEditingQuestion(question.questionId);
        setEditValue(question.yourAnswer || '');
    };

    const handleEditCancel = () => {
        setEditingQuestion(null);
        setEditValue('');
    };

    const handleEditSave = async (questionId) => {
        if (!editValue.trim()) {
            toast.error("Answer cannot be empty");
            return;
        }

        setSaving(true);
        try {
            const { data } = await API.put(`/admin/submission/${submissionId}/answer`, {
                questionId,
                newAnswer: editValue
            });

            // Update local state with new score
            setSubmission(prev => ({
                ...prev,
                questionAnalysis: prev.questionAnalysis.map(q => 
                    q.questionId === questionId 
                        ? { ...q, yourAnswer: editValue }
                        : q
                ),
                statistics: {
                    ...prev.statistics,
                    score: data.newScore,
                    totalPoints: data.totalPoints,
                    percentage: data.newPercentage
                }
            }));

            toast.success(`Answer updated! New score: ${data.newPercentage}%`);
            setEditingQuestion(null);
            setEditValue('');
        } catch (err) {
            console.error("Error updating answer:", err);
            toast.error(err.response?.data?.message || "Failed to update answer");
        } finally {
            setSaving(false);
        }
    };

    // Handle score editing for detailed questions
    const handleScoreEditStart = (question) => {
        setEditingScore(question.questionId);
        setScoreValue(question.earnedScore !== undefined ? question.earnedScore.toString() : '0');
    };

    const handleScoreEditCancel = () => {
        setEditingScore(null);
        setScoreValue('');
    };

    const handleScoreSave = async (questionId, maxPoints) => {
        const score = parseFloat(scoreValue);
        
        if (isNaN(score)) {
            toast.error("Please enter a valid number");
            return;
        }
        
        if (score < 0 || score > maxPoints) {
            toast.error(`Score must be between 0 and ${maxPoints}`);
            return;
        }

        setSaving(true);
        try {
            const { data } = await API.put(`/admin/submission/${submissionId}/score`, {
                questionId,
                score: score
            });

            // Update local state with new score
            setSubmission(prev => ({
                ...prev,
                questionAnalysis: prev.questionAnalysis.map(q => 
                    q.questionId === questionId 
                        ? { ...q, earnedScore: score }
                        : q
                ),
                statistics: {
                    ...prev.statistics,
                    score: data.newScore,
                    totalPoints: data.totalPoints,
                    percentage: data.newPercentage
                }
            }));

            toast.success(`Score updated to ${score}/${maxPoints}! Total: ${data.newPercentage}%`);
            setEditingScore(null);
            setScoreValue('');
        } catch (err) {
            console.error("Error updating score:", err);
            toast.error(err.response?.data?.message || "Failed to update score");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading submission details...</p>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="error-container">
                <h2>Submission not found</h2>
                <button className="btn btn-primary" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Go Back
                </button>
            </div>
        );
    }

    const { submission: subData, exam, student, questionAnalysis, statistics } = submission;

    return (
        <motion.div 
            className="submission-details-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Student Submission Review</h1>
                        <p>{exam?.title}</p>
                    </div>
                </div>
            </div>

            {/* Student Info Card */}
            <div className="info-cards">
                <div className="info-card">
                    <div className="info-icon">
                        <User size={24} />
                    </div>
                    <div className="info-content">
                        <span className="info-label">Student</span>
                        <span className="info-value">{student?.name}</span>
                        <span className="info-sub">{student?.email}</span>
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-icon">
                        <BookOpen size={24} />
                    </div>
                    <div className="info-content">
                        <span className="info-label">Exam</span>
                        <span className="info-value">{exam?.title}</span>
                        <span className="info-sub">{exam?.duration} minutes</span>
                    </div>
                </div>
                <div className="info-card score-card">
                    <div className="info-icon">
                        <Clock size={24} />
                    </div>
                    <div className="info-content">
                        <span className="info-label">Score</span>
                        <span className="info-value score">{statistics?.score} / {statistics?.totalPoints}</span>
                        <span className={`info-sub ${statistics?.percentage >= 40 ? 'pass' : 'fail'}`}>
                            {statistics?.percentage}% - {statistics?.percentage >= 40 ? 'Passed' : 'Failed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Questions Review */}
            <div className="questions-section">
                <h2>Question-by-Question Review</h2>
                <p className="section-hint">Click "Edit" to modify a student's answer. The score will be automatically recalculated.</p>
                
                <div className="questions-list">
                    {questionAnalysis?.map((question, index) => (
                        <motion.div 
                            key={question.questionId}
                            className={`question-card ${question.isCorrect ? 'correct' : question.isSkipped ? 'skipped' : 'incorrect'}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="question-header">
                                <div className="question-badge">
                                    <span>Question {question.questionNumber}</span>
                                    <span className="points-badge">{question.points} point(s)</span>
                                </div>
                                <div className={`status-badge ${question.isCorrect ? 'correct' : question.isSkipped ? 'skipped' : 'incorrect'}`}>
                                    {question.isCorrect ? (
                                        <><CheckCircle size={14} /> Correct</>
                                    ) : question.isSkipped ? (
                                        <><AlertTriangle size={14} /> Not Answered</>
                                    ) : (
                                        <><XCircle size={14} /> Incorrect</>
                                    )}
                                </div>
                            </div>

                            <div className="question-text">
                                <p>{question.questionText}</p>
                            </div>

                            {/* Options for MCQ */}
                            {question.questionType === 'mcq' && question.options && question.options.length > 0 && (
                                <div className="options-review">
                                    <div className="answer-row">
                                        <span className="answer-label">Student's Answer:</span>
                                        {editingQuestion === question.questionId ? (
                                            <div className="edit-container">
                                                <select 
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="answer-select"
                                                >
                                                    <option value="">Select an option</option>
                                                    {question.options.map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    className="btn-save"
                                                    onClick={() => handleEditSave(question.questionId)}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                                                </button>
                                                <button 
                                                    className="btn-cancel-edit"
                                                    onClick={handleEditCancel}
                                                >
                                                    <X size={14} /> Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="answer-display">
                                                <span className={`answer-value ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {question.yourAnswer || "Not answered"}
                                                </span>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleEditStart(question)}
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="answer-row">
                                        <span className="answer-label">Correct Answer:</span>
                                        <span className="answer-value correct">{question.correctAnswer}</span>
                                    </div>
                                    
                                    {/* Manual Score Override for MCQ */}
                                    <div className="answer-row score-row">
                                        <span className="answer-label">
                                            <Award size={16} /> Override Marks:
                                        </span>
                                        {editingScore === question.questionId ? (
                                            <div className="edit-container">
                                                <input
                                                    type="number"
                                                    value={scoreValue}
                                                    onChange={(e) => setScoreValue(e.target.value)}
                                                    className="score-input"
                                                    min="0"
                                                    max={question.points}
                                                    step="0.5"
                                                />
                                                <span className="max-score">/ {question.points}</span>
                                                <button 
                                                    className="btn-save"
                                                    onClick={() => handleScoreSave(question.questionId, question.points)}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                                                </button>
                                                <button 
                                                    className="btn-cancel-edit"
                                                    onClick={handleScoreEditCancel}
                                                >
                                                    <X size={14} /> Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="answer-display">
                                                <span className={`score-badge ${question.earnedScore !== undefined ? 'has-score' : question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {question.earnedScore !== undefined 
                                                        ? `${question.earnedScore}/${question.points} (Manual)` 
                                                        : `${question.isCorrect ? question.points : 0}/${question.points}`}
                                                </span>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleScoreEditStart(question)}
                                                >
                                                    <Award size={14} /> Override
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Descriptive Questions */}
                            {question.questionType === 'detailed' && (
                                <div className="detailed-review">
                                    <div className="answer-row">
                                        <span className="answer-label">Student's Answer:</span>
                                        {editingQuestion === question.questionId ? (
                                            <div className="edit-container full-width">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="answer-textarea"
                                                    placeholder="Enter student's answer..."
                                                    rows={4}
                                                />
                                                <div className="edit-actions">
                                                    <button 
                                                        className="btn-save"
                                                        onClick={() => handleEditSave(question.questionId)}
                                                        disabled={saving}
                                                    >
                                                        {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                                                    </button>
                                                    <button 
                                                        className="btn-cancel-edit"
                                                        onClick={handleEditCancel}
                                                    >
                                                        <X size={14} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="answer-display full-width">
                                                <p className="student-answer">{question.yourAnswer || "Not answered"}</p>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleEditStart(question)}
                                                >
                                                    <Edit2 size={14} /> Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {question.expectedAnswer && (
                                        <div className="answer-row">
                                            <span className="answer-label">Expected Answer:</span>
                                            <span className="answer-value">{question.expectedAnswer}</span>
                                        </div>
                                    )}
                                    
                                    {/* Score Input for Descriptive Questions */}
                                    <div className="answer-row score-row">
                                        <span className="answer-label">
                                            <Award size={16} /> Marks:
                                        </span>
                                        {editingScore === question.questionId ? (
                                            <div className="edit-container">
                                                <input
                                                    type="number"
                                                    value={scoreValue}
                                                    onChange={(e) => setScoreValue(e.target.value)}
                                                    className="score-input"
                                                    min="0"
                                                    max={question.points}
                                                    step="0.5"
                                                />
                                                <span className="max-score">/ {question.points}</span>
                                                <button 
                                                    className="btn-save"
                                                    onClick={() => handleScoreSave(question.questionId, question.points)}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                                                </button>
                                                <button 
                                                    className="btn-cancel-edit"
                                                    onClick={handleScoreEditCancel}
                                                >
                                                    <X size={14} /> Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="answer-display">
                                                <span className={`score-badge ${question.earnedScore !== undefined && question.earnedScore > 0 ? 'has-score' : ''}`}>
                                                    {question.earnedScore !== undefined ? question.earnedScore : '0'} / {question.points}
                                                </span>
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleScoreEditStart(question)}
                                                >
                                                    <Award size={14} /> Give Marks
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                .submission-details-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding: 1.5rem;
                }

                .loading-container, .error-container {
                    min-height: 60vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .back-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: none;
                    background: white;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .back-btn:hover {
                    background: #f1f5f9;
                    color: #334155;
                }

                .page-header h1 {
                    font-size: 1.5rem;
                    color: #1e293b;
                    margin: 0;
                }

                .page-header p {
                    color: #64748b;
                    margin: 0;
                }

                .info-cards {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .info-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .info-card.score-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .info-card.score-card .info-icon {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }

                .info-card.score-card .info-value {
                    color: white;
                }

                .info-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #667eea;
                }

                .info-content {
                    display: flex;
                    flex-direction: column;
                }

                .info-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .info-card.score-card .info-label {
                    color: rgba(255,255,255,0.8);
                }

                .info-value {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .info-value.score {
                    color: white;
                }

                .info-sub {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .info-sub.pass {
                    color: #16a34a;
                }

                .info-sub.fail {
                    color: #dc2626;
                }

                .info-card.score-card .info-sub {
                    color: rgba(255,255,255,0.9);
                }

                .questions-section {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .questions-section h2 {
                    font-size: 1.25rem;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }

                .section-hint {
                    color: #64748b;
                    font-size: 0.875rem;
                    margin-bottom: 1.5rem;
                }

                .questions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .question-card {
                    border-radius: 16px;
                    padding: 1.25rem;
                    border: 2px solid #e2e8f0;
                }

                .question-card.correct {
                    border-color: #22c55e;
                    background: #f0fdf4;
                }

                .question-card.incorrect {
                    border-color: #ef4444;
                    background: #fef2f2;
                }

                .question-card.skipped {
                    border-color: #f59e0b;
                    background: #fffbeb;
                }

                .question-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .question-badge {
                    display: flex;
                    gap: 0.5rem;
                }

                .question-badge span:first-child {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.375rem 0.75rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .points-badge {
                    background: #f1f5f9;
                    color: #64748b;
                    padding: 0.375rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 8px;
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

                .question-text {
                    margin-bottom: 1rem;
                }

                .question-text p {
                    font-size: 1rem;
                    color: #334155;
                    line-height: 1.6;
                }

                .options-review, .detailed-review {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .answer-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .answer-label {
                    min-width: 140px;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .answer-display {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }

                .answer-display.full-width {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }

                .answer-value {
                    font-weight: 500;
                    color: #334155;
                }

                .answer-value.correct {
                    color: #16a34a;
                }

                .answer-value.incorrect {
                    color: #dc2626;
                }

                .student-answer {
                    background: white;
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    color: #334155;
                    line-height: 1.6;
                    width: 100%;
                }

                .edit-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }

                .edit-container.full-width {
                    flex-direction: column;
                    align-items: flex-start;
                    width: 100%;
                }

                .answer-select {
                    padding: 0.5rem 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    flex: 1;
                    max-width: 300px;
                }

                .answer-textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    resize: vertical;
                    font-family: inherit;
                }

                .btn-edit {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-edit:hover {
                    background: #f1f5f9;
                    color: #334155;
                }

                .btn-save {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 1rem;
                    background: #22c55e;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-save:hover:not(:disabled) {
                    background: #16a34a;
                }

                .btn-save:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-cancel-edit {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 1rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel-edit:hover {
                    background: #f1f5f9;
                    color: #334155;
                }

                .edit-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .score-row {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px dashed #e2e8f0;
                }

                .score-input {
                    padding: 0.5rem 0.75rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    width: 80px;
                    text-align: center;
                }

                .score-input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .max-score {
                    color: #64748b;
                    font-weight: 500;
                }

                .score-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    background: #f1f5f9;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .score-badge.has-score {
                    background: #dcfce7;
                    color: #16a34a;
                }

                @media (max-width: 768px) {
                    .info-cards {
                        grid-template-columns: 1fr;
                    }

                    .answer-row {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .answer-label {
                        min-width: auto;
                    }

                    .edit-container {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .answer-select {
                        max-width: 100%;
                    }
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
            `}</style>
        </motion.div>
    );
};

export default SubmissionDetails;

