import "../styles/Community.css";

export default function Community() {
    return (
        <div className="community-page">
            <div className="community-container">

                {/* HERO */}
                <section className="community-hero">
                    <h1>Community</h1>
                    <p>
                        Soon you'll be able to share your day, post photos, short videos,
                        and connect with others while learning.
                    </p>
                </section>

                {/* PREVIEW CARDS */}
                <section className="community-preview">

                    <div className="preview-card">
                        <div className="preview-header">
                            <img src="https://i.pravatar.cc/40?img=3" />
                            <div>
                                <strong>Alisson</strong>
                                <span>@alisson</span>
                            </div>
                        </div>

                        <p className="preview-text">
                            Studied 20 minutes of Korean today 🇰🇷🔥
                        </p>

                        <img
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                            className="preview-image"
                        />

                        <div className="preview-actions">
                            ❤️ 120 &nbsp;&nbsp; 💬 18 &nbsp;&nbsp; 🔖
                        </div>
                    </div>

                    <div className="preview-card">
                        <div className="preview-header">
                            <img src="https://i.pravatar.cc/40?img=5" />
                            <div>
                                <strong>Sofia</strong>
                                <span>@sofia</span>
                            </div>
                        </div>

                        <p className="preview-text">
                            Today goal: learn 10 new words and practice speaking 💬
                        </p>

                        <div className="preview-text-card">
                            Keep going. Small steps every day = big results.
                        </div>

                        <div className="preview-actions">
                            ❤️ 64 &nbsp;&nbsp; 💬 9 &nbsp;&nbsp; 🔖
                        </div>
                    </div>

                </section>

                {/* COMING SOON */}
                <section className="community-coming">
                    <h2>🚀 Coming Soon</h2>
                    <p>
                        A new way to stay motivated and share your progress with others.
                    </p>

                    <ul>
                        <li>📷 Share photos</li>
                        <li>🎬 Post short videos</li>
                        <li>✍️ Write quick updates</li>
                        <li>🔥 Track your daily progress</li>
                    </ul>
                </section>

            </div>
        </div>
    );
}