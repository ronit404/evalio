import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children, isAdminRequired }) => {
    const { user, loading } = useContext(AuthContext);

    // Wait for the AuthContext to check localStorage
    if (loading) return <div>Loading...</div>;

    // If no user is logged in, send them to Login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // Check if user is admin (super_admin or isAdmin flag)
    const isAdmin = user.isAdmin || user.role === 'super_admin';
    
    // Check if user is a teacher (teacher or section_admin role)
    const isTeacher = user.role === 'teacher' || user.role === 'section_admin';

    // If page requires Admin but user is not admin, redirect based on role
    if (isAdminRequired && !isAdmin) {
        // If teacher, go to teacher dashboard, otherwise go to student dashboard
        if (isTeacher) {
            return <Navigate to="/teacher" />;
        }
        return <Navigate to="/" />;
    }

    return children;

};

export default ProtectedRoute;

