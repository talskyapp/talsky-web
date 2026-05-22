import { useContext } from "react";
import { OnboardingContext } from "../OnboardingContext";
import OnboardingLayout from "../OnboardingLayout";
import "../../styles/OnboardingGoal.css";

const goals = [
    { name: "Travel", icon: "✈️", desc: "Communicate while traveling" },
    { name: "Conversation", icon: "🗣️", desc: "Speak with confidence" },
    { name: "Work", icon: "💼", desc: "Improve your career opportunities" },
    { name: "Culture", icon: "🎎", desc: "Explore cultures and media" },
];

const StepGoal = () => {
    const { updateData, setStep } = useContext(OnboardingContext);

    const select = (goal) => {
        updateData("goal", goal);
        setStep(4);
    };

    return (
        <OnboardingLayout>
            <div className="onb-goal-container">
                <div className="onb-goal-header">
                    <span className="onb-goal-badge">Step 3</span>

                    <h1 className="onb-goal-title">
                        What is your main goal?
                    </h1>

                    <p className="onb-goal-subtitle">
                        We’ll tailor your learning experience based on this.
                    </p>
                </div>

                <div className="onb-goal-grid">
                    {goals.map((goal) => (
                        <button
                            key={goal.name}
                            type="button"
                            className="onb-goal-card"
                            onClick={() => select(goal.name)}
                        >
                            <div className="onb-goal-icon">
                                {goal.icon}
                            </div>

                            <div className="onb-goal-info">
                                <div className="onb-goal-text">
                                    <span className="onb-goal-name">{goal.name}</span>
                                    <span className="onb-goal-desc">{goal.desc}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </OnboardingLayout>
    );
};

export default StepGoal;