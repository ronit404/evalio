import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle,
    ArrowLeft,
    Download,
    BookOpen,
    Calendar,
    Eye
} from 'lucide-react';
// import GradeBadge from "../components/GradeBadge.jsx";

const ExamAnalytics = () => {
    const { examId } = useParams();
    const [searchParams] = useSearchParams();
    const examTitle = searchParams.get('title') || 'Exam Analytics';
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const { data } = await API.get(`/admin/analytics/${examId}`);
                setAnalytics(data);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                setError("No data available for this exam yet.");
            } finally {
                setLoading(false);
            }
        };
        
        if (examId) {
            fetchAnalytics();
        }
    }, [examId]);

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
    };

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-error">
                <BarChart3 size={64} />
                <h2>No Data Available</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={handleClose}>
                    Close Window
                </button>
            </div>
        );
    }

    // Calculate data for charts
    const scoreRanges = [
        { label: 'F (0-59%)', min: 0, max: 59, count: 0, color: 'grade-f' },
        { label: 'D (60-69%)', min: 60, max: 69, count: 0, color: 'grade-d' },
        { label: 'C (70-79%)', min: 70, max: 79, count: 0, color: 'grade-c' },
        { label: 'B (80-89%)', min: 80, max: 89, count: 0, color: 'grade-b' },
        { label: 'A (90-100%)', min: 90, max: 100, count: 0, color: 'grade-a' }
    ];

    // Process score distribution if we have student results
    const scoreData = analytics?.scoreDistribution || [];
    scoreData.forEach(score => {
        const range = scoreRanges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
    });

    // Calculate pass/fail
    const passCount = analytics?.passCount || 0;
    const failCount = (analytics?.totalSubmissions || 0) - passCount;

    return (
        <motion.div 
            className="analytics-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Header */}
            <div className="analytics-header">
                <div className="header-left">
                    <div className="exam-icon">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1>{examTitle}</h1>
                        <p>Exam Analytics & Performance Report</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handlePrint}>
                        <Download size={18} />
                        Export PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleClose}>
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon primary">
                        <Users size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{analytics?.totalSubmissions || 0}</span>
                        <span className="metric-label">Total Submissions</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon success">
                        <TrendingUp size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{analytics?.averageScore?.toFixed(1) || 0}%</span>
                        <span className="metric-label">Average Score</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon warning">
                        <BarChart3 size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{analytics?.highestScore || 0}%</span>
                        <span className="metric-label">Highest Score</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon info">
                        <Clock size={24} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{analytics?.lowestScore || 0}%</span>
                        <span className="metric-label">Lowest Score</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Score Distribution Bar Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><BarChart3 size={20} /> Score Distribution</h3>
                    </div>
                    <div className="bar-chart">
                        {scoreRanges.map((range, idx) => {
                            const maxCount = Math.max(...scoreRanges.map(r => r.count), 1);
                            const barPct = (range.count / maxCount) * 100;
                            return (
                                <div key={idx} className="bar-item">
                                    <div className="bar-label-grade">
                                        <GradeBadge percentage={Math.round((range.min + range.max) / 2)} size="sm" showLetter={true} />
                                        <span>({range.label})</span>
                                    </div>
                                    <div className="bar-track">
                                        <div 
                                            className={`bar-fill ${range.color}`}
                                            style={{ width: `${barPct}%` }}
                                        >
                                            <span className="bar-value">{range.count}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pass/Fail Pie Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3><PieChart size={20} /> Pass/Fail Ratio</h3>
                    </div>
                    <div className="pie-chart-container">
                        <svg viewBox="0 0 100 100" className="pie-chart">
                            {/* Pass - Green */}
                            <circle 
                                r="25" 
                                cx="50" 
                                cy="50" 
                                fill="transparent"
                                stroke="#22c55e"
                                strokeWidth="50"
                                strokeDasharray={`${(passCount / (passCount + failCount || 1)) * 157} 157`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                            />
                            {/* Fail - Red */}
                            <circle 
                                r="25" 
                                cx="50" 
                                cy="50" 
                                fill="transparent"
                                stroke="#ef4444"
                                strokeWidth="50"
                                strokeDasharray={`${(failCount / (passCount + failCount || 1)) * 157} 157`}
                                strokeDashoffset={`-${(passCount / (passCount + failCount || 1)) * 157}`}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
<div className="pie-center">
                            <span className="total-num">{passCount + failCount}</span>
                            <span className="total-label">Students</span>
                        </div>
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot pass"></span>
                            <span>Pass ({passCount})</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot fail"></span>
                            <span>Fail ({failCount})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="additional-stats">
                <div className="stat-row">
                    <div className="stat-item">
                        <CheckCircle size={20} className="icon-success" />
                        <span className="stat-label">Pass Count</span>
                        <span className="stat-value success">{passCount}</span>
                    </div>
                    <div className="stat-item">
                        <XCircle size={20} className="icon-fail" />
                        <span className="stat-label">Fail Count</span>
                        <span className="stat-value fail">{failCount}</span>
                    </div>
                    <div className="stat-item">
                        <TrendingUp size={20} className="icon-pass-rate" />
                        <span className="stat-label">Pass Rate</span>
                        <span className="stat-value">
                            {((passCount / (passCount + failCount || 1)) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="stat-item">
                        <BarChart3 size={20} className="icon-avg-time" />
                        <span className="stat-label">Median Score</span>
                        <span className="stat-value">{analytics?.medianScore?.toFixed(1) || 0}%</span>
                    </div>
                </div>
            </div>

            {/* Student Details Table */}
            {analytics?.students && analytics.students.length > 0 && (
                <div className="students-table-card">
                    <div className="table-header">
                        <h3><Users size={20} /> Student Performance Details</h3>
                    </div>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Email</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.students.map((student, idx) => (
                                    <tr key={idx}>
                                        <td>{student.name}</td>
                                        <td>{student.email}</td>
                                        <td>
                                            <span className={`score-badge ${student.score >= 40 ? 'pass' : 'fail'}`}>
                                                {student.score}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${student.score >= 40 ? 'pass' : 'fail'}`}>
                                                {student.score >= 40 ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                        <td>{new Date(student.submittedAt).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                className="view-btn"
                                                onClick={() => navigate(`/admin/submission/${student._id}`)}
                                                title="View & Grade Submission"
                                            >
                                                <Eye size={16} /> View/Grade
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f8fafc;
                }

                .analytics-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding: 2rem;
                }

                .analytics-loading, .analytics-error {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    color: #64748b;
                }

                .analytics-error h2 {
                    color: #334155;
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

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 2px solid #e2e8f0;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .exam-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .analytics-header h1 {
                    font-size: 1.75rem;
                    color: #1e293b;
                }

                .analytics-header p {
                    color: #64748b;
                }

                .header-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .btn-secondary {
                    background: white;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .metric-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .metric-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .metric-icon.primary { background: #dbeafe; color: #2563eb; }
                .metric-icon.success { background: #dcfce7; color: #16a34a; }
                .metric-icon.warning { background: #fef3c7; color: #d97706; }
                .metric-icon.info { background: #f3e8ff; color: #9333ea; }

                .metric-content {
                    display: flex;
                    flex-direction: column;
                }

                .metric-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .metric-label {
                    color: #64748b;
                    font-size: 0.875rem;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .chart-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .chart-header {
                    margin-bottom: 1.5rem;
                }

                .chart-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.125rem;
                    color: #1e293b;
                }

                .bar-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .bar-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bar-label {
                    width: 80px;
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .bar-track {
                    flex: 1;
                    height: 32px;
                    background: #f1f5f9;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 0.75rem;
                    min-width: 40px;
                    transition: width 0.5s ease;
                }

                .bar-value {
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .pie-chart-container {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    margin: 0 auto 1.5rem;
                }

                .pie-chart {
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }

                .pie-center {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .total-num {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .total-label {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .legend-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .legend-dot.pass { background: #22c55e; }
                .legend-dot.fail { background: #ef4444; }

                .additional-stats {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .stat-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .stat-value.success { color: #16a34a; }
                .stat-value.fail { color: #dc2626; }

                .icon-success { color: #16a34a; }
                .icon-fail { color: #dc2626; }
                .icon-pass-rate { color: #667eea; }
                .icon-avg-time { color: #d97706; }

                .students-table-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .table-header {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }

                .table-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.125rem;
                    color: #1e293b;
                }

                .table-responsive {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    padding: 1rem 1.5rem;
                    text-align: left;
                }

                th {
                    background: #f8fafc;
                    font-weight: 600;
                    color: #64748b;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                }

                td {
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                }

                .score-badge {
                    display: inline-block;
                    padding: 0.375rem 0.75rem;
                    border-radius: 6px;
                    font-weight: 600;
                }

                .score-badge.pass {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .score-badge.fail {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .status-badge {
                    display: inline-block;
                    padding: 0.25rem 0.625rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .status-badge.pass {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .status-badge.fail {
                    background: #fee2e2;
                    color: #dc2626;
                }

                @media print {
                    .header-actions {
                        display: none;
                    }
                }

                @media (max-width: 1024px) {
                    .metrics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                    .stat-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .analytics-page {
                        padding: 1rem;
                    }
                    .analytics-header {
                        flex-direction: column;
                        gap: 1rem;
                        align-items: flex-start;
                    }
                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .view-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .view-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
            `}</style>
        </motion.div>
    );
};

export default ExamAnalytics;

