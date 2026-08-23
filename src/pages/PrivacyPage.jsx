import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import PublicFooter from "../components/PublicFooter";
import "../styles/Legal.css";

export default function PrivacyPage() {
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
                        The English version of this Privacy Policy is the
                        official and legally binding version.
                    </p>
                    <span className="legal-kicker">
                        {t("privacyPolicy.kicker")}
                    </span>

                    <h1>{t("privacyPolicy.title")}</h1>

                    <p className="legal-updated">
                        {t("privacyPolicy.updated")}
                    </p>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.collect.title")}
                        </h3>

                        <p>
                            We collect information you provide directly,
                            including your name, username, email address,
                            birthday, profile photo, biography, country,
                            languages, interests, learning goals, account
                            preferences, and other profile information.
                            We also process messages and media you choose to
                            send, reports, verification information,
                            subscription status, and technical information
                            needed to operate and secure TalSky.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.use.title")}
                        </h3>

                        <p>
                            We use your information to create and manage your
                            account, connect you with language partners,
                            personalize recommendations, provide messaging and
                            discovery features, process subscriptions, deliver
                            notifications, prevent abuse, moderate content,
                            provide customer support, and improve the safety,
                            reliability, and functionality of TalSky.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.location.title")}
                        </h3>

                        <p>
                            If you grant location permission, TalSky may process
                            your approximate or precise location to provide
                            Nearby features, location-based discovery, and
                            relevant recommendations. You may disable location
                            permission through your device settings, although
                            some features may no longer be available.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.sharing.title")}
                        </h3>

                        <p>
                            We do not sell your personal information. We may
                            share limited information with service providers
                            that help us operate TalSky, including cloud
                            hosting, media storage, email delivery,
                            notifications, authentication, artificial
                            intelligence features, security, analytics, and
                            customer support.
                        </p>

                        <p>
                            Payments and subscriptions may be processed through
                            Apple, Google Play, Stripe, RevenueCat, or another
                            authorized payment provider, depending on the
                            platform used. These providers process payment and
                            transaction information under their own privacy
                            policies.
                        </p>

                        <p>
                            We may also disclose information when required by
                            law, to protect the safety and rights of users, to
                            investigate abuse or fraud, or as part of a
                            business transfer permitted by law.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.security.title")}
                        </h3>

                        <p>
                            We use reasonable administrative, technical, and
                            organizational safeguards to protect your
                            information. However, no online service or storage
                            system can guarantee absolute security.
                        </p>

                        <p>
                            You are responsible for maintaining the
                            confidentiality of your password and for notifying
                            us if you believe your account has been accessed
                            without authorization.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t(
                                "privacyPolicy.sections.dataretention.title"
                            )}
                        </h3>

                        <p>
                            We retain personal information only for as long as
                            necessary to provide TalSky, comply with legal
                            obligations, resolve disputes, enforce our agreements,
                            prevent fraud, and protect the safety of our users.
                        </p>

                        <p>
                            When an account is deleted, profile information,
                            account credentials, uploaded media, message content,
                            learning data, connections, and other associated
                            personal data are deleted or anonymized. Limited
                            security records may be retained for up to 90 days,
                            while safety reports and moderation records may be
                            retained for up to 2 years when necessary for safety,
                            fraud prevention, dispute resolution, or legal
                            compliance.
                        </p>

                        <p>
                            Payment and transaction records may also be retained
                            by Apple, Google Play, Stripe, RevenueCat, or other
                            payment providers for periods required by applicable
                            laws and their own retention policies.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t(
                                "privacyPolicy.sections.internationaltransfers.title"
                            )}
                        </h3>

                        <p>
                            Your information may be processed and stored in
                            countries other than the country where you live.
                            These countries may have different data protection
                            laws. We take reasonable measures to protect your
                            information when it is transferred internationally.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.rights.title")}
                        </h3>

                        <p>
                            Depending on where you live, you may have the right
                            to access, correct, download, restrict, object to,
                            or request deletion of your personal information.
                            You may update many account details or delete your
                            account from TalSky settings.
                        </p>

                        <p>
                            To learn how to delete your TalSky account or submit
                            a deletion request without using the app, visit our{" "}
                            <Link to="/delete-account">
                                Account Deletion page
                            </Link>.
                        </p>

                        <p>
                            You may also manage permissions such as location,
                            photos, camera, microphone, and notifications
                            through your device settings.
                        </p>
                    </section>

                    <section>
                        <h3>
                            {t("privacyPolicy.sections.contact.title")}
                        </h3>

                        <p>
                            If you have questions about this Privacy Policy or
                            want to submit a privacy request, contact us at{" "}
                            <a href="mailto:support@talsky.app">
                                support@talsky.app
                            </a>
                        </p>

                        <p>
                            You can also visit our{" "}
                            <Link to="/support">Support page</Link>.
                        </p>
                    </section>
                </div>
            </div>

            <PublicFooter />
        </main>
    );
}