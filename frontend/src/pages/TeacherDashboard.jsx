import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    BookOpen, 
    FileText, 
    Upload, 
    Plus, 
    Users,
    Clock,
    GraduationCap,
    FilePlus,
    PenTool,
    FileQuestion
} from 'lucide-react';

const TeacherDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [teachingSubjects, setTeachingSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examsCount, setExamsCount] = useState({});
    const [studentsCount, setStudentsCount] = useState({});

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Redirect students to student dashboard
        const isAdmin = user.isAdmin || user.role === 'super_admin';
        const isTeacher = user.role === 'teacher' || user.role === 'section_admin';
        
        if (!isAdmin && !isTeacher) {
            navigate('/student');
            return;
        }
        
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch teacher's subjects
            const subjectsRes = await API.get('/teacher/subjects');
            setTeachingSubjects(subjectsRes.data || []);
            
            // Fetch teacher's exams to get counts
            try {
                const examsRes = await API.get('/teacher/exams');
                const exams = examsRes.data || [];
                
                // Count exams per subject and year
                const counts = {};
                exams.forEach(exam => {
                    const key = `${exam.subject}-${exam.year}`;
                    counts[key] = (counts[key] || 0) + 1;
                });
                setExamsCount(counts);
            } catch (err) {
                console.error("Error fetching exams:", err);
            }
            
            // Fetch students count
            try {
                const studentsRes = await API.get('/teacher/students');
                const studentsData = studentsRes.data;
                if (studentsData && studentsData.studentsBySubject) {
                    const studentCounts = {};
                    studentsData.studentsBySubject.forEach(sbs => {
                        // Use year from the students
                        const key = `${sbs.subject}-${sbs.year || ''}`;
                        studentCounts[key] = (studentCounts[key] || 0) + (sbs.students || 0);
                    });
                    setStudentsCount(studentCounts);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            }
            
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Group subjects by year for display
    const getSubjectsByYear = () => {
        const grouped = {};
        teachingSubjects.forEach(ts => {
            ts.years.forEach(year => {
                const yearKey = `Year ${year}`;
                if (!grouped[yearKey]) {
                    grouped[yearKey] = [];
                }
                grouped[yearKey].push({
                    ...ts,
                    year: year
                });
            });
        });
        return grouped;
    };

    const handleCreateExam = (subject, year) => {
        navigate('/teacher/create-exam', { state: { subject, year } });
    };

    const handleUploadNotes = (subject, year) => {
        navigate('/teacher/upload-material', { state: { subject, year, category: 'notes' } });
    };

    const handleUploadQuestionBank = (subject, year) => {
        navigate('/teacher/upload-material', { state: { subject, year, category: 'question-bank' } });
    };

    // Navigate to Subject Admin Command Center
    const handleSubjectClick = (ts) => {
        navigate(`/teacher/subject/${encodeURIComponent(ts.subject)}/${ts.year}/${ts.section}`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    const subjectsByYear = getSubjectsByYear();
    const years = Object.keys(subjectsByYear);

    return (
        <motion.div 
            className="teacher-dashboard"
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
                        <GraduationCap size={28} />
                    </div>
                    <div>
                        <h1>Teacher Dashboard</h1>
                        <p>Welcome back, {user?.name}!</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Summary */}
            <div className="stats-container">
                <div className="stat-card">
                    <div className="stat-icon">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{teachingSubjects.length}</span>
                        <span className="stat-label">Subjects</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{Object.keys(examsCount).reduce((a, b) => a + examsCount[b], 0)}</span>
                        <span className="stat-label">Exams Created</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{Object.values(studentsCount).reduce((a, b) => a + b, 0)}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </div>
            </div>

            {/* Subjects by Year */}
            {teachingSubjects.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={64} />
                    <h3>No Subjects Assigned</h3>
                    <p>Contact admin to assign subjects to you</p>
                </div>
            ) : (
                <div className="subjects-container">
                    {years.map(year => (
                        <div key={year} className="section-group">
                            <h2 className="section-title">
                                <GraduationCap size={20} />
                                {year}
                            </h2>
                            <div className="subjects-grid">
{subjectsByYear[year].map((ts, index) => {
                                    const key = `${ts.subject}-${ts.year}`;
                                    const examCount = examsCount[key] || 0;
                                    const studentCount = studentsCount[key] || 0;
                                    
                                    return (
                                        <motion.div
                                            key={index}
                                            className="subject-card clickable"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => handleSubjectClick(ts, index)}
                                        >

                                            <div className="subject-header">
                                                <div className="subject-icon">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div className="subject-info">
                                                    <h3>{ts.subject}</h3>
<p>{`Year ${ts.year} • ${ts.department || user.department || 'General'} • ${ts.section}`}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="subject-stats">
                                                <div className="mini-stat">
                                                    <FileText size={14} />
                                                    <span>{examCount} exams</span>
                                                </div>
                                                <div className="mini-stat">
                                                    <Users size={14} />
                                                    <span>{studentCount} students</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .teacher-dashboard {
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

                .page-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 2rem;
                    margin: -2rem -1.5rem 2rem;
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

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    max-width: 1200px;
                    margin: 0 auto 2rem;
                    padding: 0 1.5rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .stat-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .subjects-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .section-group {
                    margin-bottom: 2rem;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.25rem;
                    color: #1e293b;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e2e8f0;
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
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }

                .subject-card.clickable {
                    cursor: pointer;
                }

                .subject-card.clickable:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 12px rgba(0,0,0,0.15);
                    border: 2px solid #667eea;
                }

                .admin-center-badge {
                    margin-left: auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.375rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .subject-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
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
                    flex-shrink: 0;
                }

                .subject-info h3 {
                    font-size: 1.125rem;
                    color: #1e293b;
                    margin: 0 0 0.25rem;
                }

                .subject-info p {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0;
                }

                .subject-stats {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    background: #f8fafc;
                    border-radius: 10px;
                }

                .mini-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .subject-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .action-btn.primary:hover {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    transform: translateY(-2px);
                }

                .action-btn.secondary {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }

                .action-btn.secondary:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    margin: 2rem auto;
                    max-width: 600px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .empty-state svg {
                    color: #94a3b8;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #64748b;
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

                @media (max-width: 768px) {
                    .page-header {
                        text-align: center;
                    }

                    .header-content {
                        flex-direction: column;
                    }

                    .stats-container {
                        grid-template-columns: 1fr;
                    }

                    .subjects-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default TeacherDashboard;

