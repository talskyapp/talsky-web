import { useContext } from "react";
import { OnboardingContext } from "../OnboardingContext";
import OnboardingLayout from "../OnboardingLayout";
import "../../styles/OnboardingLevel.css";

const levels = [
    {
        name: "Beginner",
        icon: "🌱",
        desc: "Just starting or learning basic words",
    },
    {
        name: "Intermediate",
        icon: "📘",
        desc: "Can hold simple conversations",
    },
    {
        name: "Advanced",
        icon: "🚀",
        desc: "Comfortable speaking and understanding",
    },
];

const StepLevel = () => {
    const { updateData, setStep } = useContext(OnboardingContext);

    const select = (level) => {
        updateData("level", level);
        setStep(5);
    };

    return (
        <OnboardingLayout>
            <div className="onb-level-container">
                <div className="onb-level-header">
                    <span className="onb-level-badge">Step 4</span>

                    <h1 className="onb-level-title">
                        What is your current level?
                    </h1>

                    <p className="onb-level-subtitle">
                        This helps us adapt lessons and conversations to you.
                    </p>
                </div>

                <div className="onb-level-list">
                    {levels.map((level) => (
                        <button
                            key={level.name}
                            type="button"
                            className="onb-level-card"
                            onClick={() => select(level.name)}
                        >
                            <div className="onb-level-icon">
                                {level.icon}
                            </div>

                            <div className="onb-level-text">
                                <span className="onb-level-name">
                                    {level.name}
                                </span>

                                <span className="onb-level-desc">
                                    {level.desc}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </OnboardingLayout>
    );
};

export default StepLevel;