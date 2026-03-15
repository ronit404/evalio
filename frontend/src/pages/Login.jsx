import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, BookOpen, GraduationCap } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleForgotPassword = async () => {
        if (!resetEmail.trim()) {
            toast.error('Please enter your email address');
            return;
        }
        if (!newPassword.trim()) {
            toast.error('Please enter new password');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSendingReset(true);
        try {
            const response = await API.post('/auth/simple-reset', { 
                email: resetEmail, 
                newPassword, 
                confirmPassword 
            });
            toast.success(response.data.message || 'Password reset successful!');
            setShowForgotModal(false);
            setResetEmail('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setSendingReset(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const { data } = await API.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            toast.success('Welcome back! 👋');
            setTimeout(() => {
                // Redirect based on user role
                const isTeacher = data.role === 'teacher' || data.role === 'section_admin';
                const isAdmin = data.isAdmin || data.role === 'super_admin';
                
                if (!isAdmin && !isTeacher) {
                    // Student - redirect to student dashboard
                    navigate('/student');
                } else {
                    // Teacher or Admin - redirect to default dashboard
                    navigate('/');
                }
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid Credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className="login-page"
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
            
            <div className="login-container">
                {/* Left Side - Branding */}
                <motion.div 
                    className="login-branding"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <div className="branding-content">
                        <motion.div 
                            className="logo-icon"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <BookOpen size={48} />
                        </motion.div>
                        <h1>Evalio</h1>
                        <p className="tagline">Your Gateway to Online Assessment</p>
                        <p className="description">
                            Take exams, track your progress, and achieve your goals with our 
                            modern examination platform.
                        </p>
                        <div className="features-list">
                            <div className="feature-item">
                                <GraduationCap size={20} />
                                <span>Professional Exams</span>
                            </div>
                            <div className="feature-item">
                                <GraduationCap size={20} />
                                <span>Real-time Analytics</span>
                            </div>
                            <div className="feature-item">
                                <GraduationCap size={20} />
                                <span>Secure Testing</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Login Form */}
                <motion.div 
                    className="login-form-container"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="form-card">
                        <div className="form-header">
                            <h2>Welcome Back</h2>
                            <p>Enter your credentials to access your account</p>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <motion.div 
                                className="form-group"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="form-label">Email Address</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="email" 
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                            </motion.div>
                            <motion.div 
                                className="form-options"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label className="remember-me">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <button type="button" className="forgot-link" onClick={() => setShowForgotModal(true)}>
                                    Forgot Password?
                                </button>
                            </motion.div>

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
                                    'Sign In'
                                )}
                            </motion.button>
                        </form>

                        <motion.div 
                            className="form-footer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <p>New here? <Link to="/register" className="register-link">Create an account</Link></p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowForgotModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2.5rem',
                            maxWidth: '450px',
                            width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                Reset Password
                            </h3>
                            <button
                                onClick={() => setShowForgotModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Enter your email and new password to reset it directly.
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        background: '#f9fafb',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.background = 'white';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = '#f9fafb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                                    New Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showResetPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password (min 6 chars)"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 2.5rem 0.875rem 1rem',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            background: '#f9fafb',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.background = 'white';
                                            e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.background = '#f9fafb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#6b7280',
                                            padding: '0.25rem'
                                        }}
                                        onClick={() => setShowResetPassword(!showResetPassword)}
                                    >
                                        {/* Add Eye/EyeOff icons here if desired */}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        background: '#f9fafb',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.background = 'white';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.background = '#f9fafb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem 1rem',
                                        background: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingReset}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem 1rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        cursor: sendingReset ? 'not-allowed' : 'pointer',
                                        opacity: sendingReset ? 0.7 : 1
                                    }}
                                >
                                    {sendingReset ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .login-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }

                .login-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    max-width: 1200px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    min-height: 700px;
                }

                .login-branding {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .login-branding::before {
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
                }

                .login-branding h1 {
                    font-size: 3rem;
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
                    opacity: 0.8;
                    max-width: 350px;
                    margin: 0 auto 2rem;
                    line-height: 1.7;
                }

                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-width: 280px;
                    margin: 0 auto;
                }

                .feature-item {
                    display: 'flex',
                    align-items: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    backdrop-filter: 'blur(10px)',
                    fontWeight: 500
                }

                .login-form-container {
                    padding: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .form-card {
                    width: 100%;
                    max-width: 400px;
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .form-header h2 {
                    font-size: 1.75rem;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .form-header p {
                    color: #6b7280;
                    margin: 0;
                }

                .login-form {
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
                    background: '#f9fafb';
                    transition: 'all 0.2s ease';
                }

                .form-input:focus {
                    outline: none;
                    border-color: '#667eea';
                    background: 'white';
                    box-shadow: '0 0 0 4px rgba(102, 126, 234, 0.1)';
                }

                .form-input::placeholder {
                    color: '#9ca3af';
                }

                .password-toggle {
                    position: absolute;
                    right: 1rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: '#6b7280';
                    padding: 0;
                    display: flex;
                    align-items: center;
                }

                .password-toggle:hover {
                    color: '#374151';
                }

                .form-options {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.875rem;
                }

                .remember-me {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    color: #4b5563;
                    font-size: 0.875rem;
                }

                .remember-me input {
                    width: 1.125rem;
                    height: 1.125rem;
                    accent-color: #667eea;
                    border-radius: 0.375rem;
                    border: 2px solid #d1d5db;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .remember-me input:checked {
                    background-color: #667eea;
                    border-color: #667eea;
                    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
                    background-size: 100% 100%;
                    background-position: center;
                    background-repeat: no-repeat;
                }

                .remember-me input:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
                }

                .forgot-link {
                    color: #667eea;
                    font-weight: 500;
                    background: none;
                    border: none;
                    padding: 0.5rem 0;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    border-bottom: 1px solid transparent;
                }

                .forgot-link:hover {
                    color: #5a67d8;
                    border-bottom: 1px solid #667eea;
                    transform: translateY(-1px);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-weight: 600;
                    padding: 1rem;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: 'all 0.2s ease';
                }

                .btn-primary:hover:not(:disabled) {
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
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
                    color: '#6b7280';
                    margin: 0;
                }

                .register-link {
                    color: '#667eea';
                    font-weight: 600;
                    text-decoration: none;
                }

                .register-link:hover {
                    text-decoration: underline;
                }

                @media (max-width: 900px) {
                    .login-container {
                        grid-template-columns: 1fr;
                        max-width: 500px;
                    }

                    .login-branding {
                        padding: 2rem;
                        min-height: 200px;
                    }

                    .login-branding h1 {
                        font-size: 2rem;
                    }

                    .tagline {
                        font-size: 1rem;
                        opacity: 0.9;
                        margin-bottom: 1.5rem;
                    }

                    .description, .features-list {
                        display: none;
                    }

                    .login-form-container {
                        padding: 2rem;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default Login;
