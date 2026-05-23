import { Link, useOutletContext } from "react-router-dom";
import {
    Sparkles,
    BookOpen,
    Layers3,
    Brain,
    Smartphone,
    ArrowRight,
    MessageCircle,
    Globe2,
} from "lucide-react";
import "../styles/DashboardHome.css";

export default function DashboardHome() {
    const { user } = useOutletContext();

    const name = user?.name?.split(" ")?.[0] || "there";
    const learning = user?.languageToLearn?.[0] || "your target language";

    const steps = [
        {
            number: "01",
            icon: <MessageCircle size={22} />,
            title: "Practice naturally",
            text: "Start conversations with AI and practice real phrases for daily situations.",
        },
        {
            number: "02",
            icon: <Layers3 size={22} />,
            title: "Save useful words",
            text: "Keep important vocabulary and expressions from your learning sessions.",
        },
        {
            number: "03",
            icon: <Brain size={22} />,
            title: "Review with focus",
            text: "Come back to your saved cards and strengthen what you already learned.",
        },
    ];

    return (
        <div className="dash-home">
            <section className="dash-hero-pro">
                <div className="dash-hero-copy">
                    <span className="dash-home-pill">
                        <Sparkles size={15} />
                        AI Language Workspace
                    </span>

                    <h1>Welcome back, {name}.</h1>

                    <p>
                        Continue improving {learning} with guided AI practice,
                        saved vocabulary, and focused review tools.
                    </p>

                    <div className="dash-home-actions">
                        <Link to="/dashboard/ai-tutor" className="dash-home-primary">
                            Start AI Tutor
                            <ArrowRight size={18} />
                        </Link>

                        <Link to="/dashboard/cards/review" className="dash-home-secondary">
                            Review cards
                        </Link>
                    </div>
                </div>

                <div className="dash-hero-preview">
                    <div className="dash-preview-glow" />

                    <div className="dash-preview-card top">
                        <span>Today’s focus</span>
                        <strong>Practice useful conversations</strong>
                    </div>

                    <div className="dash-preview-card middle">
                        <div className="dash-ai-icon">
                            <Sparkles size={24} />
                        </div>
                        <h3>AI Tutor</h3>
                        <p>Ask, practice, translate, and improve naturally.</p>
                    </div>

                    <div className="dash-preview-card bottom">
                        <span>Saved words</span>
                        <strong>12 ready for review</strong>
                    </div>
                </div>
            </section>

            <section className="dash-flow-section">
                <div className="dash-section-head">
                    <span>How it works</span>
                    <h2>Learn in a simple flow.</h2>
                    <p>
                        TalSky helps you move from practice to review without feeling
                        overwhelmed.
                    </p>
                </div>

                <div className="dash-flow-grid">
                    {steps.map((step, index) => (
                        <div className="dash-flow-card" key={step.title}>
                            <div className="dash-flow-top">
                                <span>{step.number}</span>
                                <div className="dash-flow-icon">{step.icon}</div>
                            </div>

                            <h3>{step.title}</h3>
                            <p>{step.text}</p>

                            {index < steps.length - 1 && (
                                <div className="dash-flow-arrow">
                                    <ArrowRight size={18} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="dash-home-grid pro">
                <Link to="/dashboard/ai-tutor" className="dash-home-card main">
                    <div className="dash-card-icon">
                        <Sparkles size={24} />
                    </div>
                    <span>AI PRACTICE</span>
                    <h3>AI Tutor</h3>
                    <p>Practice conversations, grammar, vocabulary, and explanations.</p>
                </Link>

                <Link to="/dashboard/cards" className="dash-home-card">
                    <div className="dash-card-icon">
                        <BookOpen size={24} />
                    </div>
                    <span>VOCABULARY</span>
                    <h3>Saved vocabulary</h3>
                    <p>Keep track of useful words and phrases from your practice.</p>
                </Link>

                <Link to="/dashboard/cards/review" className="dash-home-card">
                    <div className="dash-card-icon">
                        <Brain size={24} />
                    </div>
                    <span>REVIEW</span>
                    <h3>Review cards</h3>
                    <p>Review saved words with a clean and focused study flow.</p>
                </Link>

                <div className="dash-home-card disabled">
                    <div className="dash-card-icon">
                        <Globe2 size={24} />
                    </div>
                    <span>COMING SOON</span>
                    <h3>Mobile community</h3>
                    <p>Meet language partners worldwide when the mobile app launches.</p>
                </div>
            </section>

            <section className="dash-home-mobile">
                <div className="dash-mobile-copy">
                    <span>TalSky Mobile</span>
                    <h2>Continue the full social experience on mobile.</h2>
                    <p>
                        Meet people around the world, chat naturally, discover cultures,
                        and practice languages through real connections on iOS and Android.
                    </p>
                </div>

                <div className="dash-store-buttons">
                    <a href="#" className="dash-store-btn">
                        <span className="dash-store-icon"></span>
                        <div>
                            <small>Download on the</small>
                            <strong>App Store</strong>
                        </div>
                    </a>

                    <a href="#" className="dash-store-btn">
                        <span className="dash-store-icon">▶</span>
                        <div>
                            <small>Get it on</small>
                            <strong>Google Play</strong>
                        </div>
                    </a>
                </div>
            </section>
        </div>
    );
}