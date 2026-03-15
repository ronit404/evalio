import { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    BookOpen, 
    ChevronRight,
    Save,
    RefreshCw,
    Check,
    AlertCircle,
    ArrowLeft,
    Plus
} from 'lucide-react';

const SubjectSelection = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [availableData, setAvailableData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState({});
    const [error, setError] = useState(null);

    // Fetch available subjects on mount
    const fetchAvailableSubjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/student/available-subjects');
            setAvailableData(response.data);
            
            // Pre-fill selected subjects with current selections
            const preSelected = {};
            response.data.selectedSubjects.forEach(sub => {
                preSelected[sub.subject] = sub.teacherId;
            });
            setSelectedSubjects(preSelected);
        } catch (err) {
            console.error("Error fetching available subjects:", err);
            if (err.response?.status === 400) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate('/login');
            } else {
                setError("Failed to load available subjects. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        if (user.role !== 'student') {
            navigate('/');
            return;
        }
        
        fetchAvailableSubjects();
    }, [user, navigate, fetchAvailableSubjects]);

    // Toggle subject selection - auto-assign first available teacher
    const toggleSubject = (subject, teachers) => {
        if (selectedSubjects[subject]) {
            // If already selected, remove it
            const newSelected = { ...selectedSubjects };
            delete newSelected[subject];
            setSelectedSubjects(newSelected);
        } else {
            // If not selected, add it with first available teacher
            if (teachers && teachers.length > 0) {
                setSelectedSubjects({
                    ...selectedSubjects,
                    [subject]: teachers[0].teacherId
                });
            } else {
                toast.error("No teachers available for this subject");
            }
        }
    };

    // Check if a subject is selected
    const isSubjectSelected = (subject) => {
        return selectedSubjects[subject] && selectedSubjects[subject] !== '';
    };

    // Get count of selected subjects
    const getSelectedCount = () => {
        return Object.keys(selectedSubjects).filter(subject => isSubjectSelected(subject)).length;
    };

    // Save subject selections
    const handleSave = async () => {
        const selectedList = Object.entries(selectedSubjects)
            .filter(([subject, teacherId]) => teacherId && teacherId !== '')
            .map(([subject, teacherId]) => ({
                subject,
                teacherId
            }));

        if (selectedList.length === 0) {
            toast.error("Please select at least one subject");
            return;
        }

        setSaving(true);
        try {
            const response = await API.post('/student/save-subjects', {
                subjects: selectedList
            });
            
            toast.success("Subjects saved successfully!");
            
            // Update user context with new enrolled subjects
            if (setUser) {
                setUser(prev => ({
                    ...prev,
                    enrolledSubjects: response.data.enrolledSubjects
                }));
            }
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                navigate('/student');
            }, 1500);
            
        } catch (err) {
            console.error("Error saving subjects:", err);
            toast.error(err.response?.data?.message || "Failed to save subjects");
        } finally {
            setSaving(false);
        }
    };

    // Skip for now - go to dashboard without selecting
    const handleSkip = () => {
        navigate('/student');
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
                <p>Loading available subjects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="error-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="error-content">
                    <AlertCircle size={64} className="error-icon" />
                    <h2>Unable to Load Subjects</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button className="btn btn-secondary" onClick={handleSkip}>
                            Go to Dashboard
                        </button>
                        <button className="btn btn-primary" onClick={fetchAvailableSubjects}>
                            <RefreshCw size={18} />
                            Try Again
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const { studentYear, studentSection, availableSubjects } = availableData || {};

    return (
        <motion.div 
            className="subject-selection-page"
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
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1>Your Subjects</h1>
                        <p>Year {studentYear} - Section {studentSection}</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={fetchAvailableSubjects}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </motion.div>

            {/* Info Banner */}
            <div className="info-banner">
                <AlertCircle size={20} />
                <span>Click on a subject to add or remove it from your list. A teacher will be automatically assigned.</span>
            </div>

            {/* Subjects Grid */}
            <div className="subjects-container">
                {availableSubjects && availableSubjects.length > 0 ? (
                    <motion.div 
                        className="subjects-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {availableSubjects.map((subjectData, index) => (
                            <motion.div
                                key={subjectData.subject}
                                className={`subject-card ${isSubjectSelected(subjectData.subject) ? 'selected' : ''}`}
                                variants={itemVariants}
                                onClick={() => toggleSubject(subjectData.subject, subjectData.teachers)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="subject-content">
                                    <div className="subject-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="subject-info">
                                        <h3>{subjectData.subject}</h3>
                                        <span className="teacher-count">
                                            {subjectData.teachers.length} teacher{subjectData.teachers.length !== 1 ? 's' : ''} available
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="subject-action">
                                    {isSubjectSelected(subjectData.subject) ? (
                                        <div className="selected-indicator">
                                            <Check size={20} />
                                            <span>Selected</span>
                                        </div>
                                    ) : (
                                        <div className="add-indicator">
                                            <Plus size={20} />
                                            <span>Add</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="empty-state">
                        <BookOpen size={64} />
                        <h3>No Subjects Available</h3>
                        <p>No teachers have been assigned to teach for your year and section yet.</p>
                        <p className="hint">Please contact your administrator to get this sorted out.</p>
                    </div>
                )}
            </div>

            {/* Selection Summary & Actions */}
            {availableSubjects && availableSubjects.length > 0 && (
                <div className="action-bar">
                    <div className="selection-summary">
                        <span className="selection-count">{getSelectedCount()}</span>
                        <span className="selection-text">
                            of {availableSubjects.length} subjects selected
                        </span>
                    </div>
                    <div className="action-buttons">
                        <button 
                            className="btn btn-secondary"
                            onClick={handleSkip}
                        >
                            <ArrowLeft size={18} />
                            Skip for Now
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving || getSelectedCount() === 0}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Selection
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Skip if no subjects available */}
            {availableSubjects && availableSubjects.length === 0 && (
                <div className="action-bar">
                    <button 
                        className="btn btn-primary"
                        onClick={handleSkip}
                    >
                        Go to Dashboard
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            <style>{`
                .subject-selection-page {
                    min-height: 100vh;
                    background: #f1f5f9;
                    padding-bottom: 100px;
                }

                .loading-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }

                .loading-container p {
                    color: #6b7280;
                }

                .error-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .error-content {
                    text-align: center;
                    max-width: 400px;
                }

                .error-icon {
                    color: #ef4444;
                    margin-bottom: 1rem;
                }

                .error-content h2 {
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }

                .error-content p {
                    color: #64748b;
                    margin-bottom: 1.5rem;
                }

                .error-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .page-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 2rem;
                    margin: -2rem -1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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

                .info-banner {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: #fef3c7;
                    border-radius: 12px;
                    margin: 0 1.5rem 1.5rem;
                    color: #92400e;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .subjects-container {
                    padding: 0 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .subjects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                }

                .subject-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .subject-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .subject-card.selected {
                    border-color: #22c55e;
                    background: #f0fdf4;
                }

                .subject-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
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
                    flex-shrink: 0;
                }

                .subject-card.selected .subject-icon {
                    background: #22c55e;
                }

                .subject-info h3 {
                    font-size: 1.125rem;
                    color: #1e293b;
                    margin: 0 0 0.25rem;
                }

                .teacher-count {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .subject-action {
                    flex-shrink: 0;
                }

                .selected-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #22c55e;
                    color: white;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .add-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #f1f5f9;
                    color: #64748b;
                    border-radius: 20px;
                    font-weight: 500;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .subject-card:hover .add-indicator {
                    background: #e2e8f0;
                    color: #334155;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

                .empty-state .hint {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    color: #9ca3af;
                }

                .action-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 1rem 2rem;
                    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 100;
                }

                .selection-summary {
                    display: flex;
                    align-items: baseline;
                    gap: 0.5rem;
                }

                .selection-count {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .selection-text {
                    color: #64748b;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                }

                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .spinner-sm {
                    width: 1rem;
                    height: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .page-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }

                    .header-content {
                        flex-direction: column;
                    }

                    .info-banner {
                        margin: 0 1rem 1rem;
                    }

                    .subjects-container {
                        padding: 0 1rem;
                    }

                    .subjects-grid {
                        grid-template-columns: 1fr;
                    }

                    .action-bar {
                        flex-direction: column;
                        gap: 1rem;
                        padding: 1rem;
                    }

                    .selection-summary {
                        width: 100%;
                        justify-content: center;
                    }

                    .action-buttons {
                        width: 100%;
                        flex-direction: column;
                    }

                    .action-buttons .btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .subject-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .subject-action {
                        width: 100%;
                    }

                    .subject-action > div {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default SubjectSelection;
