import { useEffect, useState } from "react";

export default function LessonResultScreen({
    score,
    xpEarned,
    attempts,
    bestScore,
    passed,
    onContinue,
}) {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        let current = 0;
        const interval = setInterval(() => {
            current += 2;
            if (current >= score) {
                current = score;
                clearInterval(interval);
            }
            setDisplayScore(current);
        }, 16);

        return () => clearInterval(interval);
    }, [score]);

    return (
        <div className="lesson-result-overlay">
            <div className={`lesson-result-card ${passed ? "passed" : "failed"}`}>

                <div className="lesson-result-icon">
                    {passed ? "🎉" : "😅"}
                </div>

                <h2>{passed ? "You passed!" : "Keep practicing!"}</h2>

                {/* SCORE */}
                <div className="lesson-result-score-wrap">
                    <div className="lesson-result-score-circle animated">
                        <div className="lesson-result-score-inner">
                            <span>{displayScore}%</span>
                        </div>
                    </div>
                </div>

                {/* BAR */}
                <div className="lesson-result-bar">
                    <div
                        className="lesson-result-bar-fill"
                        style={{ width: `${score}%` }}
                    />
                </div>

                {/* XP ANIMATION */}
                <div className="lesson-xp-burst">
                    <span className="lesson-xp-number">+{xpEarned} XP</span>

                    {[...Array(12)].map((_, i) => (
                        <span
                            key={i}
                            className="lesson-xp-particle"
                            style={{
                                transform: `rotate(${i * 30}deg) translate(40px)`,
                            }}
                        />
                    ))}
                </div>

                {/* STATS */}
                <div className="lesson-result-stats">
                    <div className="lesson-result-stat">
                        <span>XP</span>
                        <strong>{xpEarned}</strong>
                    </div>

                    <div className="lesson-result-stat">
                        <span>Attempts</span>
                        <strong>{attempts}</strong>
                    </div>

                    <div className="lesson-result-stat">
                        <span>Best</span>
                        <strong>{bestScore}%</strong>
                    </div>
                </div>

                <div className={`lesson-result-note ${passed ? "success" : ""}`}>
                    {passed
                        ? "Great job! Keep your streak going 🔥"
                        : "You’re improving — try again 💪"}
                </div>

                <div className="lesson-result-actions">
                    <button
                        className="lesson-primary-btn lesson-result-continue-btn"
                        onClick={onContinue}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}