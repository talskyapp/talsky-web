import { useState } from "react";
import { OnboardingContext } from "./OnboardingContext";

export const OnboardingProvider = ({ children }) => {
    const [step, setStep] = useState(0);

    const [data, setData] = useState({
        languageToLearn: "",
        nativeLanguage: "",
        goal: "",
        level: ""
    });

    const updateData = (key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
    };
console.log("🔥 OnboardingProvider RENDER");
    return (
        <OnboardingContext.Provider value={{ step, setStep, data, updateData }}>
            {children}
        </OnboardingContext.Provider>
    );
};