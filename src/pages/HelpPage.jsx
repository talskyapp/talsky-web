import { LifeBuoy, Mail, ShieldCheck, FileText } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/HelpPage.css";

export default function HelpPage() {
    const { t } = useTranslation();

    return (
        <div className="help-page">
            <div className="help-card">
                <div className="help-hero">
                    <div className="help-badge">
                        <LifeBuoy size={16} />
                        <span>{t("help.title")}</span>
                    </div>

                    <h1>{t("help.title")}</h1>
                    <p className="help-subtitle">{t("help.subtitle")}</p>
                </div>

                <div className="help-section">
                    <div className="help-section-header">
                        <div className="help-section-icon">
                            <Mail size={18} />
                        </div>

                        <div>
                            <h3>{t("help.contactTitle")}</h3>
                            <p>{t("help.contactText")}</p>
                        </div>
                    </div>

                    <a
                        href="mailto:support@talsky.com"
                        className="help-btn"
                    >
                        {t("help.contactButton")}
                    </a>
                </div>

                <div className="help-section">
                    <div className="help-section-header">
                        <div className="help-section-icon">
                            <ShieldCheck size={18} />
                        </div>

                        <div>
                            <h3>{t("help.policiesTitle")}</h3>
                            <p>{t("help.policiesText")}</p>
                        </div>
                    </div>

                    <div className="help-links">
                        <a href="/privacy" className="help-link-card">
                            <FileText size={16} />
                            <span>{t("help.privacy")}</span>
                        </a>

                        <a href="/terms" className="help-link-card">
                            <FileText size={16} />
                            <span>{t("help.terms")}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}