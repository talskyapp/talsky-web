import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/DeleteAccount.css";

export default function DeleteAccountPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [confirmText, setConfirmText] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const requiredWord = t("deleteAccount.confirmWord");

    const handleDelete = async (e) => {
        e.preventDefault();

        if (saving) return;

        if (confirmText.trim().toUpperCase() !== requiredWord.toUpperCase()) {
            setError(t("deleteAccount.errors.confirm"));
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await apiClient.delete("/api/users/delete-account");

            setSuccess(t("deleteAccount.success"));

            setTimeout(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }, 2200);
        } catch (err) {
            console.error("Delete account error:", err);
            setError(
                err?.response?.data?.msg || t("deleteAccount.errors.save")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="delete-page">
            <div className="delete-shell">
                <div className="delete-header">
                    <div>
                        <p className="delete-kicker">{t("deleteAccount.kicker")}</p>
                        <h1>{t("deleteAccount.title")}</h1>
                        <p className="delete-subtitle">{t("deleteAccount.subtitle")}</p>
                    </div>

                    <button
                        type="button"
                        className="delete-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        <span>{t("deleteAccount.back")}</span>
                    </button>
                </div>

                {error && <p className="delete-error">{error}</p>}

                {success && (
                    <div className="delete-success-overlay">
                        <div className="delete-success-card">
                            <div className="delete-success-icon">✓</div>
                            <h3>{t("deleteAccount.successTitle")}</h3>
                            <p>{success}</p>
                        </div>
                    </div>
                )}

                <form className="delete-card" onSubmit={handleDelete}>
                    <div className="delete-card-head">
                        <div className="delete-icon-wrap danger">
                            <Trash2 size={18} />
                        </div>

                        <div>
                            <h2>{t("deleteAccount.warningTitle")}</h2>
                            <p>{t("deleteAccount.warningText")}</p>
                        </div>
                    </div>

                    <div className="delete-body">
                        <div className="delete-info-box">
                            <p>{t("deleteAccount.info1")}</p>
                            <p>{t("deleteAccount.info2")}</p>
                            <p>{t("deleteAccount.info3")}</p>
                        </div>

                        <div className="delete-field">
                            <label>{t("deleteAccount.confirmLabel")}</label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => {
                                    setConfirmText(e.target.value);
                                    if (error) setError("");
                                }}
                                placeholder={t("deleteAccount.confirmPlaceholder")}
                            />
                        </div>
                    </div>

                    <div className="delete-actions">
                        <button
                            type="submit"
                            className="delete-main-btn"
                            disabled={saving}
                        >
                            {saving
                                ? t("deleteAccount.deleting")
                                : t("deleteAccount.button")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}