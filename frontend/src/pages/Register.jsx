import { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Eye, EyeOff, BookOpen, UserPlus, CheckCircle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        isAdmin: false,
        role: 'student',
        section: '',
        department: '',
        year: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const passwordRequirements = [
        { met: formData.password.length >= 8, text: 'At least 8 characters' },
        { met: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
        { met: /[0-9]/.test(formData.password), text: 'One number' },
        { met: formData.password === formData.confirmPassword && formData.confirmPassword !== '', text: 'Passwords match' },
    ];

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        // If registering as admin/teacher, department is required
        if (formData.isAdmin && !formData.department) {
            toast.error('Please enter your department for teacher account!');
            return;
        }

        setIsLoading(true);
        
        try {
            const registerData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                isAdmin: formData.isAdmin,
                role: formData.isAdmin ? (formData.role || 'teacher') : 'student',
                section: formData.section || '',
                department: formData.department || '',
                year: formData.year ? parseInt(formData.year) : null
            };

            await API.post('/auth/register', registerData);
            toast.success('Account created successfully! 🎉');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="register-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Toaster 
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                }}
            />
            
            <div className="register-container">
                {/* Left Side - Branding */}
                <motion.div 
                    className="register-branding"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="branding-content">
                        <motion.div 
                            className="logo-icon"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <BookOpen size={48} />
                        </motion.div>
                        <h1>Join Evalio</h1>
                        <p className="tagline">Start Your Assessment Journey</p>
                        <p className="description">
                            Create an account to access professional exams, track your progress, 
                            and unlock your potential.
                        </p>
                        <div className="benefits-list">
                            <div className="benefit-item">
                                <CheckCircle size={18} />
                                <span>Access to hundreds of questions</span>
                            </div>
                            <div className="benefit-item">
                                <CheckCircle size={18} />
                                <span>Detailed performance analytics</span>
                            </div>
                            <div className="benefit-item">
                                <CheckCircle size={18} />
                                <span>Instant results & feedback</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Register Form */}
                <motion.div 
                    className="register-form-container"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="form-card">
                        <div className="form-header">
                            <UserPlus size={32} className="form-icon" />
                            <h2>Create Account</h2>
                            <p>Fill in the details below to get started</p>
                        </div>

                        <form onSubmit={handleRegister} className="register-form">
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="form-label">Full Name</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                            >
                                <label className="form-label">Email Address</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="email" 
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="form-label">Password</label>
                                <div className="input-wrapper">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        className="form-input"
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="password-requirements">
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className={`requirement ${req.met ? 'met' : ''}`}>
                                                <span className="check">{req.met ? '✓' : '○'}</span>
                                                {req.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <label className="form-label">Confirm Password</label>
                                <div className="input-wrapper">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        className="form-input"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div 
                                className="form-group admin-toggle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox"
                                        checked={formData.isAdmin}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            isAdmin: e.target.checked,
                                            role: e.target.checked ? 'teacher' : 'student'
                                        })}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Register as Teacher</span>
                                </label>
                                <p className="admin-note">Check this if you're teaching a class department</p>
                            </motion.div>

                            {/* Year Selection for Students */}
                            {!formData.isAdmin && (
                                <motion.div 
                                    className="form-group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.64 }}
                                >
                                    <label className="form-label">Select Your Year</label>
                                    <div className="input-wrapper">
                                        <select 
                                            className="form-input"
                                            value={formData.year}
                                            onChange={(e) => setFormData({...formData, year: e.target.value})}
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            {/* Department Input */}
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65 }}
                            >
                                <label className="form-label">
                                    {formData.isAdmin ? 'Your Department (Teaching)' : 'Your Department'}
                                </label>
                                <div className="input-wrapper">
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        placeholder="e.g., CSE, IT, ECE"
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value.toUpperCase()})}
                                        required={formData.isAdmin}
                                    />
                                </div>
                            </motion.div>

                            {/* Section Input for Students */}
                            {!formData.isAdmin && (
                                <motion.div 
                                    className="form-group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.66 }}
                                >
                                    <label className="form-label">Your Section</label>
                                    <div className="input-wrapper">
                                        <select 
                                            className="form-input"
                                            value={formData.section}
                                            onChange={(e) => setFormData({...formData, section: e.target.value})}
                                        >
                                            <option value="">Select Section</option>
                                            <option value="A">Section A</option>
                                            <option value="B">Section B</option>
                                            <option value="C">Section C</option>
                                            <option value="D">Section D</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}

                            <motion.button 
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={isLoading}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? (
                                    <span className="spinner spinner-sm"></span>
                                ) : (
                                    'Create Account'
                                )}
                            </motion.button>
                        </form>

                        <motion.div 
                            className="form-footer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.75 }}
                        >
                            <p>Already have an account? <Link to="/login" className="login-link">Sign in</Link></p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .register-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .register-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    max-width: 1100px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    min-height: 700px;
                }

                .register-branding {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    padding: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .register-branding::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: rotate 30s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .branding-content {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    color: white;
                }

                .logo-icon {
                    width: 100px;
                    height: 100px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    backdrop-filter: blur(10px);
                    color: white;
                }

                .register-branding h1 {
                    font-size: 2.75rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .tagline {
                    font-size: 1.25rem;
                    font-weight: 500;
                    opacity: 0.9;
                    margin-bottom: 1.5rem;
                }

                .description {
                    font-size: 1rem;
                    opacity: 0.85;
                    max-width: 350px;
                    margin: 0 auto 2rem;
                    line-height: 1.7;
                }

                .benefits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-width: 320px;
                    margin: 0 auto;
                }

                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                    font-weight: 500;
                    text-align: left;
                }

                .register-form-container {
                    padding: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .form-card {
                    width: 100%;
                    max-width: 420px;
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .form-icon {
                    color: #f5576c;
                    margin-bottom: 1rem;
                }

                .form-header h2 {
                    font-size: 1.75rem;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .form-header p {
                    color: #6b7280;
                    margin: 0;
                }

                .register-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .form-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    font-size: 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    background: #f9fafb;
                    transition: all 0.2s ease;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #f5576c;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(245, 87, 108, 0.1);
                }

                .password-toggle {
                    position: absolute;
                    right: 1rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    display: flex;
                    align-items: center;
                }

                .password-toggle:hover {
                    color: #374151;
                }

                .password-requirements {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    font-size: 0.75rem;
                }

                .requirement {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
                }

                .requirement.met {
                    color: #16a34a;
                }

                .requirement .check {
                    font-size: 0.875rem;
                }

                .admin-toggle {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }

                .checkbox-label input {
                    display: none;
                }

                .checkbox-custom {
                    width: 1.25rem;
                    height: 1.25rem;
                    border: 2px solid #d1d5db;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .checkbox-label input:checked + .checkbox-custom {
                    background: #f5576c;
                    border-color: #f5576c;
                }

                .checkbox-label input:checked + .checkbox-custom::after {
                    content: '✓';
                    color: white;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .checkbox-text {
                    font-weight: 500;
                    color: #374151;
                }

                .admin-note {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0.5rem 0 0 2rem;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    font-weight: 600;
                    padding: 1rem;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(245, 87, 108, 0.3);
                    transform: translateY(-2px);
                }

                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .form-footer {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                }

                .form-footer p {
                    color: #6b7280;
                    margin: 0;
                }

                .login-link {
                    color: #f5576c;
                    font-weight: 600;
                    text-decoration: none;
                }

                .login-link:hover {
                    text-decoration: underline;
                }

                @media (max-width: 900px) {
                    .register-container {
                        grid-template-columns: 1fr;
                        max-width: 500px;
                    }

                    .register-branding {
                        padding: 2rem;
                        min-height: 180px;
                    }

                    .register-branding h1 {
                        font-size: 2rem;
                    }

                    .tagline {
                        font-size: 1rem;
                    }

                    .description, .benefits-list {
                        display: none;
                    }

                    .register-form-container {
                        padding: 2rem;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default Register;

