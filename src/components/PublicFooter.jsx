import { Link } from "react-router-dom";
import "../styles/PublicFooter.css";

export default function PublicFooter() {
    return (
        <footer className="public-footer">
            <div className="public-footer-content">
                <div className="public-footer-brand">
                    <img src="/TalSky.jpeg" alt="TalSky" />

                    <div>
                        <strong>TalSky</strong>
                        <p>Connect through language and culture.</p>
                    </div>
                </div>

                <nav
                    className="public-footer-links"
                    aria-label="Footer navigation"
                >
                    <Link to="/support">Support</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms of Service</Link>
                </nav>
            </div>

            <div className="public-footer-bottom">
                <span>
                    © {new Date().getFullYear()} TalSky. All rights reserved.
                </span>
            </div>
        </footer>
    );
}