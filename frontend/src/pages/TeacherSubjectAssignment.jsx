import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    BookOpen, 
    Users, 
    ChevronDown, 
    ChevronUp, 
    Plus, 
    Trash2, 
    Save,
    RefreshCw,
    GraduationCap,
    Calendar,
    X
} from 'lucide-react';

const TeacherSubjectAssignment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [teachers, setTeachers] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teachingSubjects, setTeachingSubjects] = useState([]);

    // Fetch data on mount
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sectionsRes, teachersRes] = await Promise.all([
                API.get('/admin/sections'),
                API.get('/admin/teachers')
            ]);
            setSections(sectionsRes.data);
            setTeachers(teachersRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Add new subject entry
    const addSubject = () => {
        setTeachingSubjects([
            ...teachingSubjects,
            { subject: '', years: [], section: '' }
        ]);
    };

    // Remove subject entry
    const removeSubject = (index) => {
        setTeachingSubjects(teachingSubjects.filter((_, i) => i !== index));
    };

    // Update subject field
    const updateSubject = (index, field, value) => {
        const updated = [...teachingSubjects];
        updated[index][field] = value;
        setTeachingSubjects(updated);
    };

    // Toggle year selection
    const toggleYear = (index, year) => {
        const updated = [...teachingSubjects];
        const years = updated[index].years;
        if (years.includes(year)) {
            updated[index].years = years.filter(y => y !== year);
        } else {
            updated[index].years = [...years, year];
        }
        setTeachingSubjects(updated);
    };

    // Select a teacher to edit
    const handleSelectTeacher = (teacher) => {
        setSelectedTeacher(teacher);
        setTeachingSubjects(teacher.teachingSubjects || []);
    };

    // Save teaching subjects
    const handleSave = async () => {
        if (!selectedTeacher) return;
        
        // Validate
        for (const ts of teachingSubjects) {
            if (!ts.subject.trim()) {
                toast.error("Please enter subject name for all entries");
                return;
            }
            if (!ts.section.trim()) {
                toast.error("Please select a section for all entries");
                return;
            }
            if (ts.years.length === 0) {
                toast.error("Please select at least one year for each subject");
                return;
            }
        }

        setSaving(true);
        try {
            await API.put('/admin/update-teacher-subjects', {
                teacherId: selectedTeacher._id,
                teachingSubjects
            });
            
            toast.success("Teaching subjects saved successfully!");
            
            // Update local teacher list
            const updatedTeachers = teachers.map(t => {
                if (t._id === selectedTeacher._id) {
                    return { ...t, teachingSubjects };
                }
                return t;
            });
            setTeachers(updatedTeachers);
            setSelectedTeacher({ ...selectedTeacher, teachingSubjects });
            
        } catch (err) {
            console.error("Error saving:", err);
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    // Get teacher's display subjects
    const getTeacherSubjects = (teacher) => {
        if (!teacher.teachingSubjects || teacher.teachingSubjects.length === 0) {
            return 'No subjects assigned';
        }
        return teacher.teachingSubjects.map(ts => 
            `${ts.subject} (${ts.years.join(', ')}) - ${ts.section}`
        ).join(', ');
    };

    const years = [1, 2, 3, 4];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="assignment-page"
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
                        <h1>Teacher Subject Assignment</h1>
                        <p>Assign subjects and years to teachers</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={fetchData}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </motion.div>

            <div className="assignment-layout">
                {/* Left Column - Teacher List */}
                <div className="teachers-panel">
                    <div className="panel-header">
                        <h2>
                            <Users size={20} />
                            Teachers ({teachers.length})
                        </h2>
                    </div>

                    {/* Teacher List */}
                    <div className="teachers-list">
                        {teachers.length === 0 ? (
                            <div className="empty-state">
                                <Users size={40} />
                                <p>No teachers found</p>
                            </div>
                        ) : (
                            teachers.map(teacher => (
                                <motion.div
                                    key={teacher._id}
                                    className={`teacher-item ${selectedTeacher?._id === teacher._id ? 'selected' : ''}`}
                                    onClick={() => handleSelectTeacher(teacher)}
                                    whileHover={{ scale: 1.02 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="teacher-avatar">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="teacher-info">
                                        <h4>{teacher.name}</h4>
                                        <p>{teacher.email}</p>
                                        <span className="section-badge">{teacher.section || 'No Section'}</span>
                                    </div>
                                    {teacher.teachingSubjects?.length > 0 && (
                                        <span className="subject-count">
                                            <BookOpen size={14} />
                                            {teacher.teachingSubjects.length}
                                        </span>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Subject Assignment */}
                <div className="subjects-panel">
                    {selectedTeacher ? (
                        <>
                            <div className="panel-header">
                                <h2>
                                    <BookOpen size={20} />
                                    Assign Subjects to {selectedTeacher.name}
                                </h2>
                            </div>

                            <div className="selected-teacher-info">
                                <div className="info-row">
                                    <span className="label">Email:</span>
                                    <span>{selectedTeacher.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Department:</span>
                                    <span>{selectedTeacher.department || 'Not assigned'}</span>
                                </div>
                            </div>

                            {/* Subject Entries */}
                            <div className="subjects-list">
                                <h3>Teaching Subjects</h3>
                                
                                {teachingSubjects.length === 0 ? (
                                    <div className="empty-state">
                                        <BookOpen size={40} />
                                        <p>No subjects added yet</p>
                                    </div>
                                ) : (
                                    teachingSubjects.map((ts, index) => (
                                        <motion.div
                                            key={index}
                                            className="subject-entry"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="subject-header">
                                                <span className="entry-number">#{index + 1}</span>
                                                <button 
                                                    className="btn-remove"
                                                    onClick={() => removeSubject(index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="subject-fields">
                                                <div className="field-group">
                                                    <label>Subject Name</label>
                                                    <input 
                                                        type="text"
                                                        placeholder="e.g., Mathematics, Data Structures"
                                                        value={ts.subject}
                                                        onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                                                    />
                                                </div>
                                                
                                                <div className="field-group">
                                                    <label>Section</label>
                                                    <select
                                                        className="form-input"
                                                        value={ts.section}
                                                        onChange={(e) => updateSubject(index, 'section', e.target.value)}
                                                    >
                                                        <option value="">Select Section</option>
                                                        <option value="A">Section A</option>
                                                        <option value="B">Section B</option>
                                                        <option value="C">Section C</option>
                                                        <option value="D">Section D</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="field-group">
                                                    <label>Years</label>
                                                    <div className="years-selector">
                                                        {years.map(year => (
                                                            <button
                                                                key={year}
                                                                className={`year-btn ${ts.years.includes(year) ? 'selected' : ''}`}
                                                                onClick={() => toggleYear(index, year)}
                                                            >
                                                                Year {year}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}

                                <button className="btn btn-add" onClick={addSubject}>
                                    <Plus size={18} />
                                    Add Subject
                                </button>
                            </div>

                            <div className="action-buttons">
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving || teachingSubjects.length === 0}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner spinner-sm"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Subjects
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-selection">
                            <BookOpen size={64} />
                            <h3>Select a Teacher</h3>
                            <p>Click on a teacher from the list to assign subjects</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .assignment-page {
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
                    width: 100%;
                    justify-content: center;
                    padding: 1rem;
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-add {
                    background: #f1f5f9;
                    color: #374151;
                    border: 2px dashed #cbd5e1;
                    width: 100%;
                    justify-content: center;
                    margin-top: 1rem;
                }

                .btn-add:hover {
                    background: #e2e8f0;
                    border-color: #94a3b8;
                }

                .assignment-layout {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .teachers-panel, .subjects-panel {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .panel-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.25rem;
                    color: #111827;
                    margin: 0;
                }

                .teachers-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .teacher-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 12px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }

                .teacher-item:hover {
                    background: #f1f5f9;
                }

                .teacher-item.selected {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }

                .teacher-avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .teacher-info {
                    flex: 1;
                }

                .teacher-info h4 {
                    font-size: 1rem;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .teacher-info p {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0 0 0.5rem;
                }

                .section-badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    background: #e5e7eb;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #374151;
                }

                .subject-count {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    background: #dbeafe;
                    color: #2563eb;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #9ca3af;
                }

                .empty-state svg {
                    margin-bottom: 1rem;
                }

                .selected-teacher-info {
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .info-row .label {
                    font-weight: 500;
                    color: #6b7280;
                }

                .subjects-list h3 {
                    font-size: 1rem;
                    color: #374151;
                    margin-bottom: 1rem;
                }

                .subjects-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .subject-entry {
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 1rem;
                    border: 1px solid #e5e7eb;
                }

                .subject-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .entry-number {
                    font-weight: 600;
                    color: #667eea;
                }

                .btn-remove {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .btn-remove:hover {
                    background: #fee2e2;
                }

                .subject-fields {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .field-group label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                }

                .field-group input,
                .field-group select {
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    background: white;
                }

                .field-group input:focus,
                .field-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .years-selector {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .year-btn {
                    padding: 0.5rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }

                .year-btn:hover {
                    border-color: #667eea;
                }

                .year-btn.selected {
                    background: #667eea;
                    border-color: #667eea;
                    color: white;
                }

                .action-buttons {
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                }

                .empty-selection {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    color: #9ca3af;
                    text-align: center;
                }

                .empty-selection svg {
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-selection h3 {
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .empty-selection p {
                    color: #6b7280;
                    margin: 0;
                }

                .spinner {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .assignment-layout {
                        grid-template-columns: 1fr;
                    }
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
                }
            `}</style>
        </motion.div>
    );
};

export default TeacherSubjectAssignment;

