import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
    FileText, 
    Upload, 
    Trash2, 
    File, 
    FilePlus,
    BookOpen,
    Download,
    X,
    Image,
    FileIcon,
    Presentation
} from 'lucide-react';

const StudyMaterials = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notes');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: 'notes',
        file: null
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!user.isAdmin) {
            navigate('/');
            return;
        }
        fetchMaterials();
    }, [user, navigate]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/materials');
            setMaterials(data);
        } catch (err) {
            console.error("Error fetching materials:", err);
            toast.error("Failed to load materials");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadData({ ...uploadData, file });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!uploadData.title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        
        if (!uploadData.file) {
            toast.error("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('category', uploadData.category);
        formData.append('file', uploadData.file);

        try {
            setUploading(true);
            console.log("Uploading file:", uploadData.file.name);
            const response = await API.post('/materials', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log("Upload response:", response.data);
            toast.success("Material uploaded successfully!");
            setShowUploadModal(false);
            setUploadData({ title: '', description: '', category: 'notes', file: null });
            fetchMaterials();
        } catch (err) {
            console.error("Upload error:", err);
            console.error("Error response:", err.response?.data);
            toast.error(err.response?.data?.message || "Failed to upload material");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this material?")) {
            return;
        }

        try {
            await API.delete(`/materials/${id}`);
            toast.success("Material deleted successfully");
            fetchMaterials();
        } catch (err) {
            console.error("Error deleting:", err);
            toast.error("Failed to delete material");
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

    const filteredMaterials = materials.filter(m => m.category === activeTab);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner spinner-lg"></div>
                <p>Loading materials...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className="study-materials-page"
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
                        <h1>Study Materials & Question Bank</h1>
                        <p>Upload and manage study notes and question papers</p>
                    </div>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowUploadModal(true)}
                >
                    <Upload size={18} />
                    Upload Material
                </button>
            </motion.div>

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
                    <FilePlus size={18} />
                    Question Bank (MCQ PDFs)
                </button>
            </div>

            {/* Materials Grid */}
            <div className="materials-grid">
                {filteredMaterials.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <h3>No Materials Yet</h3>
                        <p>Upload your first {activeTab === 'notes' ? 'study notes' : 'question bank PDF'} to get started</p>
                    </div>
                ) : (
                    filteredMaterials.map((material, index) => (
                        <motion.div 
                            key={material._id}
                            className="material-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="material-icon">
                                {getFileIcon(material.fileType)}
                            </div>
                            <div className="material-info">
                                <h3>{material.title}</h3>
                                {material.description && <p className="description">{material.description}</p>}
                                <span className="file-name">
                                    {material.fileName}
                                </span>
                                <span className="upload-date">
                                    {new Date(material.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="material-actions">
                                <a 
                                    href={`http://localhost:5000${material.file}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn-download"
                                >
                                    <Download size={16} />
                                </a>
                                <button 
                                    className="btn-delete"
                                    onClick={() => handleDelete(material._id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <motion.div 
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowUploadModal(false)}
                >
                    <motion.div 
                        className="upload-modal"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>Upload Study Material</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowUploadModal(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="upload-form">
                            <div className="form-group">
                                <label>Category *</label>
                                <select 
                                    value={uploadData.category}
                                    onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                                >
                                    <option value="notes">Study Notes</option>
                                    <option value="question-bank">Question Bank (MCQ PDF)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Title *</label>
                                <input 
                                    type="text"
                                    placeholder="Enter title..."
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    placeholder="Enter description..."
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>File * (PDF, DOC, DOCX, PPT, PPTX, TXT, Images)</label>
                                <div className="file-input-wrapper">
                                    <input 
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                        onChange={handleFileChange}
                                        id="file-input"
                                    />
                                    <label htmlFor="file-input" className="file-input-label">
                                        {uploadData.file ? (
                                            <><FileIcon size={18} /> {uploadData.file.name}</>
                                        ) : (
                                            <><Upload size={18} /> Choose File</>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Material'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            <style>{`
                .study-materials-page {
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

                .page-header {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
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

                .tabs-container {
                    display: flex;
                    gap: 1rem;
                    padding: 0 1.5rem;
                    margin-bottom: 2rem;
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

                .materials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                    padding: 0 1.5rem;
                }

                .material-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                }

                .material-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 12px rgba(0,0,0,0.15);
                }

                .material-icon {
                    width: 56px;
                    height: 56px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .file-icon {
                    width: 28px;
                    height: 28px;
                }

                .file-icon.pdf { color: #dc2626; }
                .file-icon.doc { color: #2563eb; }
                .file-icon.ppt { color: #f97316; }
                .file-icon.image { color: #16a34a; }

                .material-info {
                    flex: 1;
                }

                .material-info h3 {
                    font-size: 1.125rem;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }

                .material-info .description {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }

                .material-info .file-name {
                    display: block;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-bottom: 0.25rem;
                }

                .material-info .upload-date {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .material-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-download, .btn-delete {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-download {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .btn-download:hover {
                    background: #16a34a;
                    color: white;
                }

                .btn-delete {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .btn-delete:hover {
                    background: #dc2626;
                    color: white;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 16px;
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

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    transform: translateY(-2px);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-lg {
                    width: 100%;
                    justify-content: center;
                    padding: 1rem;
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
                    padding: 1rem;
                }

                .upload-modal {
                    background: white;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .modal-header h2 {
                    font-size: 1.25rem;
                    color: #1e293b;
                    margin: 0;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                }

                .close-btn:hover {
                    background: #f1f5f9;
                }

                .upload-form {
                    padding: 1.5rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                }

                .form-group input[type="text"],
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .file-input-wrapper {
                    position: relative;
                }

                .file-input-wrapper input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                }

                .file-input-label {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 2rem;
                    border: 2px dashed #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .file-input-label:hover {
                    border-color: #667eea;
                    color: #667eea;
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

export default StudyMaterials;

