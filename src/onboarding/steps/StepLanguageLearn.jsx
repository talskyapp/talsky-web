import { useContext, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OnboardingContext } from "../OnboardingContext";
import OnboardingLayout from "../OnboardingLayout";
import "../../styles/OnboardingLanguage.css";

const languages = [
    { code: "af", name: "Afrikaans", flag: "🇿🇦" },
    { code: "sq", name: "Albanian", flag: "🇦🇱" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "bn", name: "Bengali", flag: "🇧🇩" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
];

const StepLanguageLearn = () => {
    const { updateData, setStep } = useContext(OnboardingContext);
    const [query, setQuery] = useState("");

    const filteredLanguages = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return languages;

        return languages.filter(
            (lang) =>
                lang.name.toLowerCase().includes(q) ||
                lang.code.toLowerCase().includes(q)
        );
    }, [query]);

    const select = (lang) => {
        updateData("languageToLearn", lang.name);
        setStep(2);
    };

    return (
        <OnboardingLayout>
            <div className="onb-language-container">
                <div className="onb-language-header">
                    <span className="onb-language-badge">Step 1</span>

                    <h1 className="onb-language-title">
                        What language do you want to learn?
                    </h1>

                    <p className="onb-language-subtitle">
                        Search and choose a language to personalize TalSky.
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
                                {lang.flag}
                            </div>

                            <div className="onb-language-info">
                                <span className="onb-language-name">{lang.name}</span>
                                <span className="onb-language-action">Select language</span>
                            </div>

                            <span className="onb-language-chevron">›</span>
                        </button>
                    ))}
                </div>
            </div>
        </OnboardingLayout>
    );
};

export default StepLanguageLearn;