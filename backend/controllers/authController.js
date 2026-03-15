const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, isAdmin, role, section, department, year, assignedTeachers, enrolledSubjects } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine role and isAdmin status
        let userRole = 'student';
        let userIsAdmin = false;

        if (isAdmin) {
            // If registering as admin, check if it's a section admin or super admin
            userRole = role || 'section_admin';
            userIsAdmin = true;
        }

        // Prepare user data
        const userData = { 
            name, 
            email, 
            password: hashedPassword, 
            isAdmin: userIsAdmin,
            role: userRole,
            section: section || '',
            department: department || ''
        };

        // Add year for students
        if (userRole === 'student' && year) {
            userData.year = year;
        }

        // Add enrolled subjects for students
        if (userRole === 'student' && enrolledSubjects && Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0) {
            userData.enrolledSubjects = enrolledSubjects;
            userData.assignedTeachers = assignedTeachers || [];
            
            // Extract unique teacher IDs
            const teacherIds = [...new Set(enrolledSubjects.map(es => es.teacherId))];
            userData.assignedTeachers = teacherIds;
        }

        const user = await User.create(userData);

        // If student is registering with assigned teachers, update each teacher's students list
        if (userRole === 'student' && userData.assignedTeachers && userData.assignedTeachers.length > 0) {
            for (const teacherId of userData.assignedTeachers) {
                const teacher = await User.findById(teacherId);
                if (teacher && !teacher.students.includes(user._id)) {
                    teacher.students.push(user._id);
                    await teacher.save();
                }
            }
        }
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                section: user.section,
                department: user.department,
                year: user.year,
                enrolledSubjects: user.enrolledSubjects
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ 
                id: user._id, 
                isAdmin: user.isAdmin,
                role: user.role,
                section: user.section
            }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ 
                token, 
                name: user.name, 
                isAdmin: user.isAdmin,
                role: user.role,
                section: user.section,
                department: user.department,
                year: user.year,
                teachingSubjects: user.teachingSubjects || [],
                enrolledSubjects: user.enrolledSubjects || []
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all teachers for student registration
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ 
            role: { $in: ['teacher', 'section_admin'] }
        })
        .select('name email section department')
        .sort({ name: 1 });
        
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not (security)
            return res.status(200).json({ 
                message: 'If email exists, reset instructions have been sent. Check your inbox/spam.' 
            });
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET + user.password, // Unique per user
            { expiresIn: '1h' }
        );

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Evalio account.</p>
            <p>Click this <a href="${resetUrl}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a> link to set new password.</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, ignore this email.</p>
            <p>Evalio Team</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Evalio Password Reset',
            message
        });

        res.status(200).json({ 
            message: 'Reset email sent. Check your inbox/spam folder.' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid token or expired' });
    }
};

// Simple Reset Password (direct email-based, no token)
exports.simpleResetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'Email, new password, and confirm password are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error) {
        console.error('Simple reset error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};


