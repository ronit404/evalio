import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import API from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    Plus, Upload, Image as ImageIcon, X, Check, Trash2, 
    AlignLeft, List
} from 'lucide-react';

const AddQuestion = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        questionText: '',
        category: '',
        questionType: 'mcq',
        isMultipleCorrect: false,
        expectedAnswer: ''
    });
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Check authentication on mount
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            toast.error('Please login to access this page');
            navigate('/login');
        }
    }, [navigate]);

    // Get subject from navigation state
    const location = useLocation();
    useEffect(() => {
        if (location.state?.subject) {
            setFormData(prev => ({
                ...prev,
                category: location.state.subject
            }));
        }
    }, [location]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        } else {
            toast.error('Maximum 6 options allowed');
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            
            // Also remove from correct answers if present
            const optionLetter = String.fromCharCode(65 + index);
            setCorrectAnswers(correctAnswers.filter(ans => ans !== optionLetter));
            if (correctAnswer === options[index]) {
                setCorrectAnswer('');
            }
        } else {
            toast.error('Minimum 2 options required for MCQ');
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const toggleCorrectAnswer = (index) => {
        const optionLetter = String.fromCharCode(65 + index);
        const optionValue = options[index];
        
        if (!optionValue.trim()) {
            toast.error('Please enter the option text first');
            return;
        }

        if (formData.isMultipleCorrect) {
            if (correctAnswers.includes(optionLetter)) {
                setCorrectAnswers(correctAnswers.filter(ans => ans !== optionLetter));
            } else {
                setCorrectAnswers([...correctAnswers, optionLetter]);
            }
        } else {
            setCorrectAnswer(optionValue);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validation
            if (!formData.questionText.trim()) {
                toast.error('Please enter question text');
                setIsLoading(false);
                return;
            }

            if (formData.questionType === 'mcq') {
                const validOptions = options.filter(opt => opt.trim() !== '');
                if (validOptions.length < 2) {
                    toast.error('Please add at least 2 options');
                    setIsLoading(false);
                    return;
                }

                if (formData.isMultipleCorrect) {
                    if (correctAnswers.length < 1) {
                        toast.error('Please select at least one correct answer');
                        setIsLoading(false);
                        return;
                    }
                } else {
                    if (!correctAnswer) {
                        toast.error('Please select the correct answer');
                        setIsLoading(false);
                        return;
                    }
                }
            }

            const data = new FormData();
            data.append('questionText', formData.questionText);
            data.append('category', formData.category);
            data.append('questionType', formData.questionType);
            data.append('isMultipleCorrect', formData.isMultipleCorrect);
            
            if (image) {
                data.append('image', image);
            }

            if (formData.questionType === 'mcq') {
                const validOptions = options.filter(opt => opt.trim() !== '');
                data.append('options', JSON.stringify(validOptions));
                
                if (formData.isMultipleCorrect) {
                    // Map letter codes to actual option values
                    const correctOptionValues = correctAnswers.map(letter => 
                        options[letter.charCodeAt(0) - 65]
                    );
                    data.append('correctAnswers', JSON.stringify(correctOptionValues));
                } else {
                    data.append('correctAnswer', correctAnswer);
                }
            } else {
                data.append('expectedAnswer', formData.expectedAnswer || '');
            }

            await API.post('/teacher/add-question', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Question added successfully! ✅');
            
            // Reset form
            setFormData({
                questionText: '',
                category: formData.category, // Keep the category
                questionType: 'mcq',
                isMultipleCorrect: false,
                expectedAnswer: ''
            });
            setOptions(['', '', '', '']);
            setCorrectAnswers([]);
            setCorrectAnswer('');
            setImage(null);
            setImagePreview(null);
            
        } catch (err) {
            toast.error(err.response?.data?.message || "Error adding question");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="add-question-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster position="top-right" />
            
            <div className="page-header">
                <motion.div 
                    className="header-icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                >
                    <Plus size={28} />
                </motion.div>
                <div>
                    <h1>Add New Question</h1>
                    <p>Create a new question for your question bank</p>
                </div>
            </div>

            <motion.div 
                className="form-container"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <form onSubmit={handleSubmit}>
                    {/* Question Type Selection */}
                    <div className="form-section">
                        <h3>
                            <span className="section-number">1</span>
                            Question Type
                        </h3>
                        
                        <div className="question-type-selector">
                            <motion.div 
                                className={`type-card ${formData.questionType === 'mcq' ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, questionType: 'mcq'})}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="type-icon">
                                    <List size={24} />
                                </div>
                                <div className="type-content">
                                    <h4>Multiple Choice (MCQ)</h4>
                                    <p>Students select from provided options</p>
                                </div>
                                {formData.questionType === 'mcq' && (
                                    <div className="check-badge">
                                        <Check size={20} />
                                    </div>
                                )}
                            </motion.div>

                            <motion.div 
                                className={`type-card ${formData.questionType === 'detailed' ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, questionType: 'detailed'})}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="type-icon">
                                    <AlignLeft size={24} />
                                </div>
                                <div className="type-content">
                                    <h4>Detailed Answer</h4>
                                    <p>Students write detailed responses</p>
                                </div>
                                {formData.questionType === 'detailed' && (
                                    <div className="check-badge">
                                        <Check size={20} />
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* Question Text */}
                    <div className="form-section">
                        <h3>
                            <span className="section-number">2</span>
                            Question Details
                        </h3>
                        
                        <div className="form-group">
                            <label className="form-label">Question Text *</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Enter your question here..."
                                value={formData.questionText}
                                onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                                required
                                rows={4}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <select
                                className="form-select"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="">Select a subject</option>
                                {user?.teachingSubjects?.map((subj, index) => (
                                    <option key={index} value={subj.subject}>
                                        {subj.subject} 
                                        {subj.section ? ` (${subj.section})` : ''}
                                        {subj.years?.length ? ` - Year ${subj.years.join(', ')}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Question Image (Optional)</label>
                            <div className="image-upload-area">
                                {imagePreview ? (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                        <button 
                                            type="button"
                                            className="remove-image"
                                            onClick={removeImage}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <Upload size={40} />
                                        <p>Drag and drop or click to upload</p>
                                        <span>PNG, JPG up to 5MB</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="file-input"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* MCQ Options */}
                    {formData.questionType === 'mcq' && (
                        <div className="form-section">
                            <h3>
                                <span className="section-number">3</span>
                                Answer Options
                            </h3>
                            
{/* Multiple Correct Answers Toggle */}
                            <div className="multiple-toggle">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isMultipleCorrect}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                // Turning ON multiple correct - clear single answer and set to multiple
                                                setFormData({...formData, isMultipleCorrect: true});
                                                setCorrectAnswers([]);
                                                setCorrectAnswer('');
                                            } else {
                                                // Turning OFF multiple correct - clear multiple answers and set to single
                                                setFormData({...formData, isMultipleCorrect: false});
                                                setCorrectAnswers([]);
                                                setCorrectAnswer('');
                                            }
                                        }}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                                <div className="toggle-label">
                                    <span>Multiple Correct Answers</span>
                                    <small>Allow students to select more than one correct answer</small>
                                </div>
                            </div>

                            {/* Options Grid */}
                            <div className="options-grid">
                                {options.map((option, index) => (
                                    <motion.div 
                                        key={index}
                                        className={`option-input-group ${
                                            formData.isMultipleCorrect 
                                                ? (correctAnswers.includes(String.fromCharCode(65 + index)) ? 'correct-selected' : '')
                                                : (correctAnswer === options[index] ? 'correct-selected' : '')
                                        }`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                    >
                                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                className="remove-option"
                                                onClick={() => removeOption(index)}
                                                title="Remove option"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <label className="correct-checkbox">
                                            <input
                                                type={formData.isMultipleCorrect ? "checkbox" : "radio"}
                                                name="correctAnswer"
                                                checked={
                                                    formData.isMultipleCorrect
                                                        ? correctAnswers.includes(String.fromCharCode(65 + index))
                                                        : correctAnswer === options[index]
                                                }
                                                onChange={() => toggleCorrectAnswer(index)}
                                            />
                                            <span className={`check-mark ${formData.isMultipleCorrect ? 'checkbox' : 'radio'}`}>
                                                {formData.isMultipleCorrect && correctAnswers.includes(String.fromCharCode(65 + index)) && (
                                                    <Check size={12} />
                                                )}
                                                {!formData.isMultipleCorrect && (
                                                    <span className="radio-dot"></span>
                                                )}
                                            </span>
                                        </label>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Add Option Button */}
                            {options.length < 6 && (
                                <motion.button
                                    type="button"
                                    className="btn btn-secondary add-option-btn"
                                    onClick={addOption}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Plus size={18} />
                                    Add Option
                                </motion.button>
                            )}

                            <p className="helper-text">
                                <ImageIcon size={16} />
                                {formData.isMultipleCorrect 
                                    ? 'Select all correct answers by checking the boxes'
                                    : 'Select the radio button next to the correct answer'
                                }
                            </p>
                        </div>
                    )}

                    {/* Detailed Answer Section */}
                    {formData.questionType === 'detailed' && (
                        <div className="form-section">
                            <h3>
                                <span className="section-number">3</span>
                                Expected Answer & Guidelines
                            </h3>
                            
                            <div className="form-group">
                                <label className="form-label">Expected Answer / Key Points (Optional)</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Enter the expected answer or key points that students should cover..."
                                    value={formData.expectedAnswer}
                                    onChange={(e) => setFormData({...formData, expectedAnswer: e.target.value})}
                                    rows={6}
                                />
                                <span className="helper-hint">
                                    This will be used as a guide for grading. Leave blank for open-ended responses.
                                </span>
                            </div>

                            <div className="detailed-info">
                                <div className="info-icon">💡</div>
                                <div className="info-content">
                                    <h4>Detailed Questions</h4>
                                    <p>
                                        Students will see a large text area to write their answers. 
                                        Make sure your question clearly states what you're looking for.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <motion.div 
                        className="form-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => {
                                setFormData({
                                    questionText: '',
                                    category: '',
                                    questionType: 'mcq',
                                    isMultipleCorrect: false,
                                    expectedAnswer: ''
                                });
                                setOptions(['', '', '', '']);
                                setCorrectAnswers([]);
                                setCorrectAnswer('');
                                setImage(null);
                                setImagePreview(null);
                            }}
                        >
                            Clear Form
                        </button>
                        <motion.button 
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    Add Question
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </form>
            </motion.div>

            <style>{`
                .add-question-page {
                    min-height: 100vh;
                    background: #f1f5f9;
                    padding: 2rem 1.5rem;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .header-icon {
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }

                .page-header h1 {
                    font-size: 1.75rem;
                    color: #111827;
                    margin-bottom: 0.25rem;
                }

                .page-header p {
                    color: #6b7280;
                    margin: 0;
                }

                .form-container {
                    background: white;
                    border-radius: 24px;
                    padding: 2.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    max-width: 900px;
                }

                .form-section {
                    margin-bottom: 2.5rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .form-section:last-of-type {
                    border-bottom: none;
                    margin-bottom: 2rem;
                }

                .form-section h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.25rem;
                    color: #111827;
                    margin-bottom: 1.5rem;
                }

                .section-number {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                /* Question Type Selector */
                .question-type-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .type-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.25rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .type-card:hover {
                    border-color: #667eea;
                }

                .type-card.active {
                    border-color: #667eea;
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
                }

                .type-icon {
                    width: 48px;
                    height: 48px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #6b7280;
                    flex-shrink: 0;
                }

                .type-card.active .type-icon {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .type-content h4 {
                    font-size: 1rem;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .type-content p {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0;
                }

                .check-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    background: #22c55e;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                /* Multiple Correct Toggle */
                .multiple-toggle {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    background: #fef3c7;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                }

.toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 52px;
                    height: 28px;
                    flex-shrink: 0;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                    position: absolute;
                    z-index: 1;
                    cursor: pointer;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: 0.3s;
                    border-radius: 28px;
                    pointer-events: none;
                }

                .toggle-slider::before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                }

                .toggle-switch input:checked + .toggle-slider {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .toggle-switch input:checked + .toggle-slider::before {
                    transform: translateX(24px);
                }

                .toggle-label span {
                    display: block;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 0.125rem;
                }

                .toggle-label small {
                    color: #6b7280;
                    font-size: 0.813rem;
                }

                /* Options Grid */
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .option-input-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .option-input-group:focus-within {
                    border-color: #667eea;
                    background: white;
                }

                .option-input-group.correct-selected {
                    border-color: #22c55e;
                    background: #f0fdf4;
                }

                .option-letter {
                    width: 32px;
                    height: 32px;
                    background: #e5e7eb;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #6b7280;
                    flex-shrink: 0;
                }

                .option-input-group.correct-selected .option-letter {
                    background: #22c55e;
                    color: white;
                }

                .option-input-group .form-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 0;
                    font-size: 0.938rem;
                }

                .option-input-group .form-input:focus {
                    outline: none;
                    box-shadow: none;
                }

                .remove-option {
                    width: 28px;
                    height: 28px;
                    background: #fee2e2;
                    border: none;
                    border-radius: 6px;
                    color: #dc2626;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .remove-option:hover {
                    background: #fecaca;
                }

                .correct-checkbox {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }

                .correct-checkbox input {
                    display: none;
                }

                .check-mark {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    background: white;
                }

                .check-mark.checkbox {
                    border-radius: 6px;
                }

                .check-mark.radio {
                    border-radius: 50%;
                }

                .correct-checkbox input:checked + .check-mark.checkbox {
                    background: #22c55e;
                    border-color: #22c55e;
                }

                .correct-checkbox input:checked + .check-mark.radio {
                    background: #22c55e;
                    border-color: #22c55e;
                }

                .radio-dot {
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                }

                .add-option-btn {
                    margin-top: 1rem;
                    width: 100%;
                }

                .helper-text {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .helper-text svg {
                    color: #9ca3af;
                }

                .helper-hint {
                    display: block;
                    margin-top: 0.5rem;
                    font-size: 0.813rem;
                    color: #9ca3af;
                }

                /* Detailed Answer Section */
                .detailed-info {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: #dbeafe;
                    border-radius: 12px;
                    margin-top: 1.5rem;
                }

                .info-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .info-content h4 {
                    font-size: 0.938rem;
                    color: #1e40af;
                    margin: 0 0 0.5rem;
                }

                .info-content p {
                    font-size: 0.875rem;
                    color: #3b82f6;
                    margin: 0;
                    line-height: 1.5;
                }

                /* Form Elements */
                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-label {
                    display: block;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                    font-size: 0.938rem;
                }

                .form-textarea {
                    width: 100%;
                    padding: 1rem;
                    font-size: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    resize: vertical;
                    min-height: 100px;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                .form-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .form-select {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .form-select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .image-upload-area {
                    border: 2px dashed #e5e7eb;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.2s;
                }

                .image-upload-area:hover {
                    border-color: #667eea;
                }

                .upload-placeholder {
                    padding: 3rem;
                    text-align: center;
                    cursor: pointer;
                    position: relative;
                }

                .upload-placeholder svg {
                    color: #9ca3af;
                    margin-bottom: 1rem;
                }

                .upload-placeholder p {
                    color: #374151;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }

                .upload-placeholder span {
                    color: #9ca3af;
                    font-size: 0.875rem;
                }

                .file-input {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    cursor: pointer;
                }

                .image-preview {
                    position: relative;
                }

                .image-preview img {
                    width: 100%;
                    max-height: 300px;
                    object-fit: contain;
                }

                .remove-image {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 36px;
                    height: 36px;
                    background: rgba(239, 68, 68, 0.9);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .remove-image:hover {
                    background: #dc2626;
                    transform: scale(1.1);
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding-top: 1rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.5rem;
                    font-size: 0.938rem;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-secondary {
                    background: #f1f5f9;
                    color: #475569;
                }

                .btn-secondary:hover {
                    background: #e2e8f0;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
                    transform: translateY(-2px);
                }

                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .btn-lg {
                    padding: 1rem 2rem;
                    font-size: 1.063rem;
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

                @media (max-width: 768px) {
                    .page-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .form-container {
                        padding: 1.5rem;
                    }

                    .question-type-selector {
                        grid-template-columns: 1fr;
                    }

                    .options-grid {
                        grid-template-columns: 1fr;
                    }

                    .multiple-toggle {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default AddQuestion;

