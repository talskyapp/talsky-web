import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/ChangePassword.css";

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiClient.patch("/api/users/change-password", form);

            setSuccess(t("changePassword.success"));

            setForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

      
            setTimeout(() => {
                navigate(-1);
            }, 2200);

        } catch (err) {
            console.error("Change password error:", err);
            setError(
                err?.response?.data?.msg || t("changePassword.errors.save")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="change-password-page">
            <div className="change-password-shell">
                <div className="change-password-header">
                    <div>
                        <p className="change-password-kicker">
                            {t("changePassword.kicker")}
                        </p>
                        <h1>{t("changePassword.title")}</h1>
                        <p className="change-password-subtitle">
                            {t("changePassword.subtitle")}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="change-password-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        <span>{t("changePassword.back")}</span>
                    </button>
                </div>

                {error && <p className="change-password-error">{error}</p>}
                {success && (
                    <div className="change-password-success-overlay">
                        <div className="change-password-success-card">
                            <div className="change-password-success-icon">✓</div>
                            <h3>{t("changePassword.successTitle")}</h3>
                            <p>{success}</p>
                        </div>
                    </div>
                )}

                <form className="change-password-card" onSubmit={handleSubmit}>
                    <div className="change-password-card-head">
                        <div className="change-password-icon-wrap">
                            <LockKeyhole size={18} />
                        </div>

                        <div>
                            <h2>{t("changePassword.cardTitle")}</h2>
                            <p>{t("changePassword.cardSubtitle")}</p>
                        </div>
                    </div>

                    <div className="change-password-fields">
                        <div className="change-password-field">
                            <label>{t("changePassword.currentPassword")}</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={form.currentPassword}
                                onChange={handleChange}
                                placeholder={t("changePassword.currentPasswordPlaceholder")}
                            />
                        </div>

                        <div className="change-password-field">
                            <label>{t("changePassword.newPassword")}</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder={t("changePassword.newPasswordPlaceholder")}
                            />
                        </div>

                        <div className="change-password-field">
                            <label>{t("changePassword.confirmPassword")}</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder={t("changePassword.confirmPasswordPlaceholder")}
                            />
                        </div>
                    </div>

                    <div className="change-password-actions">
                        <button
                            type="submit"
                            className="change-password-save-btn"
                            disabled={saving}
                        >
                            {saving
                                ? t("changePassword.saving")
                                : t("changePassword.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}