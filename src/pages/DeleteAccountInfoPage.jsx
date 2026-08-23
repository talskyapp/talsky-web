import { Link } from "react-router-dom";
import "../styles/DeleteAccountInfoPage.css";

export default function DeleteAccountInfoPage() {
    const emailSubject = encodeURIComponent(
        "TalSky Account Deletion Request"
    );

    const emailBody = encodeURIComponent(
        `Hello TalSky Support,

I would like to permanently delete my TalSky account and associated personal data.

Account email:
Username:

Thank you.`
    );

    const emailLink =
        `https://mail.google.com/mail/?view=cm&fs=1` +
        `&to=support@talsky.app` +
        `&su=${emailSubject}` +
        `&body=${emailBody}`;

    return (
        <main className="deletion-info-page">
            <div className="deletion-info-shell">
                <p className="deletion-info-kicker">TALSKY ACCOUNT</p>

                <h1>Delete your TalSky account</h1>

                <p className="deletion-info-intro">
                    You can permanently delete your TalSky account and
                    associated personal data from the app or request deletion
                    by email.
                </p>

                <section className="deletion-info-card">
                    <h2>Delete your account in the app</h2>

                    <ol>
                        <li>Sign in to TalSky.</li>
                        <li>Open Settings.</li>
                        <li>Select Account settings.</li>
                        <li>Select Delete account.</li>
                        <li>Type DELETE and confirm the deletion.</li>
                    </ol>

                    <Link
                        to="/login"
                        className="deletion-info-secondary-button"
                    >
                        Sign in to TalSky
                    </Link>
                </section>

                <section className="deletion-info-card">
                    <h2>Request deletion without the app</h2>

                    <p>
                        If you cannot access TalSky, send a deletion request
                        from the email address associated with your account.
                        Include your account email or username so we can locate
                        the correct account.
                    </p>

                    <a
                        href={emailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deletion-info-primary-button"
                    >
                        Request account deletion
                    </a>

                    <p className="deletion-info-email">
                        Email: support@talsky.app
                    </p>
                </section>

                <section className="deletion-info-card">
                    <h2>Data that will be deleted</h2>

                    <ul>
                        <li>Profile information and account credentials</li>
                        <li>Profile photos and verification documents</li>
                        <li>Location and language preferences</li>
                        <li>Connections, follows and blocks</li>
                        <li>Message text and uploaded chat media</li>
                        <li>Learning progress, vocabulary and AI learning data</li>
                        <li>Push notification and device identifiers</li>
                    </ul>
                </section>

                <section className="deletion-info-card">
                    <h2>Data that may be retained</h2>

                    <p>
                        Limited records may be retained when necessary for
                        security, fraud prevention, dispute resolution or legal
                        compliance.
                    </p>

                    <ul>
                        <li>
                            Security records may be retained for up to 90 days.
                        </li>
                        <li>
                            Safety reports and moderation records may be
                            retained for up to 2 years.
                        </li>
                        <li>
                            Transaction records may be retained by payment
                            providers for legally required periods.
                        </li>
                    </ul>

                    <p>
                        Any account record retained for technical integrity is
                        anonymized and no longer identifies the user.
                    </p>
                </section>

                <section className="deletion-info-card deletion-info-help">
                    <h2>Need help?</h2>

                    <p>
                        Contact{" "}
                        <a href="mailto:support@talsky.app">
                            support@talsky.app
                        </a>
                    </p>

                    <Link to="/privacy">
                        Read the TalSky Privacy Policy
                    </Link>
                </section>
            </div>
        </main>
    );
}