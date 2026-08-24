import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";
import "../styles/Legal.css";

export default function ChildSafetyPage() {
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
                <article className="legal-card">
                    <p className="legal-notice">
                        These standards describe TalSky’s approach to child
                        safety and the prevention of child sexual abuse and
                        exploitation.
                    </p>

                    <span className="legal-kicker">SAFETY</span>

                    <h1>Child Safety Standards</h1>

                    <p className="legal-updated">
                        Last updated: August 23, 2026
                    </p>

                    <section>
                        <h3>Zero-tolerance policy</h3>

                        <p>
                            TalSky has zero tolerance for child sexual abuse
                            and exploitation (CSAE) and child sexual abuse
                            material (CSAM).
                        </p>

                        <p>
                            Users must not create, upload, share, request,
                            promote, distribute, or facilitate content that
                            sexually exploits or endangers children. This
                            prohibition includes grooming, sextortion,
                            sexualization of minors, trafficking, and attempts
                            to obtain or distribute CSAM.
                        </p>
                    </section>

                    <section>
                        <h3>Reporting safety concerns</h3>

                        <p>
                            Users can report accounts, messages, and content
                            using the reporting tools available inside TalSky.
                            Reports may also be submitted to{" "}
                            <a href="mailto:support@talsky.app">
                                support@talsky.app
                            </a>.
                        </p>

                        <p>
                            If a child may be in immediate danger, users should
                            contact their local emergency services or law
                            enforcement authority.
                        </p>
                    </section>

                    <section>
                        <h3>Review and enforcement</h3>

                        <p>
                            TalSky reviews reported safety concerns and may
                            remove content, restrict access, suspend accounts,
                            or permanently delete accounts that violate these
                            standards.
                        </p>

                        <p>
                            We may preserve relevant information when required
                            or permitted by law and cooperate with lawful
                            investigations.
                        </p>
                    </section>

                    <section>
                        <h3>Reports to authorities</h3>

                        <p>
                            When TalSky obtains actual knowledge of apparent
                            CSAM, we take appropriate action in accordance with
                            applicable law. This may include removing or
                            disabling access to the material, preserving
                            relevant evidence, and reporting confirmed cases
                            to the National Center for Missing & Exploited
                            Children (NCMEC) or the appropriate regional or
                            national authority.
                        </p>
                    </section>

                    <section>
                        <h3>Compliance</h3>

                        <p>
                            TalSky works to comply with applicable child safety
                            laws and maintains processes for receiving,
                            reviewing, escalating, and responding to child
                            safety reports.
                        </p>
                    </section>

                    <section>
                        <h3>Child safety contact</h3>

                        <p>
                            Google Play, law enforcement authorities, and users
                            may contact TalSky about child safety matters at{" "}
                            <a href="mailto:support@talsky.app">
                                support@talsky.app
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h3>Related policies</h3>

                        <p>
                            Review our <Link to="/terms">Terms of Service</Link>
                            {" "}and{" "}
                            <Link to="/privacy">Privacy Policy</Link>.
                        </p>
                    </section>
                </article>
            </div>

            <PublicFooter />
        </main>
    );
}