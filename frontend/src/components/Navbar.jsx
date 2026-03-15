import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    LogOut, 
    BookOpen, 
    LayoutDashboard, 
    Menu, 
    X,
    User,
    Settings,
    ChevronDown,
    Trophy
} from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Check if user is a teacher (teacher or section_admin role)
    const isTeacher = user?.role === 'teacher' || user?.role === 'section_admin';
    // Check if user is admin (super_admin or isAdmin flag)
    const isAdmin = user?.isAdmin || user?.role === 'super_admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-brand">
                <div className="brand-icon">
                        <img 
    src="/evalio-logo-new.jpg" 
                            alt="Evalio" 
                            className="logo-img"
                        />
                        <BookOpen size={24} className="logo-fallback" style={{display: 'none'}} />
                    </div>
                    <span className="brand-text">Evalio</span>
                </Link>

{/* Desktop Navigation */}
                <div className="navbar-links">
                    {user ? (
                        <>
                            {/* Admin Links - Only show if not a teacher */}
                            {isAdmin && !isTeacher && (
                                <Link to="/admin" className="nav-link">
                                    <LayoutDashboard size={18} />
                                    <span>Admin</span>
                                </Link>
                            )}
                            
                            {/* Teacher Links */}
                            {isTeacher && (
                                <>
                                    <Link to="/teacher" className="nav-link">
                                        <BookOpen size={18} />
                                        <span>Teacher Dashboard</span>
                                    </Link>
                                    <Link to="/teacher/subjects" className="nav-link">
                                        <BookOpen size={18} />
                                        <span>Subjects</span>
                                    </Link>
                                </>
                            )}
                            
                            {/* Student Links - Only for non-admin, non-teacher */}
                            {!isAdmin && !isTeacher && (
                                <>
                                    <Link to="/student" className="nav-link">
                                        <LayoutDashboard size={18} />
                                        <span>Student Dashboard</span>
                                    </Link>
                                    
                                    <Link to="/results" className="nav-link">
                                        <Trophy size={18} />
                                        <span>Results</span>
                                    </Link>
                                </>
                            )}
                            
                            <div className="user-dropdown">
                                <button 
                                    className="user-button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="user-avatar">
                                        <User size={18} />
                                    </div>
                                    <span className="user-name">{user.name}</span>
                                    <ChevronDown size={16} className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
                                </button>
                                
                                {isDropdownOpen && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-header">
                                            <p className="dropdown-email">{user.email}</p>
                                            <span className="dropdown-role">
                                                {isAdmin ? 'Administrator' : isTeacher ? 'Teacher' : 'Student'}
                                            </span>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link login-link">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="mobile-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

{/* Mobile Menu */}
            {isMenuOpen && (
                <div className="mobile-menu">
                    {user ? (
                        <>
                            <div className="mobile-user-info">
                                <div className="mobile-avatar">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="mobile-name">{user.name}</p>
                                    <p className="mobile-email">{user.email}</p>
                                </div>
                            </div>
                            
                            {/* Admin Links - Only show if not a teacher */}
                            {isAdmin && !isTeacher && (
                                <Link to="/admin" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                    <LayoutDashboard size={20} />
                                    <span>Admin Dashboard</span>
                                </Link>
                            )}
                            
                            {/* Teacher Links */}
                            {isTeacher && (
                                <>
                                    <Link to="/teacher" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                        <BookOpen size={20} />
                                        <span>Teacher Dashboard</span>
                                    </Link>
                                    <Link to="/teacher/subjects" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                        <BookOpen size={20} />
                                        <span>Subjects</span>
                                    </Link>
                                </>
                            )}
                            
                            {/* Student Links */}
                            {!isAdmin && !isTeacher && (
                                <>
                                    <Link to="/student" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                        <LayoutDashboard size={20} />
                                        <span>Student Dashboard</span>
                                    </Link>

                                    <Link to="/results" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                        <Trophy size={20} />
                                        <span>Results</span>
                                    </Link>
                                </>
                            )}
                            
                            <button className="mobile-nav-link" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                                <User size={20} />
                                <span>Login</span>
                            </Link>
                            <Link to="/register" className="mobile-nav-link primary" onClick={() => setIsMenuOpen(false)}>
                                <BookOpen size={20} />
                                <span>Get Started</span>
                            </Link>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .navbar {
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .navbar-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .navbar-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-decoration: none;
                }

                .brand-icon {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    position: relative;
                }

                .logo-img {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                }

                .logo-fallback {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .brand-text {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .navbar-links {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    color: #4b5563;
                    text-decoration: none;
                    font-weight: 500;
                    border-radius: 10px;
                    transition: all 0.2s;
                }

                .nav-link:hover {
                    background: #f1f5f9;
                    color: #111827;
                }

                .nav-link.login-link {
                    padding: 0.625rem 1.25rem;
                }

                .user-dropdown {
                    position: relative;
                }

                .user-button {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 1rem;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .user-button:hover {
                    background: #f1f5f9;
                    border-color: #d1d5db;
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .user-name {
                    font-weight: 500;
                    color: #111827;
                }

                .dropdown-icon {
                    color: #6b7280;
                    transition: transform 0.2s;
                }

                .dropdown-icon.open {
                    transform: rotate(180deg);
                }

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    min-width: 220px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                    animation: slideDown 0.2s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-header {
                    padding: 1rem;
                    background: #f9fafb;
                }

                .dropdown-email {
                    font-weight: 500;
                    color: #111827;
                    margin: 0 0 0.25rem;
                    font-size: 0.875rem;
                }

                .dropdown-role {
                    font-size: 0.75rem;
                    color: #6b7280;
                    text-transform: capitalize;
                }

                .dropdown-divider {
                    height: 1px;
                    background: #e5e7eb;
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #dc2626;
                    font-weight: 500;
                    transition: background 0.2s;
                }

                .dropdown-item:hover {
                    background: #fee2e2;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .btn-primary:hover {
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                    transform: translateY(-1px);
                }

                .btn-sm {
                    padding: 0.5rem 1rem;
                    font-size: 0.813rem;
                }

                .mobile-menu-btn {
                    display: none;
                    padding: 0.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #374151;
                }

                .mobile-menu {
                    display: none;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    background: white;
                }

                .mobile-user-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }

                .mobile-avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .mobile-name {
                    font-weight: 600;
                    color: #111827;
                    margin: 0 0 0.25rem;
                }

                .mobile-email {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0;
                }

                .mobile-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    color: #374151;
                    text-decoration: none;
                    font-weight: 500;
                    border-radius: 12px;
                    transition: all 0.2s;
                    background: none;
                    border: none;
                    width: 100%;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .mobile-nav-link:hover {
                    background: #f1f5f9;
                }

                .mobile-nav-link.primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    justify-content: center;
                    margin-top: 0.5rem;
                }

                @media (max-width: 768px) {
                    .navbar-links {
                        display: none;
                    }

                    .mobile-menu-btn {
                        display: block;
                    }

                    .mobile-menu {
                        display: block;
                    }

                    .brand-text {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
