import { useTranslation } from "../hooks/useTranslation";
import "../styles/Legal.css";

export default function TermsPage() {
    const { t } = useTranslation();

    return (
        <div className="legal-page">
            <div className="legal-card">
                <h1>{t("terms.title")}</h1>
                <p className="legal-updated">
                    {t("terms.lastUpdated")} April 2026
                </p>

                <section>
                    <h3>{t("terms.sections.acceptance.title")}</h3>
                    <p>
                        By using TalSky, you agree to these Terms of Service.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.accounts.title")}</h3>
                    <p>
                        You are responsible for your account and activity on the platform.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.behavior.title")}</h3>
                    <p>
                        You agree not to use the platform for harmful, abusive, or illegal
                        activities.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.subscriptions.title")}</h3>
                    <p>
                        Paid features are handled through Stripe. You can manage or cancel
                        your subscription at any time.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.termination.title")}</h3>
                    <p>
                        We may suspend or terminate accounts that violate our policies.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.liability.title")}</h3>
                    <p>
                        TalSky is provided "as is" without guarantees of uninterrupted service.
                    </p>
                </section>

                <section>
                    <h3>{t("terms.sections.contact.title")}</h3>
                    <p>
                        {t("terms.contactText")}
                        <br />
                        <strong>support@talsky.com</strong>
                    </p>
                </section>
            </div>
        </div>
    );
}