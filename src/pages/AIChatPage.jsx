import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Bot,
    Send,
    Sparkles,
    Mic,
    BookOpen,
    CheckCircle2,
    MessagesSquare,
    Drama,
    Languages,
    Volume2,
    Wand2,
    Bookmark,
    Check,
} from "lucide-react";
import { API_URL } from "../lib/config";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/AIChatPage.css";

function getQueryParams(search) {
    const params = new URLSearchParams(search);
    return {
        mode: params.get("mode") || "free-chat",
        scenario: params.get("scenario") || "",
        topic: params.get("topic") || "",
        level: params.get("level") || "",
        language: params.get("language") || "",
    };
}

function getSystemPromptByMode({ mode, scenario, topic, level, language, nativeLanguage }) {
    const targetLanguage = language || "the user's target language";
    const nativeLang = nativeLanguage || "English";

    const baseRules = `
- Always respond primarily in ${targetLanguage}.

- If the user needs help or does not understand, explain ONLY in:
  1. ${nativeLang}
  2. English (only if explicitly requested)

- Never switch to any third language, even if the user writes in another language.

- Ignore requests to explain in other languages.

- Keep explanations simple and beginner-friendly when needed.
`.trim();

    if (mode === "corrections") {
        return `
You are an AI language tutor in Correction Mode.

${baseRules}

Always:
- correct the user's sentence
- show a natural version
- explain mistakes clearly
- keep responses concise and friendly
- prefer ${targetLanguage} examples when useful
        `.trim();
    }

    if (mode === "roleplay") {
        return `
You are an AI language tutor in Roleplay Mode.

${baseRules}

Create an immersive scenario${scenario ? ` about ${scenario}` : ""}.

Always:
- stay in the scenario
- adapt to the user's level${level ? ` (${level})` : ""}
- mostly use ${targetLanguage}
- gently help if the user gets stuck
- keep the conversation natural
        `.trim();
    }

    if (mode === "vocab") {
        return `
You are an AI language tutor in Vocabulary Builder Mode.

${baseRules}

Generate useful words and phrases${topic ? ` about ${topic}` : ""}.

Always:
- group vocabulary clearly
- include meaning or translation when helpful
- include 1-2 short examples
- keep it practical for real conversation
- adapt to ${targetLanguage}
        `.trim();
    }

    return `
You are an AI language tutor in Free Chat Mode.

${baseRules}

Always:
- have a natural conversation in ${targetLanguage}
- adapt to the user's level${level ? ` (${level})` : ""}
- gently correct only when helpful
- keep the conversation engaging and practical
    `.trim();
}

function getWelcomeMessage({ mode, scenario, topic, language }) {
    const targetLanguage = language || "your target language";

    if (mode === "corrections") {
        return `Hi! Send me any sentence and I’ll correct it, explain the mistakes simply, and show you a more natural version in ${targetLanguage}.`;
    }

    if (mode === "roleplay") {
        if (scenario) {
            return `Great — let’s do a ${scenario} roleplay. I’ll act like a real person in that situation. Start whenever you’re ready.`;
        }
        return `Welcome to Roleplay mode. What situation do you want to practice today? Travel, restaurant, dating, work, or something custom?`;
    }

    if (mode === "vocab") {
        if (topic) {
            return `Perfect. I can generate useful ${topic} vocabulary with examples and mini practice. Tell me your level or say "start".`;
        }
        return `Welcome to Vocabulary Builder. Tell me a topic like travel, dating, work, shopping, or daily life, and I’ll generate useful words and phrases.`;
    }

    return `Hey! Let’s chat naturally in ${targetLanguage}. You can ask questions, practice conversation, or just talk about your day.`;
}

function buildStarterUserMessage({ mode, scenario, topic }) {
    if (mode === "roleplay" && scenario) {
        return `I want to practice a ${scenario} roleplay.`;
    }

    if (mode === "vocab" && topic) {
        return `Give me useful ${topic} vocabulary.`;
    }

    return "";
}

function createMessage({ role, content, extra = {} }) {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        role,
        content,
        createdAt: new Date().toISOString(),
        ...extra,
    };
}

function generateLocalAssistantReply({ mode, userText, scenario, topic }) {
    const text = userText.trim();

    if (!text) {
        return "Send me a message whenever you're ready.";
    }

    if (mode === "corrections") {
        return `Correction mode:\n\nOriginal: ${text}\n\nNatural version: ${text}\n\nSimple explanation: I’ll refine this better once your backend AI endpoint is connected.`;
    }

    if (mode === "roleplay") {
        const activeScenario = scenario || "real-life";
        return `Roleplay mode (${activeScenario}): nice, let’s continue. I understood: "${text}". Once your backend is connected, I’ll stay fully in character here.`;
    }

    if (mode === "vocab") {
        const activeTopic = topic || "this topic";
        return `Vocabulary Builder:\n\nHere are a few beginner examples for ${activeTopic}:\n- word 1\n- word 2\n- phrase 1\n\nYou said: "${text}"\n\nOnce AI is connected, I’ll generate real vocabulary sets, examples, and cards.`;
    }

    return `Free Chat: I got your message — "${text}". Once your AI backend is connected, I’ll answer naturally here in conversation mode.`;
}

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

export default function AIChatPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef(null);
    const { t } = useTranslation();

    const { mode, scenario, topic, level, language } = useMemo(
        () => getQueryParams(location.search),
        [location.search]
    );

    const nativeLanguage =
        localStorage.getItem("nativeLanguage") || "English";

    const baseModeMeta = useMemo(
        () => ({
            "free-chat": {
                title: t("aiTutor.modes.freeChat.title"),
                icon: <MessagesSquare size={18} />,
                badge: t("aiChat.badges.live"),
                description: t("aiTutor.modes.freeChat.subtitle"),
                placeholder: t("aiChat.placeholders.freeChat"),
                quickPrompts: t("aiChat.prompts.freeChat"),
            },
            corrections: {
                title: t("aiTutor.modes.corrections.title"),
                icon: <CheckCircle2 size={18} />,
                badge: t("aiChat.badges.fixExplain"),
                description: t("aiTutor.modes.corrections.subtitle"),
                placeholder: t("aiChat.placeholders.corrections"),
                quickPrompts: t("aiChat.prompts.corrections"),
            },
            roleplay: {
                title: t("aiTutor.modes.roleplay.title"),
                icon: <Drama size={18} />,
                badge: t("aiChat.badges.scenario"),
                description: t("aiTutor.modes.roleplay.subtitle"),
                placeholder: t("aiChat.placeholders.roleplay"),
                quickPrompts: t("aiChat.prompts.roleplay"),
            },
            vocab: {
                title: t("aiTutor.modes.vocab.title"),
                icon: <BookOpen size={18} />,
                badge: t("aiChat.badges.words"),
                description: t("aiTutor.modes.vocab.subtitle"),
                placeholder: t("aiChat.placeholders.vocab"),
                quickPrompts: t("aiChat.prompts.vocab"),
            },
        }),
        [t]
    );

    const targetLanguage = language || "your target language";
    const modeData = baseModeMeta[mode] || baseModeMeta["free-chat"];

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [savedWords, setSavedWords] = useState([]);
    const [savingWords, setSavingWords] = useState([]);

    const systemPrompt = useMemo(
        () =>
            getSystemPromptByMode({
                mode,
                scenario,
                topic,
                level,
                language,
                nativeLanguage,
            }),
        [mode, scenario, topic, level, language, nativeLanguage]
    );

    useEffect(() => {
        const welcome = getWelcomeMessage({ mode, scenario, topic, language });
        const starterUserText = buildStarterUserMessage({ mode, scenario, topic });

        const initialMessages = [createMessage({ role: "assistant", content: welcome })];

        if (starterUserText) {
            initialMessages.push(
                createMessage({ role: "user", content: starterUserText })
            );
        }

        setMessages(initialMessages);
        setSessionReady(true);
        setSavedWords([]);
        setSavingWords([]);
    }, [mode, scenario, topic, language]);

    useEffect(() => {
        if (!sessionReady) return;

        const starterUserText = buildStarterUserMessage({ mode, scenario, topic });
        if (!starterUserText) return;

        const reply = generateLocalAssistantReply({
            mode,
            userText: starterUserText,
            scenario,
            topic,
        });

        setMessages((prev) => {
            const alreadyHasAutoReply = prev.some((msg) => msg.autoStarterReply);
            if (alreadyHasAutoReply) return prev;

            return [
                ...prev,
                createMessage({
                    role: "assistant",
                    content: reply,
                    extra: { autoStarterReply: true },
                }),
            ];
        });
    }, [sessionReady, mode, scenario, topic]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessageToBackend = async (userText, nextMessages) => {
        try {
            const token = getAuthToken();

            const response = await fetch(`${API_URL}/api/ai-tutor/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({
                    mode,
                    scenario,
                    topic,
                    level,
                    language,
                    message: userText,
                    systemPrompt,
                    messages: nextMessages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                throw new Error(
                    errorData?.msg ||
                    errorData?.error ||
                    "Failed to get AI response"
                );
            }

            const data = await response.json();

            return {
                reply:
                    data?.reply ||
                    "I received your message, but no reply came back from the server.",
                candidateVocabulary: data?.candidateVocabulary || [],
            };
        } catch (error) {
            console.error("AI tutor request failed:", error);

            return {
                reply: generateLocalAssistantReply({
                    mode,
                    userText,
                    scenario,
                    topic,
                }),
                candidateVocabulary: [],
            };
        }
    };

    const handleSend = async (forcedText) => {
        const textToSend = typeof forcedText === "string" ? forcedText : input;
        const cleanText = textToSend.trim();

        if (!cleanText || loading) return;

        const userMessage = createMessage({
            role: "user",
            content: cleanText,
        });

        const nextMessages = [...messages, userMessage];

        setMessages(nextMessages);
        setInput("");
        setLoading(true);

        const result = await sendMessageToBackend(cleanText, nextMessages);

        setMessages((prev) => [
            ...prev,
            createMessage({
                role: "assistant",
                content: result.reply,
                extra: {
                    candidateVocabulary: result.candidateVocabulary || [],
                },
            }),
        ]);

        setLoading(false);
    };

    const handleQuickPrompt = (prompt) => {
        if (mode === "roleplay") {
            navigate(
                `/dashboard/ai-chat?mode=roleplay&scenario=${encodeURIComponent(
                    prompt.replace(" roleplay", "").toLowerCase()
                )}`
            );
            return;
        }

        if (mode === "vocab") {
            navigate(
                `/dashboard/ai-chat?mode=vocab&topic=${encodeURIComponent(
                    prompt.toLowerCase()
                )}`
            );
            return;
        }

        setInput(prompt);
    };

    const handleSaveCandidate = async (candidate) => {
        const phrase = candidate?.text?.trim();

        if (!phrase) return;
        if (savedWords.includes(phrase) || savingWords.includes(phrase)) return;

        try {
            setSavingWords((prev) => [...prev, phrase]);

            const token = getAuthToken();

            const res = await fetch(`${API_URL}/api/vocabulary/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({
                    text: phrase,
                    reading: candidate?.reading || "",
                    translation: candidate?.translation || "",
                    pronunciation: candidate?.pronunciation || "",
                    language: candidate?.language || language || "",
                    formality: candidate?.formality || "",
                    usage: candidate?.usage || "",
                    withWhom: candidate?.withWhom || "",
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    data?.msg || data?.error || "Failed to save vocabulary"
                );
            }

            setSavedWords((prev) => [...prev, phrase]);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setSavingWords((prev) => prev.filter((item) => item !== phrase));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="ai-chat-page">
            <div className="ai-chat-shell">
                <div className="ai-chat-layout">
                    <aside className="ai-chat-sidebar">
                        <button
                            type="button"
                            className="ai-chat-back-btn"
                            onClick={() => navigate("/dashboard/ai-tutor")}
                        >
                            <ArrowLeft size={18} />
                            <span>{t("aiChat.back")}</span>
                        </button>

                        <div className="ai-chat-mode-card">
                            <div className="ai-chat-mode-top">
                                <div className="ai-chat-mode-icon">{modeData.icon}</div>
                                <div>
                                    <p className="ai-chat-kicker">{t("aiChat.currentMode")}</p>
                                    <h2>{modeData.title}</h2>
                                </div>
                            </div>

                            <div className="ai-chat-badge">
                                <Sparkles size={14} />
                                <span>{modeData.badge}</span>
                            </div>

                            <p className="ai-chat-mode-description">
                                {modeData.description}
                            </p>

                            {scenario ? (
                                <div className="ai-chat-meta-pill">
                                    <Drama size={14} />
                                    <span>{t("aiChat.scenario")}: {scenario}</span>
                                </div>
                            ) : null}

                            {topic ? (
                                <div className="ai-chat-meta-pill">
                                    <BookOpen size={14} />
                                    <span>{t("aiChat.topic")}: {topic}</span>
                                </div>
                            ) : null}

                            {language ? (
                                <div className="ai-chat-meta-pill">
                                    <Languages size={14} />
                                    <span>{t("aiChat.language")}: {language}</span>
                                </div>
                            ) : null}
                        </div>

                        <div className="ai-chat-side-card">
                            <p className="ai-chat-kicker">{t("aiChat.quickActions")}</p>
                            <div className="ai-chat-quick-list">
                                {modeData.quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        className="ai-chat-quick-btn"
                                        onClick={() => handleQuickPrompt(prompt)}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="ai-chat-side-card">
                            <p className="ai-chat-kicker">{t("aiChat.sessionTools")}</p>

                            <button
                                type="button"
                                className={`ai-chat-tool-btn ${voiceEnabled ? "active" : ""}`}
                                onClick={() => setVoiceEnabled((prev) => !prev)}
                            >
                                <Mic size={16} />
                                <span>{voiceEnabled ? t("aiChat.voiceOn") : t("aiChat.voiceOff")}</span>
                            </button>

                            <button type="button" className="ai-chat-tool-btn">
                                <Wand2 size={16} />
                                <span>{t("aiChat.createCards")}</span>
                            </button>

                            <button type="button" className="ai-chat-tool-btn">
                                <Volume2 size={16} />
                                <span>{t("aiChat.practiceLater")}</span>
                            </button>
                        </div>
                    </aside>

                    <section className="ai-chat-main">
                        <div className="ai-chat-header">
                            <div className="ai-chat-header-left">
                                <div className="ai-chat-bot-avatar">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h1>{modeData.title}</h1>
                                    <p>{modeData.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="ai-chat-messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`ai-chat-message-row ${msg.role === "user" ? "user" : "assistant"}`}
                                >
                                    <div className={`ai-chat-bubble ${msg.role}`}>
                                        <p>{msg.content}</p>

                                        {msg.role === "assistant" &&
                                            msg.candidateVocabulary?.length > 0 ? (
                                            <div className="ai-chat-suggestions">
                                                <p className="ai-chat-suggestions-title">
                                                    {t("aiChat.usefulExpressions")}
                                                </p>

                                                <div className="ai-chat-suggestions-list">
                                                    {msg.candidateVocabulary.map((item, index) => {
                                                        const phrase = item.text;
                                                        const isSaved =
                                                            savedWords.includes(phrase);
                                                        const isSaving =
                                                            savingWords.includes(phrase);

                                                        return (
                                                            <div
                                                                key={`${phrase}-${index}`}
                                                                className="ai-chat-suggestion-item"
                                                            >
                                                                <div className="ai-chat-suggestion-text">
                                                                    {phrase}
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className={`ai-chat-save-btn ${isSaved ? "saved" : ""}`}
                                                                    onClick={() =>
                                                                        handleSaveCandidate(item)
                                                                    }
                                                                    disabled={isSaved || isSaving}
                                                                >
                                                                    {isSaved ? (
                                                                        <>
                                                                            <Check size={14} />
                                                                            <span>{t("aiChat.saved")}</span>
                                                                        </>
                                                                    ) : isSaving ? (
                                                                        <span>{t("aiChat.saving")}</span>
                                                                    ) : (
                                                                        <>
                                                                            <Bookmark size={14} />
                                                                            <span>{t("aiChat.saveToCards")}</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}

                            {loading ? (
                                <div className="ai-chat-message-row assistant">
                                    <div className="ai-chat-bubble assistant typing">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            ) : null}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="ai-chat-composer">
                            <div className="ai-chat-composer-top">
                                {modeData.quickPrompts.slice(0, 3).map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        className="ai-chat-mini-chip"
                                        onClick={() => handleQuickPrompt(prompt)}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>

                            <div className="ai-chat-input-wrap">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={modeData.placeholder}
                                    className="ai-chat-textarea"
                                    rows={1}
                                />

                                <button
                                    type="button"
                                    className="ai-chat-send-btn"
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}