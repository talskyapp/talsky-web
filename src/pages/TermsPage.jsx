import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import PublicFooter from "../components/PublicFooter";
import "../styles/Legal.css";

export default function TermsPage() {
    const { t } = useTranslation();

    return (
        <main className="legal-page">
            <header className="legal-header">
                <Link to="/" className="legal-brand">
                    <img src="/TalSky.jpeg" alt="TalSky" />
                    <span>TalSky</span>
                </Link>

                <Link to="/" className="legal-back">
                    Back to home
                </Link>
            </header>

            <div className="legal-content">
                <div className="legal-card">
                    <p className="legal-notice">
                        The English version of these Terms is the official and
                        legally binding version.
                    </p>
                    <span className="legal-kicker">
                        {t("terms.kicker")}
                    </span>

                    <h1>{t("terms.title")}</h1>

                    <p className="legal-updated">
                        {t("terms.updated")}
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
                            You are responsible for your account and activity
                            on the platform.
                        </p>
                    </section>

                    <section>
                        <h3>{t("terms.sections.behavior.title")}</h3>

                        <p>
                            You agree not to use the platform for harmful,
                            abusive, or illegal activities.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("terms.sections.subscriptions.title")}
                        </h3>

                        <p>
                            TalSky may offer optional paid subscriptions or
                            premium features. Purchases made through the mobile
                            app are processed by the applicable app store or
                            authorized payment provider. Subscriptions may
                            renew automatically unless canceled through the
                            platform where they were purchased. Prices, billing
                            periods, available benefits, trials, and
                            promotional offers may vary by platform and region.
                        </p>
                    </section>

                    <section>
                        <h3>{t("terms.sections.termination.title")}</h3>

                        <p>
                            We may suspend or terminate accounts that violate
                            our policies.
                        </p>
                    </section>

                    <section>
                        <h3>{t("terms.sections.liability.title")}</h3>

                        <p>
                            TalSky is provided “as is” without guarantees of
                            uninterrupted service.
                        </p>
                    </section>

                    <section>
                        <h3>{t("terms.sections.contact.title")}</h3>

                        <p>
                            Questions? Contact us at{" "}
                            <a href="mailto:talskyapp@gmail.com">
                                talskyapp@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>

            <PublicFooter />
        </main>
    );
}