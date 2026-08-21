import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";
import "../styles/PublicPage.css";

export default function Support() {
    return (
        <main className="public-page">
            <header className="public-page-header">
                <Link to="/" className="public-page-brand">
                    <img src="/TalSky.jpeg" alt="TalSky" />
                    <span>TalSky</span>
                </Link>

                <Link to="/" className="public-page-back">
                    Back to home
                </Link>
            </header>

            <section className="public-page-hero">
                <span className="public-page-kicker">SUPPORT</span>

                <h1>How can we help?</h1>

                <p>
                    Get assistance with your TalSky account, subscriptions,
                    privacy, safety, or any app feature.
                </p>
            </section>

            <section className="public-page-content">
                <article className="public-info-card">
                    <span className="public-info-icon">✉️</span>

                    <div>
                        <h2>Contact our support team</h2>

                        <p>
                            Send us an email with your TalSky username and a
                            brief description of the issue.
                        </p>

                        <a
                            href="mailto:talskyapp@gmail.com"
                            className="public-primary-link"
                        >
                            talskyapp@gmail.com
                        </a>

                        <small>
                            Please do not include your password or payment
                            information.
                        </small>
                    </div>
                </article>

                <article className="public-info-card">
                    <span className="public-info-icon">⏱️</span>

                    <div>
                        <h2>Response time</h2>

                        <p>
                            We usually respond to support requests within
                            24–48 hours.
                        </p>
                    </div>
                </article>

                <article className="public-info-card">
                    <span className="public-info-icon">💳</span>

                    <div>
                        <h2>Subscriptions and payments</h2>

                        <p>
                            Subscriptions purchased through the App Store or
                            Google Play are managed securely through your store
                            account.
                        </p>

                        <a
                            href="https://support.apple.com/billing"
                            target="_blank"
                            rel="noreferrer"
                            className="public-text-link"
                        >
                            Apple billing support
                        </a>

                        <a
                            href="https://support.google.com/googleplay/answer/7018481"
                            target="_blank"
                            rel="noreferrer"
                            className="public-text-link"
                        >
                            Google Play subscriptions
                        </a>
                    </div>
                </article>

                <article className="public-info-card">
                    <span className="public-info-icon">🔐</span>

                    <div>
                        <h2>Privacy and account management</h2>

                        <p>
                            Learn how TalSky handles your information or request
                            help managing or deleting your account.
                        </p>

                        <div className="public-link-row">
                            <Link to="/privacy" className="public-text-link">
                                Privacy Policy
                            </Link>

                            <Link to="/terms" className="public-text-link">
                                Terms of Service
                            </Link>

                            {/*<Link
                                to="/account-deletion"
                                className="public-text-link"
                            >
                                Account deletion
                            </Link>*/}
                        </div>
                    </div>
                </article>
            </section>

            <PublicFooter />
        </main>
    );
}