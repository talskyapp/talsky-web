import { Link } from "react-router-dom";
import "../styles/Landing.css";

export default function Landing() {
    return (
        <main className="landing-page">
            <nav className="landing-nav">
                <div className="landing-brand">
                    <img src="/TalSky.png" alt="TalSky" />
                    <span>TalSky</span>
                </div>

                <div className="landing-nav-actions">
                    <a href="#about">About</a>
                    <a href="#download">Download</a>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="landing-hero-content">
                    <span className="landing-pill">Coming soon</span>

                    <h1>Connect with the world through language and culture.</h1>

                    <p>
                        TalSky is a social language exchange app designed to help people
                        meet, chat, learn, and discover cultures through real conversations.
                    </p>

                    <div className="landing-actions">
                        <a href="#download" className="landing-primary-btn">
                            Get the app
                        </a>
                        <Link to="/login" className="landing-secondary-btn">
                            Member login
                        </Link>
                    </div>
                </div>

                <div className="landing-phone-card">
                    <div className="landing-phone">
                        <div className="landing-phone-top" />
                        <div className="landing-chat-bubble left">Hi! I’m learning Japanese 👋</div>
                        <div className="landing-chat-bubble right">Nice! I can help you practice.</div>
                        <div className="landing-chat-bubble left">Let’s exchange cultures too 🌎</div>
                        <div className="landing-typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="about" className="landing-section">
                <h2>What is TalSky?</h2>
                <p>
                    TalSky brings language learners and culture lovers together in one
                    modern mobile experience.
                </p>

                <div className="landing-grid">
                    <div className="landing-feature-card">
                        <h3>Meet people globally</h3>
                        <p>Discover people who share your interests, language goals, and culture.</p>
                    </div>

                    <div className="landing-feature-card">
                        <h3>Practice naturally</h3>
                        <p>Improve through real conversations instead of only studying alone.</p>
                    </div>

                    <div className="landing-feature-card">
                        <h3>Learn with AI</h3>
                        <p>TutorAI is coming soon to personalize your learning journey.</p>
                    </div>
                </div>
            </section>

            <section id="download" className="landing-download">
                <span>Mobile app coming soon</span>
                <h2>TalSky will be available on iOS and Android.</h2>
                <p>
                    We’re preparing the official mobile launch. App Store and Google Play
                    links will be available here soon.
                </p>

                <div className="landing-store-buttons">
                    <button disabled>App Store</button>
                    <button disabled>Google Play</button>
                </div>
            </section>
        </main>
    );
}