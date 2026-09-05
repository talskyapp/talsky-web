import { useContext, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OnboardingContext } from "../OnboardingContext";
import OnboardingLayout from "../OnboardingLayout";
import "../../styles/OnboardingLanguage.css";

const nativeLanguages = [
    { code: "af", name: "Afrikaans", countryCode: "za" },
    { code: "sq", name: "Albanian", countryCode: "al" },
    { code: "ar", name: "Arabic", countryCode: "sa" },
    { code: "bn", name: "Bengali", countryCode: "bd" },
    { code: "zh", name: "Chinese", countryCode: "cn" },
    { code: "nl", name: "Dutch", countryCode: "nl" },

    {
        code: "en-US",
        name: "English",
        displayName: "English (US)",
        variant: "American English",
        countryCode: "us",
        baseCode: "en",
    },
    {
        code: "en-GB",
        name: "English",
        displayName: "English (UK)",
        variant: "British English",
        countryCode: "gb",
        baseCode: "en",
    },

    { code: "fr", name: "French", countryCode: "fr" },
    { code: "de", name: "German", countryCode: "de" },
    { code: "hi", name: "Hindi", countryCode: "in" },
    { code: "it", name: "Italian", countryCode: "it" },
    { code: "ja", name: "Japanese", countryCode: "jp" },
    { code: "ko", name: "Korean", countryCode: "kr" },
    { code: "pt", name: "Portuguese", countryCode: "pt" },
    { code: "ru", name: "Russian", countryCode: "ru" },
    { code: "es", name: "Spanish", countryCode: "es" },
    { code: "tr", name: "Turkish", countryCode: "tr" },
    { code: "vi", name: "Vietnamese", countryCode: "vn" },
];


const StepNativeLanguage = () => {
    const { data, updateData, setStep } = useContext(OnboardingContext);
    const [query, setQuery] = useState("");

    const filteredLanguages = useMemo(() => {
        const q = query.trim().toLowerCase();

        const learningLanguage =
            data?.languageToLearn?.trim().toLowerCase() || "";

        const learningCode =
            data?.languageToLearnCode?.trim().toLowerCase() || "";

        const learningBaseCode = learningCode
            ? learningCode.split("-")[0]
            : "";

        return nativeLanguages.filter((lang) => {
            const languageName = lang.name.toLowerCase();
            const displayName = (
                lang.displayName || lang.name
            ).toLowerCase();

            const languageCode = lang.code.toLowerCase();

            const languageBaseCode = (
                lang.baseCode || lang.code
            ).toLowerCase();

            const matchesLearningCode =
                Boolean(learningBaseCode) &&
                languageBaseCode === learningBaseCode;

            const matchesLearningName =
                languageName === learningLanguage;

            const isLearningLanguage =
                matchesLearningCode || matchesLearningName;

            const matchesSearch =
                !q ||
                languageName.includes(q) ||
                displayName.includes(q) ||
                languageCode.includes(q) ||
                lang.variant?.toLowerCase().includes(q);

            return !isLearningLanguage && matchesSearch;
        });
    }, [
        query,
        data?.languageToLearn,
        data?.languageToLearnCode,
    ]);

    const select = (lang) => {
        updateData("nativeLanguage", lang.name);
        updateData("nativeLanguageCode", lang.code);
        updateData("nativeLanguageVariant", lang.variant || null);
        setStep(3);
    };

    return (
        <OnboardingLayout>
            <div className="onb-language-container">
                <div className="onb-language-header">
                    <span className="onb-language-badge">Step 2</span>

                    <h1 className="onb-language-title">
                        What is your native language?
                    </h1>

                    <p className="onb-language-subtitle">
                        This helps personalize your TalSky experience and recommendations.
                    </p>

                    <div className="onb-language-search">
                        <Search size={20} />

                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search languages"
                        />
                    </div>
                </div>

                <div className="onb-language-grid">
                    {filteredLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            className="onb-language-card"
                            onClick={() => select(lang)}
                        >
                            <div className="onb-language-icon">
                                <img
                                    src={`https://flagcdn.com/w80/${lang.countryCode}.png`}
                                    alt={lang.displayName || lang.name}
                                    className="onb-language-flag"
                                />
                            </div>

                            <div className="onb-language-info">
                                <span className="onb-language-name">
                                    {lang.displayName || lang.name}
                                </span>

                                {lang.variant && (
                                    <span className="onb-language-variant">
                                        {lang.variant}
                                    </span>
                                )}

                                <span className="onb-language-action">
                                    Select language
                                </span>
                            </div>

                            <span className="onb-language-chevron">›</span>
                        </button>
                    ))}
                </div>
            </div>
        </OnboardingLayout>
    );
};

export default StepNativeLanguage;