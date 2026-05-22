import { createContext } from "react";

export const OnboardingContext = createContext({
    step: 0,
    data: {
        languageToLearn: "",
        nativeLanguage: "",
        goal: "",
        level: ""
    },
    updateData: () => { },
    setStep: () => { }
});