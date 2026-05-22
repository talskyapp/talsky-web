import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/DeactivateAccount.css";

export default function DeactivateAccountPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [confirmText, setConfirmText] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const requiredWord = t("deactivateAccount.confirmWord");

    const handleDeactivate = async (e) => {
        e.preventDefault();

        if (confirmText.trim().toUpperCase() !== requiredWord.toUpperCase()) {
            setError(t("deactivateAccount.errors.confirm"));
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiClient.patch("/api/users/deactivate-account");

            setSuccess(t("deactivateAccount.success"));

            setTimeout(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }, 2200);
        } catch (err) {
            console.error("Deactivate account error:", err);
            setError(
                err?.response?.data?.msg || t("deactivateAccount.errors.save")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="deactivate-page">
            <div className="deactivate-shell">
                <div className="deactivate-header">
                    <div>
                        <p className="deactivate-kicker">
                            {t("deactivateAccount.kicker")}
                        </p>
                        <h1>{t("deactivateAccount.title")}</h1>
                        <p className="deactivate-subtitle">
                            {t("deactivateAccount.subtitle")}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="deactivate-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        <span>{t("deactivateAccount.back")}</span>
                    </button>
                </div>

                {error && <p className="deactivate-error">{error}</p>}

                {success && (
                    <div className="deactivate-success-overlay">
                        <div className="deactivate-success-card">
                            <div className="deactivate-success-icon">✓</div>
                            <h3>{t("deactivateAccount.successTitle")}</h3>
                            <p>{success}</p>
                        </div>
                    </div>
                )}

                <form className="deactivate-card" onSubmit={handleDeactivate}>
                    <div className="deactivate-card-head">
                        <div className="deactivate-icon-wrap danger">
                            <AlertTriangle size={18} />
                        </div>

                        <div>
                            <h2>{t("deactivateAccount.warningTitle")}</h2>
                            <p>{t("deactivateAccount.warningText")}</p>
                        </div>
                    </div>

                    <div className="deactivate-body">
                        <div className="deactivate-info-box">
                            <p>{t("deactivateAccount.info1")}</p>
                            <p>{t("deactivateAccount.info2")}</p>
                            <p>{t("deactivateAccount.info3")}</p>
                        </div>

                        <div className="deactivate-field">
                            <label>{t("deactivateAccount.confirmLabel")}</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={t("deactivateAccount.confirmPlaceholder")}
                            />
                        </div>
                    </div>

                    <div className="deactivate-actions">
                        <button
                            type="submit"
                            className="deactivate-main-btn"
                            disabled={saving}
                        >
                            {saving
                                ? t("deactivateAccount.deactivating")
                                : t("deactivateAccount.button")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}