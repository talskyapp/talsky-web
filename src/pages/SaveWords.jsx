import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, Navigate } from "react-router-dom";
import "../styles/WordCollections.css";

export default function SavedWords() {
    const navigate = useNavigate();
    const { user } = useOutletContext();
    const [search, setSearch] = useState("");

    const savedWords = useMemo(() => {
        return [
            {
                id: "1",
                word: "Hello",
                translation: "Hola",
                pronunciation: "/həˈloʊ/",
                type: "Greeting",
                level: "A1",
                example: "Hello, my name is Anna.",
                note: "Common greeting used in many situations.",
            },
            {
                id: "2",
                word: "Good morning",
                translation: "Buenos días",
                pronunciation: "/ɡʊd ˈmɔːrnɪŋ/",
                type: "Greeting",
                level: "A1",
                example: "Good morning, teacher.",
                note: "Used early in the day.",
            },
            {
                id: "3",
                word: "Introduce",
                translation: "Presentar",
                pronunciation: "/ˌɪntrəˈduːs/",
                type: "Verb",
                level: "A1",
                example: "Let me introduce myself.",
                note: "Useful in first conversations.",
            },
            {
                id: "4",
                word: "Name",
                translation: "Nombre",
                pronunciation: "/neɪm/",
                type: "Noun",
                level: "A1",
                example: "My name is Daniel.",
                note: "One of the first words to learn.",
            },
        ];
    }, []);

    const filteredWords = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return savedWords;

        return savedWords.filter((item) =>
            [
                item.word,
                item.translation,
                item.type,
                item.level,
                item.example,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [savedWords, search]);

    if (!user?.courseActivated) {
        return <Navigate to="/dashboard/learn" replace />;
    }

    return (
        <div className="words-page">
            <div className="words-shell">
                <div className="words-hero">
                    <div>
                        <p className="words-kicker">Course Hub</p>
                        <h1>Saved Words</h1>
                        <p className="words-subtitle">
                            Words you saved during lessons. Later this will load from your database.
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
                        placeholder="Search saved words..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="words-count-pill">
                        {filteredWords.length} word{filteredWords.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="words-grid">
                    {filteredWords.map((item) => (
                        <article key={item.id} className="word-card">
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
                                <strong>Note</strong>
                                <p>{item.note}</p>
                            </div>

                            <div className="word-card-actions">
                                <button type="button" className="word-secondary-btn">
                                    Practice
                                </button>
                                <button type="button" className="word-primary-btn">
                                    Review
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}