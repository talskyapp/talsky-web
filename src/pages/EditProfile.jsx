import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/Settings.css";

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: 52,
        borderRadius: 16,
        borderColor: state.isFocused ? "#8b7bff" : "#dbe1ea",
        boxShadow: state.isFocused ? "0 0 0 4px rgba(109, 76, 255, 0.10)" : "none",
        backgroundColor: "#ffffff",
        "&:hover": {
            borderColor: "#cfd6e3",
        },
    }),
    valueContainer: (base) => ({
        ...base,
        padding: "6px 14px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#94a3b8",
    }),
    singleValue: (base) => ({
        ...base,
        color: "#0f172a",
        fontWeight: 500,
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: "#f3f0ff",
        borderRadius: 999,
        padding: "2px 4px",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "#4c1d95",
        fontWeight: 700,
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "#4c1d95",
        borderRadius: 999,
        ":hover": {
            backgroundColor: "#e9ddff",
            color: "#4c1d95",
        },
    }),
    menu: (base) => ({
        ...base,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
        border: "1px solid #e8edf5",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#6d4cff"
            : state.isFocused
                ? "#f8fafc"
                : "#ffffff",
        color: state.isSelected ? "#ffffff" : "#0f172a",
        padding: 12,
        cursor: "pointer",
    }),
};

export default function Settings() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState("personal");

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [birthday, setBirthday] = useState("");
    const [gender, setGender] = useState("");
    const [country, setCountry] = useState(null);

    const [nativeLanguage, setNativeLanguage] = useState(null);
    const [fluentLanguages, setFluentLanguages] = useState([]);
    const [languageToLearn, setLanguageToLearn] = useState([]);

    const [goals, setGoals] = useState("");
    const [idealPartner, setIdealPartner] = useState("");
    const [aboutMe, setAboutMe] = useState("");

    const [interests, setInterests] = useState([]);
    const [showInterestsModal, setShowInterestsModal] = useState(false);
    const [tempInterests, setTempInterests] = useState([]);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    const token = localStorage.getItem("token");

    const languageOptions = useMemo(
        () => [
            { value: "Spanish", label: t("profileSettings.languages.spanish") },
            { value: "English", label: t("profileSettings.languages.english") },
            { value: "Japanese", label: t("profileSettings.languages.japanese") },
            { value: "Italian", label: t("profileSettings.languages.italian") },
            { value: "French", label: t("profileSettings.languages.french") },
            { value: "Korean", label: t("profileSettings.languages.korean") },
            { value: "Chinese", label: t("profileSettings.languages.chinese") },
            { value: "Portuguese", label: t("profileSettings.languages.portuguese") },
            { value: "German", label: t("profileSettings.languages.german") },
        ],
        [t]
    );

    const countryOptions = useMemo(
        () => [
            { value: "Argentina", label: t("profileSettings.countries.argentina") },
            { value: "Bolivia", label: t("profileSettings.countries.bolivia") },
            { value: "Brazil", label: t("profileSettings.countries.brazil") },
            { value: "Canada", label: t("profileSettings.countries.canada") },
            { value: "Chile", label: t("profileSettings.countries.chile") },
            { value: "China", label: t("profileSettings.countries.china") },
            { value: "Colombia", label: t("profileSettings.countries.colombia") },
            { value: "Costa Rica", label: t("profileSettings.countries.costaRica") },
            { value: "Cuba", label: t("profileSettings.countries.cuba") },
            {
                value: "Dominican Republic",
                label: t("profileSettings.countries.dominicanRepublic"),
            },
            { value: "Ecuador", label: t("profileSettings.countries.ecuador") },
            { value: "El Salvador", label: t("profileSettings.countries.elSalvador") },
            { value: "France", label: t("profileSettings.countries.france") },
            { value: "Germany", label: t("profileSettings.countries.germany") },
            { value: "Guatemala", label: t("profileSettings.countries.guatemala") },
            { value: "Honduras", label: t("profileSettings.countries.honduras") },
            { value: "India", label: t("profileSettings.countries.india") },
            { value: "Indonesia", label: t("profileSettings.countries.indonesia") },
            { value: "Italy", label: t("profileSettings.countries.italy") },
            { value: "Japan", label: t("profileSettings.countries.japan") },
            { value: "Korea", label: t("profileSettings.countries.southKorea") },
            { value: "Mexico", label: t("profileSettings.countries.mexico") },
            { value: "Netherlands", label: t("profileSettings.countries.netherlands") },
            { value: "Nicaragua", label: t("profileSettings.countries.nicaragua") },
            { value: "Panama", label: t("profileSettings.countries.panama") },
            { value: "Paraguay", label: t("profileSettings.countries.paraguay") },
            { value: "Peru", label: t("profileSettings.countries.peru") },
            { value: "Philippines", label: t("profileSettings.countries.philippines") },
            { value: "Poland", label: t("profileSettings.countries.poland") },
            { value: "Portugal", label: t("profileSettings.countries.portugal") },
            { value: "Spain", label: t("profileSettings.countries.spain") },
            { value: "Sweden", label: t("profileSettings.countries.sweden") },
            { value: "Switzerland", label: t("profileSettings.countries.switzerland") },
            { value: "Thailand", label: t("profileSettings.countries.thailand") },
            { value: "Turkey", label: t("profileSettings.countries.turkey") },
            { value: "Ukraine", label: t("profileSettings.countries.ukraine") },
            {
                value: "United Kingdom",
                label: t("profileSettings.countries.unitedKingdom"),
            },
            {
                value: "United States",
                label: t("profileSettings.countries.unitedStates"),
            },
            { value: "Uruguay", label: t("profileSettings.countries.uruguay") },
            { value: "Venezuela", label: t("profileSettings.countries.venezuela") },
            { value: "Vietnam", label: t("profileSettings.countries.vietnam") },
        ],
        [t]
    );

    const genderOptions = useMemo(
        () => [
            { value: "male", label: t("profileSettings.genderOptions.male") },
            { value: "female", label: t("profileSettings.genderOptions.female") },
            { value: "other", label: t("profileSettings.genderOptions.other") },
        ],
        [t]
    );

    const interestOptions = useMemo(
        () => [
            { icon: "🎵", label: t("profileSettings.interestOptions.music") },
            { icon: "🎬", label: t("profileSettings.interestOptions.movies") },
            { icon: "🎨", label: t("profileSettings.interestOptions.painting") },
            { icon: "🍜", label: t("profileSettings.interestOptions.food") },
            { icon: "🎮", label: t("profileSettings.interestOptions.gaming") },
            { icon: "📚", label: t("profileSettings.interestOptions.reading") },
            { icon: "🧳", label: t("profileSettings.interestOptions.travel") },
            { icon: "🐶", label: t("profileSettings.interestOptions.pets") },
            { icon: "🏋️", label: t("profileSettings.interestOptions.fitness") },
            { icon: "📷", label: t("profileSettings.interestOptions.photography") },
            { icon: "🎧", label: t("profileSettings.interestOptions.podcasts") },
            { icon: "🧘", label: t("profileSettings.interestOptions.yoga") },
            { icon: "🏞️", label: t("profileSettings.interestOptions.nature") },
            { icon: "🎤", label: t("profileSettings.interestOptions.karaoke") },
            { icon: "🕹️", label: t("profileSettings.interestOptions.arcade") },
            { icon: "🍿", label: t("profileSettings.interestOptions.cinema") },
            { icon: "🎭", label: t("profileSettings.interestOptions.theater") },
            { icon: "🛍️", label: t("profileSettings.interestOptions.shopping") },
            { icon: "🎌", label: t("profileSettings.interestOptions.anime") },
            { icon: "⚽", label: t("profileSettings.interestOptions.sports") },
            { icon: "🖥️", label: t("profileSettings.interestOptions.tech") },
            { icon: "🎸", label: t("profileSettings.interestOptions.instruments") },
            { icon: "🍳", label: t("profileSettings.interestOptions.cooking") },
        ],
        [t]
    );

    const currentPhotoUrl = useMemo(() => {
        if (photoPreview) return photoPreview;
        if (user?.photo) {
            if (user.photo.startsWith("http")) return user.photo;
            return `${API_URL}${user.photo}`;
        }
        return "/default-avatar.jpg";
    }, [photoPreview, user]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                setError("");

                if (!API_URL) {
                    throw new Error("API_URL is missing");
                }

                if (!token) {
                    throw new Error("Missing auth token");
                }

                const res = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const u = res.data.user;
                setUser(u);

                setName(u.name || "");
                setBirthday(u.birthday || "");
                setGender((u.gender || "").toLowerCase());
                setCountry(countryOptions.find((c) => c.value === u.country) || null);

                setNativeLanguage(
                    languageOptions.find((l) => l.value === u.nativeLanguage) || null
                );

                let fluent = u.fluentLanguages;
                if (typeof fluent === "string") fluent = [fluent];
                if (fluent && typeof fluent === "object" && !Array.isArray(fluent)) {
                    fluent = [fluent.value];
                }
                if (!fluent) fluent = [];

                setFluentLanguages(
                    fluent
                        .map((l) => languageOptions.find((opt) => opt.value === l))
                        .filter(Boolean)
                );

                let learn = u.languageToLearn;
                if (typeof learn === "string") learn = [learn];
                if (learn && typeof learn === "object" && !Array.isArray(learn)) {
                    learn = [learn.value];
                }
                if (!learn) learn = [];

                setLanguageToLearn(
                    learn
                        .map((l) => languageOptions.find((opt) => opt.value === l))
                        .filter(Boolean)
                );

                setGoals(u.goals || "");
                setIdealPartner(u.idealPartner || "");
                setAboutMe(u.bio || "");
                setInterests(Array.isArray(u.interests) ? u.interests : []);
            } catch (err) {
                console.error("FETCH USER ERROR:", err);
                setError(t("profileSettings.errors.loadProfile"));
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token, t, countryOptions, languageOptions]);

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setError(t("profileSettings.errors.invalidImageType"));
            return;
        }

        if (file.size > maxSize) {
            setError(t("profileSettings.errors.imageTooLarge"));
            return;
        }

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setError("");
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleRemoveSelectedPhoto = () => {
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }
        setPhotoFile(null);
        setPhotoPreview("");
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");

            if (!API_URL) {
                throw new Error("API_URL is missing");
            }

            if (!token) {
                throw new Error("Missing auth token");
            }

            const formData = new FormData();

            formData.append("name", name);
            formData.append("birthday", birthday);
            formData.append("gender", gender);
            formData.append("country", country?.value || "");
            formData.append("nativeLanguage", nativeLanguage?.value || "");
            formData.append("goals", goals);
            formData.append("idealPartner", idealPartner);
            formData.append("bio", aboutMe);
            formData.append("profileCompleted", "true");

            fluentLanguages.forEach((item) => {
                formData.append("fluentLanguages", item.value);
            });

            languageToLearn.forEach((item) => {
                formData.append("languageToLearn", item.value);
            });

            interests.forEach((item) => {
                formData.append("interests", item);
            });

            if (photoFile) {
                formData.append("photo", photoFile);
            }

            const res = await axios.patch(`${API_URL}/api/users/me`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const updatedUser = res.data;
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setPhotoFile(null);
            setPhotoPreview("");
            alert(t("profileSettings.alerts.profileUpdated"));
        } catch (err) {
            console.error("SAVE ERROR:", err);
            setError(t("profileSettings.errors.saveProfile"));
            alert(t("profileSettings.errors.saveProfile"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-loading">
                {t("profileSettings.loading")}
            </div>
        );
    }

    if (error && !user) {
        return <div className="settings-loading">{error}</div>;
    }

    if (!user) {
        return (
            <div className="settings-loading">
                {t("profileSettings.noProfileData")}
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-shell">
                <div className="settings-header">
                    <div>
                        <p className="settings-kicker">
                            {t("profileSettings.kicker")}
                        </p>
                        <h1>{t("profileSettings.title")}</h1>
                        <p className="settings-subtitle">
                            {t("profileSettings.subtitle")}
                        </p>
                    </div>

                    <button
                        className="save-btn desktop-save"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? t("profileSettings.saving")
                            : t("profileSettings.saveChanges")}
                    </button>
                </div>

                <div className="settings-tabs">
                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "personal" ? "active" : ""}`}
                        onClick={() => setActiveTab("personal")}
                    >
                        {t("profileSettings.tabs.personal")}
                    </button>

                    <button
                        type="button"
                        className={`settings-tab ${activeTab === "learning" ? "active" : ""}`}
                        onClick={() => setActiveTab("learning")}
                    >
                        {t("profileSettings.tabs.learning")}
                    </button>
                </div>

                {error && <p className="settings-error">{error}</p>}

                {activeTab === "personal" && (
                    <div className="settings-grid single-tab">
                        <div className="settings-main">
                            <section className="settings-card">
                                <div className="settings-section-head">
                                    <h3>{t("profileSettings.photo.title")}</h3>
                                    <p>{t("profileSettings.photo.subtitle")}</p>
                                </div>

                                <div className="settings-photo-block">
                                    <div className="settings-avatar-wrap">
                                        <img
                                            src={currentPhotoUrl}
                                            alt={t("profileSettings.photo.alt")}
                                            className="settings-avatar"
                                        />
                                    </div>

                                    <div className="settings-photo-actions">
                                        <label className="settings-upload-btn">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                onChange={handlePhotoChange}
                                                hidden
                                            />
                                            {photoFile
                                                ? t("profileSettings.photo.changeSelected")
                                                : t("profileSettings.photo.uploadNew")}
                                        </label>

                                        {photoFile && (
                                            <button
                                                type="button"
                                                className="settings-remove-photo-btn"
                                                onClick={handleRemoveSelectedPhoto}
                                            >
                                                {t("profileSettings.photo.removeSelection")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="settings-card">
                                <div className="settings-section-head">
                                    <h3>{t("profileSettings.personalInfo.title")}</h3>
                                    <p>{t("profileSettings.personalInfo.subtitle")}</p>
                                </div>

                                <div className="settings-form-grid">
                                    <div className="field full">
                                        <label>{t("profileSettings.fields.name")}</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    <div className="field">
                                        <label>{t("profileSettings.fields.birthday")}</label>
                                        <input
                                            type="date"
                                            value={birthday}
                                            onChange={(e) => setBirthday(e.target.value)}
                                        />
                                    </div>

                                    <div className="field">
                                        <label>{t("profileSettings.fields.gender")}</label>
                                        <Select
                                            options={genderOptions}
                                            value={
                                                genderOptions.find((g) => g.value === gender) || null
                                            }
                                            onChange={(opt) => setGender(opt?.value || "")}
                                            styles={customSelectStyles}
                                            placeholder={t("profileSettings.placeholders.select")}
                                        />
                                    </div>

                                    <div className="field full">
                                        <label>
                                            {t("profileSettings.fields.countryOfOrigin")}
                                        </label>
                                        <Select
                                            options={countryOptions}
                                            value={country}
                                            onChange={setCountry}
                                            isSearchable
                                            styles={customSelectStyles}
                                            placeholder={t(
                                                "profileSettings.placeholders.selectCountry"
                                            )}
                                        />
                                    </div>

                                    <div className="field full">
                                        <label>{t("profileSettings.fields.aboutMe")}</label>
                                        <textarea
                                            value={aboutMe}
                                            onChange={(e) => setAboutMe(e.target.value)}
                                            placeholder={t(
                                                "profileSettings.placeholders.aboutMe"
                                            )}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "learning" && (
                    <div className="settings-grid">
                        <div className="settings-main">
                            <section className="settings-card">
                                <div className="settings-section-head">
                                    <h3>
                                        {t("profileSettings.learningSection.languagesTitle")}
                                    </h3>
                                    <p>
                                        {t("profileSettings.learningSection.languagesSubtitle")}
                                    </p>
                                </div>

                                <div className="settings-form-grid">
                                    <div className="field full">
                                        <label>
                                            {t("profileSettings.fields.nativeLanguage")}
                                        </label>
                                        <Select
                                            options={languageOptions}
                                            value={nativeLanguage}
                                            onChange={setNativeLanguage}
                                            isSearchable
                                            styles={customSelectStyles}
                                            placeholder={t(
                                                "profileSettings.placeholders.selectLanguage"
                                            )}
                                        />
                                    </div>

                                    <div className="field full">
                                        <label>
                                            {t("profileSettings.fields.fluentLanguages")}
                                        </label>
                                        <Select
                                            options={languageOptions}
                                            value={fluentLanguages}
                                            onChange={setFluentLanguages}
                                            isMulti
                                            isSearchable
                                            styles={customSelectStyles}
                                            placeholder={t(
                                                "profileSettings.placeholders.selectLanguages"
                                            )}
                                        />
                                    </div>

                                    <div className="field full">
                                        <label>
                                            {t("profileSettings.fields.languagesToLearn")}
                                        </label>
                                        <Select
                                            options={languageOptions}
                                            value={languageToLearn}
                                            onChange={setLanguageToLearn}
                                            isMulti
                                            isSearchable
                                            styles={customSelectStyles}
                                            placeholder={t(
                                                "profileSettings.placeholders.selectLanguages"
                                            )}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="settings-card">
                                <div className="settings-section-head">
                                    <h3>{t("profileSettings.preferences.title")}</h3>
                                    <p>{t("profileSettings.preferences.subtitle")}</p>
                                </div>

                                <div className="settings-form-grid">
                                    <div className="field full">
                                        <label>{t("profileSettings.fields.goal")}</label>
                                        <input
                                            value={goals}
                                            onChange={(e) => setGoals(e.target.value)}
                                            placeholder={t(
                                                "profileSettings.placeholders.goal"
                                            )}
                                        />
                                    </div>

                                    <div className="field full">
                                        <label>
                                            {t("profileSettings.fields.idealPartner")}
                                        </label>
                                        <input
                                            value={idealPartner}
                                            onChange={(e) => setIdealPartner(e.target.value)}
                                            placeholder={t(
                                                "profileSettings.placeholders.idealPartner"
                                            )}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="settings-side">
                            <section className="settings-card sticky-card">
                                <div className="settings-section-head">
                                    <h3>{t("profileSettings.interests.title")}</h3>
                                    <p>{t("profileSettings.interests.subtitle")}</p>
                                </div>

                                {interests.length > 0 ? (
                                    <div className="chips">
                                        {interests.map((i, idx) => (
                                            <span key={idx} className="chip">
                                                {i}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-note">
                                        {t("profileSettings.interests.empty")}
                                    </p>
                                )}

                                <button
                                    className="add-btn"
                                    onClick={() => {
                                        setTempInterests(interests);
                                        setShowInterestsModal(true);
                                    }}
                                >
                                    {t("profileSettings.interests.add")}
                                </button>
                            </section>
                        </aside>
                    </div>
                )}

                <div className="mobile-save-wrap">
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving
                            ? t("profileSettings.saving")
                            : t("profileSettings.saveChanges")}
                    </button>
                </div>

                {showInterestsModal && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowInterestsModal(false)}
                    >
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <p className="settings-kicker">
                                        {t("profileSettings.modal.kicker")}
                                    </p>
                                    <h3>{t("profileSettings.modal.title")}</h3>
                                </div>
                            </div>

                            <div className="interest-grid">
                                {interestOptions.map((opt, idx) => {
                                    const selected = tempInterests.includes(opt.label);

                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            className={`interest-card ${selected ? "selected" : ""}`}
                                            onClick={() => {
                                                if (selected) {
                                                    setTempInterests(
                                                        tempInterests.filter((i) => i !== opt.label)
                                                    );
                                                } else {
                                                    setTempInterests([...tempInterests, opt.label]);
                                                }
                                            }}
                                        >
                                            <span className="icon">{opt.icon}</span>
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="modal-actions">
                                <button onClick={() => setShowInterestsModal(false)}>
                                    {t("profileSettings.modal.cancel")}
                                </button>
                                <button
                                    className="save-interests"
                                    onClick={() => {
                                        setInterests(tempInterests);
                                        setShowInterestsModal(false);
                                    }}
                                >
                                    {t("profileSettings.modal.saveInterests")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}