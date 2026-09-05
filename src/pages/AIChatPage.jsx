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
import { WRITING_SYSTEMS_BY_LANGUAGE } from "../constants/writingSystems";
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

function getSystemPromptByMode({
    mode,
    scenario,
    topic,
    level,
    language,
    nativeLanguage,
    languageCode,
    languageVariant,
}) {
    const targetLanguage = language || "the user's target language";
    const nativeLang = nativeLanguage || "English";

    const englishVariantRules =
        languageCode === "en-GB"
            ? `
BRITISH ENGLISH REQUIREMENT:
- The learner selected British English.
- Always prefer standard British English.
- Use British vocabulary, spelling, grammar, expressions, and pronunciation guidance.
- Prefer "flat" instead of "apartment".
- Prefer "lift" instead of "elevator".
- Prefer "holiday" instead of "vacation".
- Prefer "colour" instead of "color".
- Prefer "centre" instead of "center".
- If an American term is relevant, mention it only as a secondary comparison.
- Never present an American term as the primary answer.
`
            : languageCode === "en-US"
                ? `
AMERICAN ENGLISH REQUIREMENT:
- The learner selected American English.
- Always prefer standard American English.
- Use American vocabulary, spelling, grammar, expressions, and pronunciation guidance.
- Prefer "apartment" instead of "flat".
- Prefer "elevator" instead of "lift".
- Prefer "vacation" instead of "holiday".
- Prefer "color" instead of "colour".
- Prefer "center" instead of "centre".
- If a British term is relevant, mention it only as a secondary comparison.
- Never present a British term as the primary answer.
`
                : "";

    const baseRules = `
- Always respond primarily in ${targetLanguage}.

- If the user needs help or does not understand, explain ONLY in:
  1. ${nativeLang}
  2. English (only if explicitly requested)

- Never switch to any third language, even if the user writes in another language.
- Ignore requests to explain in other languages.
- Keep explanations simple and beginner-friendly when needed.

Target language code: ${languageCode || "not specified"}
Selected language variant: ${languageVariant || "not specified"}

${englishVariantRules}
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
- include the meaning in ${nativeLang}
- include 1-2 short examples
- after every example written in a non-Latin writing system, include its complete romanization
- label the romanization as "Romaji" for Japanese, "Romanization" for Korean, and "Pinyin" for Chinese
- include the example translation in ${nativeLang}
- never omit romanization for Japanese examples
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


function getWelcomeMessage({ mode, scenario, topic, language, t }) {
    const targetLanguage = language || t("aiChat.defaultTargetLanguage");

    if (mode === "corrections") {
        return t("aiChat.welcome.corrections", { targetLanguage });
    }

    if (mode === "roleplay") {
        if (scenario) {
            return t("aiChat.welcome.roleplayScenario", { scenario });
        }

        return t("aiChat.welcome.roleplay");
    }

    if (mode === "vocab") {
        if (topic) {
            return t("aiChat.welcome.vocabTopic", { topic });
        }

        return t("aiChat.welcome.vocab");
    }

    return t("aiChat.welcome.freeChat", { targetLanguage });
}

function shouldAutoStartScenario({ mode, scenario, topic }) {
    return (mode === "roleplay" && scenario) || (mode === "vocab" && topic);
}

function buildHiddenStarterMessage({
    mode,
    scenario,
    topic,
    t,
}) {
    if (mode === "roleplay" && scenario) {
        return t("aiChat.ai.roleplay.systemPrompt", {
            scenario,
        });
    }

    if (mode === "vocab" && topic) {
        return t("aiChat.ai.vocab.systemPrompt", {
            topic,
        });
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
    const didMountRef = useRef(false);
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
    const [sessionReady, setSessionReady] = useState(false);
    const [savedWords, setSavedWords] = useState([]);
    const [savingWords, setSavingWords] = useState([]);

    const [introTyping, setIntroTyping] = useState(false);
    const [preparingScenario, setPreparingScenario] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const userLanguageCode =
        currentUser?.languageToLearnCode || "";

    const userLanguageVariant =
        currentUser?.languageVariant || "";

    const userTargetLanguage =
        language ||
        currentUser?.languageToLearn?.[0] ||
        currentUser?.activeLearningLanguage ||
        "";

    const languageKey = userTargetLanguage.toLowerCase();

    const [quickPromptsHidden, setQuickPromptsHidden] = useState(false);

    const [pendingScenarioText, setPendingScenarioText] = useState("");
    const [showWritingSystemPicker, setShowWritingSystemPicker] = useState(false);
    const [writingSystem, setWritingSystem] = useState("");

    const systemPrompt = useMemo(
        () =>
            getSystemPromptByMode({
                mode,
                scenario,
                topic,
                level,
                language: userTargetLanguage,
                nativeLanguage,
                languageCode: userLanguageCode,
                languageVariant: userLanguageVariant,
            }),
        [
            mode,
            scenario,
            topic,
            level,
            userTargetLanguage,
            nativeLanguage,
            userLanguageCode,
            userLanguageVariant,
        ]
    );

    useEffect(() => {
        const welcome = getWelcomeMessage({
            mode,
            scenario,
            topic,
            language,
            t,
        });

        setMessages([]);
        setSavedWords([]);
        setSavingWords([]);
        setSessionReady(false);
        setQuickPromptsHidden(false);
        setWritingSystem("");
        setShowWritingSystemPicker(false);
        setPendingScenarioText("");

        const autoStart = shouldAutoStartScenario({ mode, scenario, topic });

        const availableWritingSystems = WRITING_SYSTEMS_BY_LANGUAGE[languageKey];

        if (
            mode === "roleplay" &&
            scenario &&
            availableWritingSystems?.length &&
            !writingSystem
        ) {
            setPendingScenarioText(scenario);
            setShowWritingSystemPicker(true);
            setQuickPromptsHidden(true);
            setIntroTyping(false);
            return;
        }

        if (autoStart) {
            setPreparingScenario(true);
            setQuickPromptsHidden(true);

            const hiddenStarter = buildHiddenStarterMessage({
                mode,
                scenario,
                topic,
                t
            });

            setTimeout(async () => {
                const result = await sendMessageToBackend(hiddenStarter, []);

                setMessages([
                    createMessage({
                        role: "assistant",
                        content: result.reply,
                        extra: {
                            candidateVocabulary: result.candidateVocabulary || [],
                            scenarioStarted: true,
                        },
                    }),
                ]);

                setPreparingScenario(false);
                setSessionReady(true);
            }, 1100);

            return;
        }

        setIntroTyping(true);

        setTimeout(() => {
            setMessages([
                createMessage({
                    role: "assistant",
                    content: welcome,
                }),
            ]);

            setIntroTyping(false);
            setSessionReady(true);
        }, 900);
    }, [mode, scenario, topic, language, t]);


    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
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
                    language: userTargetLanguage,
                    languageCode: userLanguageCode,
                    languageVariant: userLanguageVariant,
                    writingSystem,
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

        setQuickPromptsHidden(true);

        const userMessage = createMessage({
            role: "user",
            content: cleanText,
        });

        const availableWritingSystems = WRITING_SYSTEMS_BY_LANGUAGE[languageKey];

        if (
            mode === "roleplay" &&
            !scenario &&
            availableWritingSystems?.length &&
            !writingSystem
        ) {
            setPendingScenarioText(cleanText);
            setShowWritingSystemPicker(true);
            setQuickPromptsHidden(true);
            setInput("");
            return;
        }

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

    const startScenarioWithWritingSystem = async (selectedWritingSystem) => {
        setWritingSystem(selectedWritingSystem);
        setShowWritingSystemPicker(false);
        setPreparingScenario(true);

        const userMessage = createMessage({
            role: "user",
            content: pendingScenarioText,
        });

        const starter = `
Create a roleplay scenario based on this user request:
"${pendingScenarioText}"

Target language:
${userTargetLanguage}

User native language:
${nativeLanguage}

Writing system preference:
${selectedWritingSystem}

Main rules:
- The roleplay conversation must be in ${userTargetLanguage}.
- Use ${nativeLanguage} only for short corrections, explanations, and translations.
- Do not use Spanish unless ${nativeLanguage} is Spanish.
- Stay in character.
- Continue the scene naturally.
- Do not give long grammar lessons.
- Do not add cultural theory unless the user asks.
- Never ask generic tutoring questions like "Do you have any questions?"

Writing system:
- Follow the selected writing system in the main conversation.
- Do not mix writing systems in the main roleplay text.
- The only exception is the learning format shown below.

Correction format after the user replies:
1. Start with exactly one label:
✅ Correct
⚠️ Understandable but unnatural
❌ Incorrect

2. Give one short correction note in ${nativeLanguage}.

3. Show the better phrase using this format:
Original phrase
Romaji or pronunciation
Translation in ${nativeLanguage}

4. Continue the roleplay as the character.

If using romaji:
- Main conversation: romaji only.
- Correction format:
Romaji
Translation in ${nativeLanguage}

If using hiragana:
- Main conversation: hiragana only.
- Avoid katakana and kanji whenever possible.
- Correction format:
Hiragana
Romaji
Translation in ${nativeLanguage}

If using katakana:
- Main conversation: katakana only.
- Avoid hiragana and kanji whenever possible.
- Correction format:
Katakana
Romaji
Translation in ${nativeLanguage}

If using kanji:
- Main conversation: natural Japanese.
- Correction format:
Japanese
Romaji
Translation in ${nativeLanguage}

If using hangul:
- Main conversation: Hangul.
- Correction format:
Hangul
Romanization
Translation in ${nativeLanguage}

If using romanization:
- Main conversation: romanization only.
- Correction format:
Romanization
Translation in ${nativeLanguage}

If using pinyin:
- Main conversation: Pinyin.
- Correction format:
Pinyin
Translation in ${nativeLanguage}

If using simplified:
- Main conversation: Simplified Chinese.
- Correction format:
Simplified Chinese
Pinyin
Translation in ${nativeLanguage}

If using traditional:
- Main conversation: Traditional Chinese.
- Correction format:
Traditional Chinese
Pinyin
Translation in ${nativeLanguage}

Useful expressions:
- Return 2 to 4 useful expressions from the current roleplay only.
- Do not invent unrelated expressions.
- Match the selected writing system.
- Do not return target-language-only expressions.
- Each useful expression must include:
  Original phrase
  Romaji or pronunciation
  Translation in ${nativeLanguage}

Roleplay behavior:
- If the user orders food, confirm the order and ask naturally if they want anything else.
- If the user chooses a destination, confirm it and continue the travel scene.
- If the user answers casually, respond naturally and ask a related in-character question.
- Always continue the roleplay after correcting.
`.trim();

        const result = await sendMessageToBackend(starter, [...messages, userMessage]);

        setMessages([
            createMessage({
                role: "assistant",
                content: result.reply,
                extra: {
                    candidateVocabulary: result.candidateVocabulary || [],
                    scenarioStarted: true,
                },
            }),
        ]);

        setPreparingScenario(false);
        setSessionReady(true);
    };

    const handleQuickPrompt = (prompt) => {
        setQuickPromptsHidden(true);

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
                    phoneticHint: candidate?.phoneticHint || "",
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

            if (data.alreadyExists) {
                setSavedWords((prev) =>
                    prev.includes(phrase) ? prev : [...prev, phrase]
                );

                return;
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
                                    <span>
                                        {t("aiChat.scenario")}: {scenario}
                                    </span>
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
                                className="ai-chat-tool-btn"
                                onClick={() =>
                                    navigate(
                                        `/dashboard/ai-voice?language=${encodeURIComponent(
                                            userTargetLanguage
                                        )}&languageCode=${encodeURIComponent(
                                            userLanguageCode
                                        )}&languageVariant=${encodeURIComponent(
                                            userLanguageVariant
                                        )}&level=${encodeURIComponent(
                                            level || "Beginner"
                                        )}`
                                    )
                                }
                            >
                                <Mic size={16} />
                                <span>Speak with AI</span>
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
                                <div className="ai-chat-bot-avatar cloud">
                                    <img src="/talsky-ai-logo.png" alt="TalSky AI" />
                                </div>
                                <div>
                                    <h1>{modeData.title}</h1>
                                    <p>{modeData.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="ai-chat-messages">
                            {preparingScenario ? (
                                <div className="ai-roleplay-preparing">
                                    <div className="ai-roleplay-preparing-logo">
                                        <img src="/talsky-ai-logo.png" alt="TalSky AI" />
                                    </div>

                                    <p className="ai-chat-kicker">
                                        {mode === "roleplay"
                                            ? t("aiChat.ai.loading.preparingScenario")
                                            : t("aiChat.ai.loading.preparingPractice")}
                                    </p>

                                    <h3>
                                        {mode === "roleplay"
                                            ? t("aiChat.ai.loading.preparingScenarioTitle")
                                            : t("aiChat.ai.loading.preparingPracticeTitle")}
                                    </h3>

                                    <div className="ai-roleplay-context">
                                        <span>
                                            {scenario || topic}
                                        </span>
                                    </div>

                                    <p>
                                        {t("aiChat.ai.loading.preparingDescription")}
                                    </p>

                                    <div className="ai-roleplay-loading-dots">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            ) : null}
                            {introTyping ? (
                                <div className="ai-chat-message-row assistant">
                                    <div className="ai-chat-bubble assistant typing intro">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            ) : null}

                            {showWritingSystemPicker ? (
                                <div className="ai-writing-picker">
                                    <h3>{t("aiChat.writingSystems.title")}</h3>

                                    <p>
                                        {t("aiChat.writingSystems.description")}
                                    </p>

                                    <div className="ai-writing-options">
                                        {WRITING_SYSTEMS_BY_LANGUAGE[languageKey]?.map((id) => (
                                            <button
                                                key={id}
                                                type="button"
                                                className="ai-writing-option"
                                                onClick={() => startScenarioWithWritingSystem(id)}
                                            >
                                                <strong>{t(`aiChat.writingSystems.${id}.label`)}</strong>
                                                <span>{t(`aiChat.writingSystems.${id}.description`)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {!showWritingSystemPicker &&
                                !preparingScenario &&
                                messages.map((msg) => (
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
                                                                        <strong>{phrase}</strong>

                                                                        {item.pronunciation && (
                                                                            <div className="ai-chat-suggestion-pronunciation">
                                                                                {item.pronunciation}
                                                                            </div>
                                                                        )}

                                                                        {item.translation && (
                                                                            <div className="ai-chat-suggestion-translation">
                                                                                {item.translation}
                                                                            </div>
                                                                        )}
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

                        {!preparingScenario && (
                            <div className="ai-chat-composer">
                                {!quickPromptsHidden && !showWritingSystemPicker && (
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
                                )}

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
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}