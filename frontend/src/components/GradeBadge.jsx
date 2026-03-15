import React from 'react';
import { Award } from 'lucide-react';

const GradeBadge = ({ percentage, score, totalPoints, size = 'md', showLetter = true, className = '' }) => {
  const getGrade = (pct) => {
    if (pct >= 90) return { letter: 'A', color: 'grade-a' };
    if (pct >= 80) return { letter: 'B', color: 'grade-b' };
    if (pct >= 70) return { letter: 'C', color: 'grade-c' };
    if (pct >= 60) return { letter: 'D', color: 'grade-d' };
    return { letter: 'F', color: 'grade-f' };
  };

  const pct = Math.round((score / totalPoints) * 100);
  const grade = getGrade(pct);

  return (
    <div className={`grade-badge ${grade.color} ${size} ${className}`}>
      {showLetter && <span className="grade-letter">{grade.letter}</span>}
      <span className="grade-score">{pct}%</span>
      <Award size={12} />
    </div>
  );
};

export default GradeBadge;
