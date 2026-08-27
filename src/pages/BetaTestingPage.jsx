import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Mail,
    MapPin,
    MessageCircle,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Users,
} from "lucide-react";
import {
    FaApple,
    FaGoogle,
    FaGooglePlay,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import PublicFooter from "../components/PublicFooter";
import "../styles/BetaTestingPage.css";

const BETA_LINKS = {
    googleGroup:
        "https://groups.google.com/g/talsky-closed-testers",

    googlePlay: "https://play.google.com/apps/testing/com.talsky.app",

    testFlight: "https://testflight.apple.com/join/BRm4Jmdm",
};

const androidReady = Boolean(BETA_LINKS.googlePlay);
const iosReady = Boolean(BETA_LINKS.testFlight);

export default function BetaTestingPage() {
    return (
        <main className="beta-page">
            <header className="beta-header">
                <Link to="/" className="beta-brand">
                    <img src="/TalSky.jpeg" alt="TalSky" />
                    <span>TalSky</span>
                </Link>

                <div className="beta-header-actions">
                    <span className="beta-live-badge">
                        <span className="beta-live-dot" />
                        Beta testing
                    </span>

                    <Link to="/" className="beta-back-link">
                        Back to home
                    </Link>
                </div>
            </header>

            <section className="beta-hero">
                <div className="beta-glow beta-glow-one" />
                <div className="beta-glow beta-glow-two" />

                <div className="beta-hero-copy">
                    <div className="beta-eyebrow">
                        <Sparkles size={16} />
                        <span>HELP SHAPE TALSKY</span>
                    </div>

                    <h1>
                        Join the TalSky
                        <span> beta community</span>
                    </h1>

                    <p className="beta-hero-description">
                        Be among the first people to discover language
                        partners, test real conversations, and help us build a
                        better TalSky experience before the official launch.
                    </p>

                    <div className="beta-hero-actions">
                        <a
                            href="#join-beta"
                            className="beta-primary-button"
                        >
                            Join the beta
                            <ArrowRight size={18} />
                        </a>

                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=support@talsky.app&su=TalSky%20Beta%20Question"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="beta-secondary-button"
                        >
                            <Mail size={18} />
                            Ask a question
                        </a>
                    </div>

                    <div className="beta-trust-row">
                        <span>
                            <ShieldCheck size={17} />
                            Safe testing
                        </span>

                        <span>
                            <MessageCircle size={17} />
                            Direct feedback
                        </span>

                        <span>
                            <Users size={17} />
                            Early community
                        </span>
                    </div>
                </div>

                <div className="beta-preview-wrap">
                    <div className="beta-floating-card beta-floating-top">
                        <Users size={17} />
                        <div>
                            <strong>Discover</strong>
                            <span>Language partners</span>
                        </div>
                    </div>

                    <div className="beta-phone">
                        <div className="beta-phone-screen">
                            <div className="beta-phone-status">
                                <span>9:41</span>
                                <span>● ●● ◒</span>
                            </div>

                            <div className="beta-phone-title">
                                <div>
                                    <small>DISCOVER</small>
                                    <h2>Find people to connect with</h2>
                                </div>

                                <div className="beta-phone-alert">1</div>
                            </div>

                            <div className="beta-phone-tabs">
                                <span className="active">All</span>
                                <span>Nearby</span>
                                <span>Filters</span>
                            </div>

                            <DemoUser
                                initials="A"
                                name="Annie"
                                location="New York, United States"
                                bio="I like cats and language exchange."
                                colors={["#d8b4fe", "#7c3aed"]}
                            />

                            <DemoUser
                                initials="H"
                                name="Joe"
                                location="New York, United States"
                                bio="I want to improve my conversation skills."
                                colors={["#bfdbfe", "#2563eb"]}
                                isNew
                            />

                            <div className="beta-phone-nav">
                                <span className="active">◈</span>
                                <span>◯</span>
                                <span>⌖</span>
                                <span>♙</span>
                            </div>
                        </div>
                    </div>

                    <div className="beta-floating-card beta-floating-bottom">
                        <MessageCircle size={17} />
                        <div>
                            <strong>Connect</strong>
                            <span>Practice together</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="beta-stats">
                <article>
                    <strong>Early access</strong>
                    <span>Try TalSky before launch</span>
                </article>

                <article>
                    <strong>Real impact</strong>
                    <span>Your feedback shapes the app</span>
                </article>

                <article>
                    <strong>Free to join</strong>
                    <span>No payment is required</span>
                </article>
            </section>

            <section id="join-beta" className="beta-join-section">
                <div className="beta-section-heading">
                    <span>CHOOSE YOUR PLATFORM</span>
                    <h2>Start testing TalSky</h2>
                    <p>
                        Follow the steps for your device. Beta versions may
                        contain small bugs while we prepare the official
                        release.
                    </p>
                </div>

                <div className="beta-platform-grid">
                    <article className="beta-platform-card android">
                        <div className="beta-platform-top">
                            <div className="beta-platform-icon android">
                                <FaGooglePlay size={29} />
                            </div>

                            <div>
                                <span className="beta-platform-label">
                                    ANDROID
                                </span>
                                <h3>Google Play closed beta</h3>
                            </div>

                            <span className="beta-platform-status">
                                Recruiting
                            </span>
                        </div>

                        <p className="beta-platform-description">
                            Help us complete the TalSky closed test and prepare
                            the Android version for its public launch.
                        </p>

                        <ol className="beta-steps">
                            <BetaStep number="1">
                                Join the TalSky Google Group.
                            </BetaStep>

                            <BetaStep number="2">
                                Open the private Google Play testing link.
                            </BetaStep>

                            <BetaStep number="3">
                                Accept the test and install TalSky.
                            </BetaStep>

                            <BetaStep number="4">
                                Stay enrolled for 14 consecutive days and test
                                the app regularly.
                            </BetaStep>
                        </ol>

                        <div className="beta-platform-actions">
                            <a
                                href={BETA_LINKS.googleGroup}
                                target="_blank"
                                rel="noreferrer"
                                className="beta-platform-primary beta-google-group-button"
                            >
                                <FaGoogle size={17} />
                                Join Google Group
                                <ExternalLink size={15} />
                            </a>

                            {androidReady ? (
                                <a
                                    href={BETA_LINKS.googlePlay}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="beta-platform-secondary"
                                >
                                    <FaGooglePlay size={18} />
                                    Open Google Play
                                    <ExternalLink size={15} />
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    className="beta-platform-secondary disabled"
                                    disabled
                                >
                                    Google Play link coming soon
                                </button>
                            )}
                        </div>

                        <div className="beta-platform-note">
                            <Clock3 size={17} />
                            <span>
                                Testers must remain enrolled continuously for
                                at least 14 days.
                            </span>
                        </div>
                    </article>

                    <article className="beta-platform-card ios">
                        <div className="beta-platform-top">
                            <div className="beta-platform-icon ios">
                                <FaApple size={31} />
                            </div>

                            <div>
                                <span className="beta-platform-label">
                                    IPHONE
                                </span>
                                <h3>Apple TestFlight beta</h3>
                            </div>

                            <span
                                className={`beta-platform-status ${iosReady ? "" : "soon"
                                    }`}
                            >
                                {iosReady ? "Open" : "Coming soon"}
                            </span>
                        </div>

                        <p className="beta-platform-description">
                            Preview TalSky on iPhone and share feedback directly
                            through TestFlight or by email.
                        </p>

                        <ol className="beta-steps">
                            <BetaStep number="1">
                                Install TestFlight from the App Store.
                            </BetaStep>

                            <BetaStep number="2">
                                Open the TalSky public invitation.
                            </BetaStep>

                            <BetaStep number="3">
                                Accept the invitation and install TalSky.
                            </BetaStep>

                            <BetaStep number="4">
                                Explore the app and send us your feedback.
                            </BetaStep>
                        </ol>

                        <div className="beta-platform-actions">
                            {iosReady ? (
                                <a
                                    href={BETA_LINKS.testFlight}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="beta-platform-primary beta-apple-button"
                                >
                                    <FaApple size={21} />
                                    Join with TestFlight
                                    <ExternalLink size={15} />
                                </a>
                            ) : (
                                <a
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@talsky.app&su=TalSky%20iOS%20Beta%20Access&body=Hello%20TalSky%20Support%2C%0A%0AI%20would%20like%20to%20join%20the%20iOS%20beta."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="beta-platform-primary beta-apple-button"
                                >
                                    <FaApple size={21} />
                                    Request iOS beta access
                                    <Mail size={16} />
                                </a>
                            )}

                            <a
                                href="https://apps.apple.com/app/testflight/id899247664"
                                target="_blank"
                                rel="noreferrer"
                                className="beta-platform-secondary"
                            >
                                <FaApple size={19} />
                                Get TestFlight
                                <ExternalLink size={15} />
                            </a>
                        </div>

                        <div className="beta-platform-note">
                            <ShieldCheck size={17} />
                            <span>
                                Test versions are distributed securely through
                                Apple TestFlight.
                            </span>
                        </div>
                    </article>
                </div>
            </section>

            <section className="beta-test-section">
                <div className="beta-test-card">
                    <div className="beta-section-heading left">
                        <span>YOUR BETA MISSION</span>
                        <h2>What should you test?</h2>
                        <p>
                            Use TalSky naturally and tell us what feels great,
                            confusing, slow, or incomplete.
                        </p>
                    </div>

                    <div className="beta-feature-grid">
                        <BetaFeature
                            icon={<Users size={21} />}
                            title="Discover people"
                            text="Explore the Feed and open language partner profiles."
                        />

                        <BetaFeature
                            icon={<MapPin size={21} />}
                            title="Try Nearby"
                            text="Test location access and nearby language partners."
                        />

                        <BetaFeature
                            icon={<SlidersHorizontal size={21} />}
                            title="Use filters"
                            text="Search by languages, location, age, and preferences."
                        />

                        <BetaFeature
                            icon={<MessageCircle size={21} />}
                            title="Start conversations"
                            text="Send messages and test the chat experience."
                        />
                    </div>
                </div>
            </section>

            <section className="beta-feedback">
                <div>
                    <span className="beta-feedback-icon">
                        <Sparkles size={23} />
                    </span>

                    <div>
                        <h2>Your feedback matters</h2>
                        <p>
                            Found a bug or have an idea? Tell us what happened,
                            which device you used, and how we can improve.
                        </p>
                    </div>
                </div>

                <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=support@talsky.app&su=TalSky%20Beta%20Feedback"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="beta-primary-button"
                >
                    Send feedback
                    <Mail size={18} />
                </a>
            </section>

            <PublicFooter />
        </main>
    );
}

function DemoUser({
    initials,
    name,
    location,
    bio,
    colors,
    isNew = false,
}) {
    return (
        <article className="beta-demo-user">
            <div
                className="beta-demo-avatar"
                style={{
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                }}
            >
                {initials}
            </div>

            <div className="beta-demo-content">
                <div className="beta-demo-name">
                    <strong>{name}</strong>
                    {isNew ? <span>NEW</span> : null}
                </div>

                <small>{location}</small>
                <p>{bio}</p>

                <div className="beta-demo-tags">
                    <span>🌎 Native</span>
                    <span>🇺🇸 Learning</span>
                </div>
            </div>
        </article>
    );
}

function BetaStep({ number, children }) {
    return (
        <li>
            <span>{number}</span>
            <p>{children}</p>
        </li>
    );
}

function BetaFeature({ icon, title, text }) {
    return (
        <article className="beta-feature">
            <span>{icon}</span>
            <div>
                <h3>{title}</h3>
                <p>{text}</p>
            </div>
        </article>
    );
}