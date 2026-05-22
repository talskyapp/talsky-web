import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, Navigate } from "react-router-dom";
import "../styles/WordCollections.css";

export default function DifficultWords() {
    const navigate = useNavigate();
    const { user } = useOutletContext();
    const [search, setSearch] = useState("");

    const difficultWords = useMemo(() => {
        return [
            {
                id: "dw1",
                word: "Goodbye",
                translation: "Adiós",
                pronunciation: "/ɡʊdˈbaɪ/",
                type: "Greeting",
                level: "A1",
                example: "Goodbye, see you tomorrow.",
                source: "Module 1 Final Test",
                wrongCount: 3,
            },
            {
                id: "dw2",
                word: "Good morning",
                translation: "Buenos días",
                pronunciation: "/ɡʊd ˈmɔːrnɪŋ/",
                type: "Greeting",
                level: "A1",
                example: "Good morning, everyone.",
                source: "Lesson: Hello & Goodbye",
                wrongCount: 2,
            },
            {
                id: "dw3",
                word: "Introduce yourself",
                translation: "Preséntate",
                pronunciation: "/ˌɪntrəˈduːs jɔːrˈself/",
                type: "Expression",
                level: "A1",
                example: "Please introduce yourself to the class.",
                source: "Lesson: Introducing Yourself",
                wrongCount: 4,
            },
            {
                id: "dw4",
                word: "Name",
                translation: "Nombre",
                pronunciation: "/neɪm/",
                type: "Noun",
                level: "A1",
                example: "What is your name?",
                source: "Module 1 Final Test",
                wrongCount: 2,
            },
        ];
    }, []);

    const filteredWords = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return difficultWords;

        return difficultWords.filter((item) =>
            [
                item.word,
                item.translation,
                item.type,
                item.level,
                item.example,
                item.source,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [difficultWords, search]);

    if (!user?.courseActivated) {
        return <Navigate to="/dashboard/learn" replace />;
    }

    return (
        <div className="words-page">
            <div className="words-shell">
                <div className="words-hero">
                    <div>
                        <p className="words-kicker">Course Hub</p>
                        <h1>Difficult Words</h1>
                        <p className="words-subtitle">
                            Words and expressions you missed in lessons or tests.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="words-back-btn"
                        onClick={() => navigate("/dashboard/course-hub")}
                    >
                        Back to hub
                    </button>
                </div>

                <div className="words-toolbar">
                    <input
                        className="words-search"
                        type="text"
                        placeholder="Search difficult words..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="words-count-pill">
                        {filteredWords.length} item{filteredWords.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="words-grid">
                    {filteredWords.map((item) => (
                        <article key={item.id} className="word-card difficult">
                            <div className="word-card-top">
                                <div>
                                    <h3>{item.word}</h3>
                                    <p className="word-translation">{item.translation}</p>
                                </div>

                                <span className="word-level-pill">{item.level}</span>
                            </div>

                            <div className="word-meta-row">
                                <span className="word-type-pill">{item.type}</span>
                                <span className="word-pronunciation">{item.pronunciation}</span>
                            </div>

                            <div className="word-example-box">
                                <strong>Example</strong>
                                <p>{item.example}</p>
                            </div>

                            <div className="word-note-box">
                                <strong>Source</strong>
                                <p>{item.source}</p>
                            </div>

                            <div className="word-error-row">
                                <span className="word-error-pill">
                                    Missed {item.wrongCount} time{item.wrongCount !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="word-card-actions">
                                <button type="button" className="word-secondary-btn">
                                    Practice again
                                </button>
                                <button type="button" className="word-primary-btn">
                                    Review now
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}