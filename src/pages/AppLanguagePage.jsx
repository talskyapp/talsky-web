import { useEffect, useMemo, useState } from "react";
import { Check, Globe, Lock } from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/AppLanguagePage.css";

const APP_LANGUAGES = [
    { code: "en", label: "English", nativeLabel: "English", enabled: true },
    { code: "es", label: "Spanish", nativeLabel: "Español", enabled: true },
    { code: "fr", label: "French", nativeLabel: "Français", enabled: false },
    { code: "it", label: "Italian", nativeLabel: "Italiano", enabled: false },
    { code: "pt", label: "Portuguese", nativeLabel: "Português", enabled: false },
    { code: "de", label: "German", nativeLabel: "Deutsch", enabled: false },
    { code: "nl", label: "Dutch", nativeLabel: "Nederlands", enabled: false },
    { code: "sv", label: "Swedish", nativeLabel: "Svenska", enabled: false },
    { code: "no", label: "Norwegian", nativeLabel: "Norsk", enabled: false },
    { code: "da", label: "Danish", nativeLabel: "Dansk", enabled: false },
    { code: "fi", label: "Finnish", nativeLabel: "Suomi", enabled: false },
    { code: "pl", label: "Polish", nativeLabel: "Polski", enabled: false },
    { code: "cs", label: "Czech", nativeLabel: "Čeština", enabled: false },
    { code: "sk", label: "Slovak", nativeLabel: "Slovenčina", enabled: false },
    { code: "hu", label: "Hungarian", nativeLabel: "Magyar", enabled: false },
    { code: "ro", label: "Romanian", nativeLabel: "Română", enabled: false },
    { code: "el", label: "Greek", nativeLabel: "Ελληνικά", enabled: false },
    { code: "tr", label: "Turkish", nativeLabel: "Türkçe", enabled: false },
    { code: "ru", label: "Russian", nativeLabel: "Русский", enabled: false },
    { code: "uk", label: "Ukrainian", nativeLabel: "Українська", enabled: false },
    { code: "ar", label: "Arabic", nativeLabel: "العربية", enabled: false },
    { code: "he", label: "Hebrew", nativeLabel: "עברית", enabled: false },
    { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", enabled: false },
    { code: "bn", label: "Bengali", nativeLabel: "বাংলা", enabled: false },
    { code: "ur", label: "Urdu", nativeLabel: "اردو", enabled: false },
    { code: "th", label: "Thai", nativeLabel: "ไทย", enabled: false },
    { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt", enabled: false },
    { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", enabled: false },
    { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu", enabled: false },
    { code: "tl", label: "Filipino", nativeLabel: "Filipino", enabled: false },
    { code: "zh", label: "Chinese", nativeLabel: "中文", enabled: false },
    { code: "ja", label: "Japanese", nativeLabel: "日本語", enabled: true },
    { code: "ko", label: "Korean", nativeLabel: "한국어", enabled: true },
];

export default function AppLanguagePage() {
    const { t } = useTranslation();
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    const initialLanguage =
        storedUser?.appLanguage || localStorage.getItem("appLanguage") || "en";

    const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        localStorage.setItem("appLanguage", selectedLanguage);
    }, [selectedLanguage]);

    const filteredLanguages = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return APP_LANGUAGES;

        return APP_LANGUAGES.filter((language) => {
            return (
                language.label.toLowerCase().includes(query) ||
                language.nativeLabel.toLowerCase().includes(query) ||
                language.code.toLowerCase().includes(query)
            );
        });
    }, [search]);

    const handleSelect = (language) => {
        if (!language.enabled) return;
        setSelectedLanguage(language.code);
        setError("");
        setSuccess("");
    };

    const handleSave = async () => {
        const selected = APP_LANGUAGES.find((lang) => lang.code === selectedLanguage);

        if (!selected?.enabled) {
            setError(t("appLanguage.notAvailable"));
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const formData = new FormData();
            formData.append("appLanguage", selectedLanguage);

            const res = await fetch(`${API_URL}/api/users/me`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.msg || t("appLanguage.saveFailed"));
                return;
            }

            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("appLanguage", data.appLanguage || selectedLanguage);
            setSuccess(t("appLanguage.updated"));
        } catch (err) {
            console.error(err);
            setError(t("appLanguage.somethingWentWrong"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-language-page">
            <div className="app-language-card">
                <div className="app-language-header">
                    <span className="app-language-kicker">{t("appLanguage.kicker")}</span>
                    <h1>{t("appLanguage.title")}</h1>
                    <p>{t("appLanguage.subtitle")}</p>
                </div>

                <div className="app-language-search-wrap">
                    <input
                        type="text"
                        className="app-language-search"
                        placeholder={t("appLanguage.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="app-language-list">
                    {filteredLanguages.map((language) => {
                        const active = selectedLanguage === language.code;
                        const disabled = !language.enabled;

                        return (
                            <button
                                key={language.code}
                                type="button"
                                className={`app-language-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}`}
                                onClick={() => handleSelect(language)}
                            >
                                <div className="app-language-item-left">
                                    <div className="app-language-icon">
                                        {disabled ? <Lock size={18} /> : <Globe size={18} />}
                                    </div>

                                    <div className="app-language-copy">
                                        <div className="app-language-title-row">
                                            <strong>{language.nativeLabel}</strong>
                                            <span className="app-language-code">
                                                {language.code.toUpperCase()}
                                            </span>
                                        </div>
                                        <span>
                                            {language.label}
                                            {disabled ? ` • ${t("appLanguage.comingSoon")}` : ""}
                                        </span>
                                    </div>
                                </div>

                                <div className={`app-language-check ${active ? "visible" : ""}`}>
                                    <Check size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {error && <div className="app-language-error">{error}</div>}
                {success && <div className="app-language-success">{success}</div>}

                <button
                    type="button"
                    className="app-language-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? t("appLanguage.saving") : t("appLanguage.saveButton")}
                </button>
            </div>
        </div>
    );
}