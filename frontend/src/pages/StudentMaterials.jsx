import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FileText, 
    Download, 
    File, 
    BookOpen,
    Image,
    FileIcon,
    Presentation,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const StudentMaterials = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get pre-selected subject and year from navigation state
    const preSelectedSubject = location.state?.subject || '';
    const preSelectedYear = location.state?.year || '';
    const preSelectedSection = location.state?.section || '';
    
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notes');
    const [selectedSubject, setSelectedSubject] = useState(preSelectedSubject);
    const [selectedYear, setSelectedYear] = useState(preSelectedYear);
    const [enrolledSubjects, setEnrolledSubjects] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        // Get enrolled subjects from user
        if (user.enrolledSubjects && user.enrolledSubjects.length > 0) {
            setEnrolledSubjects(user.enrolledSubjects);
            if (!selectedSubject) {
                setSelectedSubject(user.enrolledSubjects[0]?.subject || '');
            }
        } else if (user.teachingSubjects && user.teachingSubjects.length > 0) {
            // For teachers, use teaching subjects
            setEnrolledSubjects(user.teachingSubjects);
            if (!selectedSubject) {
                setSelectedSubject(user.teachingSubjects[0]?.subject || '');
            }
        }
        // If no enrolled subjects, we'll fetch all materials
    }, [user, navigate]);

    useEffect(() => {
        // Always fetch materials when user is logged in
        if (user) {
            fetchMaterials();
        }
    }, [selectedSubject, selectedYear, activeTab, user]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            
            // If we have enrolled subjects and a selected subject, filter by subject
            // Otherwise, fetch all materials
            if (selectedSubject) {
                const params = new URLSearchParams();
                params.append('subject', selectedSubject);
                if (selectedYear) {
                    params.append('year', selectedYear);
                }
                if (activeTab) {
                    params.append('category', activeTab);
                }
                const { data } = await API.get(`/materials/subject?${params.toString()}`);
                setMaterials(data || []);
            } else {
                // Fetch all materials when no subject selected
                const params = new URLSearchParams();
                if (selectedYear) {
                    params.append('year', selectedYear);
                }
                if (activeTab) {
                    params.append('category', activeTab);
                }
                const { data } = await API.get(`/materials?${params.toString()}`);
                setMaterials(data || []);
            }
        } catch (err) {
            console.error("Error fetching materials:", err);
            toast.error("Failed to load materials");
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'pdf':
                return <FileIcon className="file-icon pdf" />;
            case 'doc':
            case 'docx':
                return <FileIcon className="file-icon doc" />;
            case 'ppt':
            case 'pptx':
                return <Presentation className="file-icon ppt" />;
            case 'image':
                return <Image className="file-icon image" />;
            default:
                return <File className="file-icon" />;
        }
    };

    // Get unique subjects
    const getUniqueSubjects = () => {
        const subjects = new Set();
        enrolledSubjects.forEach(subj => {
            if (subj.subject) {
                subjects.add(subj.subject);
            }
        });
        return Array.from(subjects);
    };

    // Get years for selected subject
    const getYearsForSubject = () => {
        const subject = enrolledSubjects.find(s => s.subject === selectedSubject);
        return subject ? subject.years || [] : [];
    };

    const handleSubjectChange = (subject) => {
        setSelectedSubject(subject);
        setSelectedYear(''); // Reset year when subject changes
    };

    const filteredMaterials = materials.filter(m => m.category === activeTab);

    if (loading && !materials.length) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading materials...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="student-materials-page"
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
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1>Study Materials</h1>
                        <p>Access study notes and question papers</p>
                    </div>
                </div>
            </motion.div>

            {/* Subject and Year Filter */}
            {getUniqueSubjects().length > 0 && (
                <div className="filter-section">
                    <button 
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span>Filters</span>
                        {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    
                    {showFilters && (
                        <motion.div 
                            className="filters"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            <div className="filter-group">
                                <label>Subject</label>
                                <select 
                                    value={selectedSubject}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                >
                                    <option value="">All Subjects</option>
                                    {getUniqueSubjects().map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label>Year</label>
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    disabled={!selectedSubject}
                                >
                                    <option value="">All Years</option>
                                    {getYearsForSubject().map(year => (
                                        <option key={year} value={year}>Year {year}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Active Filters Display */}
            {(selectedSubject || selectedYear) && (
                <div className="active-filters">
                    {selectedSubject && (
                        <span className="filter-badge">
                            Subject: {selectedSubject}
                            <button onClick={() => setSelectedSubject('')}>×</button>
                        </span>
                    )}
                    {selectedYear && (
                        <span className="filter-badge">
                            Year: {selectedYear}
                            <button onClick={() => setSelectedYear('')}>×</button>
                        </span>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container">
                <button 
                    className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                >
                    <FileText size={18} />
                    Study Notes
                </button>
                <button 
                    className={`tab ${activeTab === 'question-bank' ? 'active' : ''}`}
                    onClick={() => setActiveTab('question-bank')}
                >
                    <FileText size={18} />
                    Question Bank
                </button>
            </div>

            {/* Materials Grid */}
            <div className="materials-container">
                {filteredMaterials.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>No Materials Available</h3>
                        <p>Study materials will appear here once uploaded by your instructor</p>
                        {selectedSubject && (
                            <p className="filter-info">
                                Showing materials for: <strong>{selectedSubject}</strong>
                                {selectedYear && ` - Year ${selectedYear}`}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="materials-grid">
                        {filteredMaterials.map((material, index) => (
                            <motion.div 
                                key={material._id}
                                className="material-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="card-header">
                                    <div className="material-icon">
                                        {getFileIcon(material.fileType)}
                                    </div>
                                    <span className="file-type-badge">{material.fileType.toUpperCase()}</span>
                                </div>
                                <div className="card-body">
                                    <h3>{material.title}</h3>
                                    {material.description && <p className="description">{material.description}</p>}
                                    <div className="material-tags">
                                        {material.subject && (
                                            <span className="tag subject-tag">{material.subject}</span>
                                        )}
                                        {material.year && (
                                            <span className="tag year-tag">Year {material.year}</span>
                                        )}
                                    </div>
                                    <span className="file-name">
                                        <File size={14} />
                                        {material.fileName}
                                    </span>
                                </div>
                                <div className="card-footer">
                                    <span className="upload-date">
                                        Uploaded: {new Date(material.createdAt).toLocaleDateString()}
                                    </span>
                                    <a 
                                        href={`http://localhost:5000${material.file}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-download"
                                    >
                                        <Download size={18} />
                                        Download
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .student-materials-page {
                    min-height: 100vh;
                    background: #f8fafc;
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

                /* Filter Section */
                .filter-section {
                    max-width: 1200px;
                    margin: 0 auto 1.5rem;
                    padding: 0 1.5rem;
                }

                .filter-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-toggle:hover {
                    border-color: #667eea;
                    color: #667eea;
                }

                .filters {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding: 1.5rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .filter-group label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                }

                .filter-group select {
                    padding: 0.625rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 0.938rem;
                    min-width: 200px;
                    background: white;
                }

                .filter-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                /* Active Filters */
                .active-filters {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    max-width: 1200px;
                    margin: 0 auto 1.5rem;
                    padding: 0 1.5rem;
                }

                .filter-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #e0e7ff;
                    color: #4338ca;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .filter-badge button {
                    background: none;
                    border: none;
                    color: #4338ca;
                    cursor: pointer;
                    font-size: 1.25rem;
                    line-height: 1;
                    padding: 0;
                }

                .tabs-container {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    padding: 0 1rem;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 2rem;
                    background: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .tab:hover {
                    color: #667eea;
                }

                .tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .materials-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .materials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .material-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }

                .material-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 20px rgba(0,0,0,0.15);
                }

                .card-header {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .material-icon {
                    width: 56px;
                    height: 56px;
                    background: white;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .file-icon {
                    width: 28px;
                    height: 28px;
                }

                .file-icon.pdf { color: #dc2626; }
                .file-icon.doc { color: #2563eb; }
                .file-icon.ppt { color: #f97316; }
                .file-icon.image { color: #16a34a; }

                .file-type-badge {
                    padding: 0.375rem 0.75rem;
                    background: white;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                }

                .card-body {
                    padding: 1.5rem;
                }

                .card-body h3 {
                    font-size: 1.125rem;
                    color: #1e293b;
                    margin-bottom: 0.75rem;
                    line-height: 1.4;
                }

                .card-body .description {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .material-tags {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-bottom: 0.75rem;
                }

                .tag {
                    padding: 0.25rem 0.625rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .subject-tag {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .year-tag {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .card-body .file-name {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .card-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .upload-date {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .btn-download {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .btn-download:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
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

                .empty-state .filter-info {
                    margin-top: 1rem;
                    font-size: 0.875rem;
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
            `}</style>
        </motion.div>
    );
};

export default StudentMaterials;

