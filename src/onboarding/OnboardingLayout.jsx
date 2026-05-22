import "../styles/OnboardingLayout.css";

const OnboardingLayout = ({ children }) => {
    return (
        <div className="onboarding-shell">
            <div className="onboarding-backdrop" />

            <div className="onboarding-frame">
                <header className="onboarding-header">
                    <div className="onboarding-brand">
                        <img
                            src="/TalSky.png"
                            alt="TalSky"
                            className="onboarding-logo-image"
                        />

                        <div className="onboarding-brand-text">
                            <h2>TalSky</h2>
                            <p>Learn, practice, and connect</p>
                        </div>
                    </div>
                </header>

                <main className="onboarding-main">
                    <div className="onboarding-content-card">
                        {children}
                    </div>
                </main>

                <footer className="onboarding-footer">
                    <span>© 2026 TalSky</span>
                </footer>
            </div>
        </div>
    );
};

export default OnboardingLayout;