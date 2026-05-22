import { useTranslation } from "../hooks/useTranslation";
import "../styles/Legal.css";

export default function PrivacyPage() {
    const { t } = useTranslation();

    return (
        <div className="legal-page">
            <div className="legal-card">
                <h1>{t("privacyPolicy.title")}</h1>
                <p className="legal-updated">
                    {t("privacyPolicy.lastUpdated")} April 2026
                </p>

                <section>
                    <h3>{t("privacyPolicy.sections.collect.title")}</h3>
                    <p>
                        We collect information you provide directly, such as your name,
                        email, profile details, and messages you send through the app.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.use.title")}</h3>
                    <p>
                        We use your data to provide and improve TalSky, connect users,
                        personalize your experience, and ensure platform safety.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.location.title")}</h3>
                    <p>
                        If you enable location services, we may use your location to
                        show nearby users. You can disable this at any time.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.sharing.title")}</h3>
                    <p>
                        We do not sell your personal data. We may share limited data
                        with trusted services like Stripe for billing.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.security.title")}</h3>
                    <p>
                        We take reasonable measures to protect your data, but no system
                        is completely secure.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.rights.title")}</h3>
                    <p>
                        You can update or delete your account at any time from your
                        settings.
                    </p>
                </section>

                <section>
                    <h3>{t("privacyPolicy.sections.contact.title")}</h3>
                    <p>
                        {t("privacyPolicy.contactText")}
                        <br />
                        <strong>support@talsky.com</strong>
                    </p>
                </section>
            </div>
        </div>
    );
}