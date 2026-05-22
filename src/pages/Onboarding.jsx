import { useContext } from "react";
import { OnboardingContext } from "../onboarding/OnboardingContext";

import StepLocationPermissionAnimated from "../onboarding/steps/StepLocationPermissionAnimated";
import StepLanguageLearn from "../onboarding/steps/StepLanguageLearn";
import StepNativeLanguage from "../onboarding/steps/StepNativeLanguage";
import StepGoal from "../onboarding/steps/StepGoal";
import StepLevel from "../onboarding/steps/StepLevel";
import StepSummary from "../onboarding/steps/StepSummary";

const Onboarding = () => {
    const { step, setStep } = useContext(OnboardingContext);

    return (
        <>
            {step === 0 && (
                <StepLocationPermissionAnimated onContinue={() => setStep(1)} />
            )}

            {step === 1 && <StepLanguageLearn />}
            {step === 2 && <StepNativeLanguage />}
            {step === 3 && <StepGoal />}
            {step === 4 && <StepLevel />}
            {step === 5 && <StepSummary />}
        </>
    );
};

export default Onboarding;