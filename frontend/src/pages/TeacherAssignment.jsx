import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    Users, 
    UserCheck, 
    BookOpen, 
    ChevronDown, 
    ChevronUp, 
    Search,
    Check,
    X,
    RefreshCw,
    UserPlus,
    GraduationCap
} from 'lucide-react';

const TeacherAssignment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSection, setSelectedSection] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [assignedTeachers, setAssignedTeachers] = useState([]);
    const [saving, setSaving] = useState(false);

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
            const [sectionsRes, teachersRes, studentsRes] = await Promise.all([
                API.get('/admin/sections'),
                API.get('/admin/teachers'),
                API.get('/admin/students/all')
            ]);
            setSections(sectionsRes.data);
            setTeachers(teachersRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Filter students by section and search
    const filteredStudents = students.filter(student => {
        const matchesSection = selectedSection === 'all' || student.section === selectedSection;
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSection && matchesSearch;
    });

    // Handle selecting a student to assign teachers
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setAssignedTeachers(student.assignedTeachers || []);
    };

    // Toggle teacher assignment
    const toggleTeacher = (teacherId) => {
        if (assignedTeachers.includes(teacherId)) {
            setAssignedTeachers(assignedTeachers.filter(id => id !== teacherId));
        } else {
            setAssignedTeachers([...assignedTeachers, teacherId]);
        }
    };

    // Save teacher assignments
    const handleSaveAssignments = async () => {
        if (!selectedStudent) return;
        
        setSaving(true);
        try {
            await API.put('/admin/assign-teachers', {
                studentId: selectedStudent._id,
                teacherIds: assignedTeachers
            });
            
            toast.success("Teachers assigned successfully!");
            
            // Update local student list
            const updatedStudents = students.map(s => {
                if (s._id === selectedStudent._id) {
                    return { ...s, assignedTeachers: assignedTeachers };
                }
                return s;
            });
            setStudents(updatedStudents);
            
            // Update selected student
            setSelectedStudent({ ...selectedStudent, assignedTeachers: assignedTeachers });
            
        } catch (err) {
            console.error("Error assigning teachers:", err);
            toast.error(err.response?.data?.message || "Failed to assign teachers");
        } finally {
            setSaving(false);
        }
    };

    // Get teacher name by ID
    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t._id === teacherId);
        return teacher ? teacher.name : 'Unknown';
    };

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
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <h1>Teacher-Student Assignments</h1>
                        <p>Assign teachers to students for exam access</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={fetchData}>
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </motion.div>

            <div className="assignment-layout">
                {/* Left Column - Student List */}
                <div className="students-panel">
                    <div className="panel-header">
                        <h2>
                            <Users size={20} />
                            Students ({filteredStudents.length})
                        </h2>
                        
                        {/* Department Filter */}
                        <select 
                            className="section-filter"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="all">All Departments</option>
                            {sections.map(section => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="search-box">
                        <Search size={18} />
                        <input 
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Student List */}
                    <div className="students-list">
                        {filteredStudents.length === 0 ? (
                            <div className="empty-state">
                                <Users size={40} />
                                <p>No students found</p>
                            </div>
                        ) : (
                            filteredStudents.map(student => (
                                <motion.div
                                    key={student._id}
                                    className={`student-item ${selectedStudent?._id === student._id ? 'selected' : ''}`}
                                    onClick={() => handleSelectStudent(student)}
                                    whileHover={{ scale: 1.02 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="student-avatar">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="student-info">
                                        <h4>{student.name}</h4>
                                        <p>{student.email}</p>
                                        <span className="section-badge">{student.section || 'No Section'}</span>
                                    </div>
                                    {student.assignedTeachers?.length > 0 && (
                                        <span className="teacher-count">
                                            <UserCheck size={14} />
                                            {student.assignedTeachers.length}
                                        </span>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Teacher Assignment */}
                <div className="teachers-panel">
                    {selectedStudent ? (
                        <>
                            <div className="panel-header">
                                <h2>
                                    <BookOpen size={20} />
                                    Assign Teachers to {selectedStudent.name}
                                </h2>
                            </div>

                            <div className="selected-student-info">
                                <div className="info-row">
                                    <span className="label">Email:</span>
                                    <span>{selectedStudent.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Section:</span>
                                    <span>{selectedStudent.section || 'Not assigned'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Current Teachers:</span>
                                    <span>
                                        {selectedStudent.assignedTeachers?.length > 0 
                                            ? selectedStudent.assignedTeachers.map(id => getTeacherName(id)).join(', ')
                                            : 'None'
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="teachers-list">
                                <h3>Available Teachers</h3>
                                {teachers.length === 0 ? (
                                    <div className="empty-state">
                                        <BookOpen size={40} />
                                        <p>No teachers found</p>
                                    </div>
                                ) : (
                                    teachers.map(teacher => (
                                        <motion.div
                                            key={teacher._id}
                                            className={`teacher-item ${assignedTeachers.includes(teacher._id) ? 'selected' : ''}`}
                                            onClick={() => toggleTeacher(teacher._id)}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="teacher-checkbox">
                                                {assignedTeachers.includes(teacher._id) && (
                                                    <Check size={16} />
                                                )}
                                            </div>
                                            <div className="teacher-info">
                                                <h4>{teacher.name}</h4>
                                                <p>{teacher.email}</p>
                                                <span className="section-badge">{teacher.section || 'No Section'}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="action-buttons">
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSaveAssignments}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner spinner-sm"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Save Assignments
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-selection">
                            <UserPlus size={64} />
                            <h3>Select a Student</h3>
                            <p>Click on a student from the list to assign teachers</p>
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

                .assignment-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }

                .students-panel, .teachers-panel {
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
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .panel-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.25rem;
                    color: #111827;
                    margin: 0;
                }

                .section-filter {
                    padding: 0.5rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }

                .search-box input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-size: 0.875rem;
                    outline: none;
                }

                .search-box svg {
                    color: #9ca3af;
                }

                .students-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .student-item {
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

                .student-item:hover {
                    background: #f1f5f9;
                }

                .student-item.selected {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }

                .student-avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .student-info {
                    flex: 1;
                }

                .student-info h4 {
                    font-size: 1rem;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .student-info p {
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

                .teacher-count {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    background: #dcfce7;
                    color: #16a34a;
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

                .selected-student-info {
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

                .teachers-list h3 {
                    font-size: 1rem;
                    color: #374151;
                    margin-bottom: 1rem;
                }

                .teachers-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 1.5rem;
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
                    border-color: #22c55e;
                    background: rgba(34, 197, 94, 0.05);
                }

                .teacher-checkbox {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .teacher-item.selected .teacher-checkbox {
                    background: #22c55e;
                    border-color: #22c55e;
                    color: white;
                }

                .teacher-info {
                    flex: 1;
                }

                .teacher-info h4 {
                    font-size: 0.875rem;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .teacher-info p {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0 0 0.25rem;
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

export default TeacherAssignment;

