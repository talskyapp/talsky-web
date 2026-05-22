import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Field from "./Field";
import LessonStepEditor from "./LessonStepEditor";
import { lessonStepTemplates } from "./lessonStepTemplates";

const emptyLessonData = {
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
    xpReward: 10,
    estimatedMinutes: 5,
    order: 1,
    isPublished: false,
    steps: [],
};

function normalizeArrayResponse(data, possibleKeys = []) {
    if (Array.isArray(data)) return data;

    for (const key of possibleKeys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
}

export default function LessonsTab({ courses, apiUrl }) {
    const [modules, setModules] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [saving, setSaving] = useState(false);

    const [lessonData, setLessonData] = useState(emptyLessonData);
    const [editingLessonId, setEditingLessonId] = useState("");
    const [selectedLessonToEdit, setSelectedLessonToEdit] = useState("");

    useEffect(() => {
        if (!lessonData.courseId) {
            setModules([]);
            setLessons([]);
            return;
        }

        fetchModulesByCourse(lessonData.courseId);
    }, [lessonData.courseId]);

    useEffect(() => {
        if (!lessonData.moduleId) {
            setLessons([]);
            return;
        }

        fetchLessonsByModule(lessonData.moduleId);
    }, [lessonData.moduleId]);

    const selectedCourseName = useMemo(() => {
        if (!Array.isArray(courses)) return "No course selected";
        return (
            courses.find((c) => c._id === lessonData.courseId)?.name ||
            "No course selected"
        );
    }, [courses, lessonData.courseId]);

    const selectedModuleName = useMemo(() => {
        if (!Array.isArray(modules)) return "No module selected";
        return (
            modules.find((m) => m._id === lessonData.moduleId)?.name ||
            "No module selected"
        );
    }, [modules, lessonData.moduleId]);

    const fetchModulesByCourse = async (courseId) => {
        try {
            const res = await axios.get(`${apiUrl}/api/modules/${courseId}`);

            const data = normalizeArrayResponse(res.data, [
                "modules",
                "data",
                "items",
                "results",
            ]);

            setModules(data);
        } catch (error) {
            console.error("Error fetching modules:", error);
            setModules([]);
            alert("Failed to load modules");
        }
    };

    const fetchLessonsByModule = async (moduleId) => {
        try {
            const res = await axios.get(`${apiUrl}/api/lessons/module/${moduleId}`);

            const data = normalizeArrayResponse(res.data, [
                "lessons",
                "data",
                "items",
                "results",
            ]);

            setLessons(data);
        } catch (error) {
            console.error("Error fetching lessons:", error);
            setLessons([]);
        }
    };

    const fetchOneLesson = async (lessonId) => {
        try {
            const res = await axios.get(`${apiUrl}/api/lessons/${lessonId}`);
            return res.data;
        } catch (error) {
            console.error("Error fetching lesson:", error);
            alert("Failed to load lesson");
            return null;
        }
    };

    const buildLessonFormData = (data) => {
        const formData = new FormData();

        const clonedSteps = (data.steps || []).map((step, stepIndex) => {
            if (step.type !== "vocabulary") return step;

            return {
                ...step,
                items: (step.items || []).map((item, itemIndex) => {
                    if (item.image instanceof File) {
                        formData.append(`vocab_image_${stepIndex}_${itemIndex}`, item.image);
                    }

                    if (item.audio instanceof File) {
                        formData.append(`vocab_audio_${stepIndex}_${itemIndex}`, item.audio);
                    }

                    return {
                        ...item,
                        image:
                            item.image instanceof File
                                ? ""
                                : typeof item.image === "string"
                                    ? item.image
                                    : "",
                        audio:
                            item.audio instanceof File
                                ? ""
                                : typeof item.audio === "string"
                                    ? item.audio
                                    : "",
                        imagePreview: "",
                        audioPreview: "",
                    };
                }),
            };
        });

        const payload = {
            ...data,
            xpReward: Number(data.xpReward),
            estimatedMinutes: Number(data.estimatedMinutes),
            order: Number(data.order),
            steps: clonedSteps,
        };

        formData.append("lessonData", JSON.stringify(payload));
        return formData;
    };

    const createLesson = async () => {
        try {
            setSaving(true);

            const formData = buildLessonFormData(lessonData);

            await axios.post(`${apiUrl}/api/lessons`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Lesson created!");
            setLessonData(emptyLessonData);
            setEditingLessonId("");
            setSelectedLessonToEdit("");
            setLessons([]);
        } catch (error) {
            console.error("Error creating lesson:", error);
            alert("Failed to create lesson");
        } finally {
            setSaving(false);
        }
    };

    const updateLesson = async () => {
        if (!editingLessonId) {
            alert("No lesson selected to edit");
            return;
        }

        try {
            setSaving(true);

            const formData = buildLessonFormData(lessonData);

            await axios.put(`${apiUrl}/api/lessons/${editingLessonId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Lesson updated!");

            if (lessonData.moduleId) {
                fetchLessonsByModule(lessonData.moduleId);
            }
        } catch (error) {
            console.error("Error updating lesson:", error);
            alert("Failed to update lesson");
        } finally {
            setSaving(false);
        }
    };

    const loadLessonForEdit = async () => {
        if (!selectedLessonToEdit) {
            alert("Select a lesson first");
            return;
        }

        const lesson = await fetchOneLesson(selectedLessonToEdit);
        if (!lesson) return;

        setEditingLessonId(lesson._id);
        setLessonData({
            courseId: lesson.courseId || "",
            moduleId: lesson.moduleId || "",
            title: lesson.title || "",
            description: lesson.description || "",
            xpReward: lesson.xpReward ?? 10,
            estimatedMinutes: lesson.estimatedMinutes ?? 5,
            order: lesson.order ?? 1,
            isPublished: !!lesson.isPublished,
            steps: Array.isArray(lesson.steps) ? lesson.steps : [],
        });
    };

    const resetLessonForm = () => {
        setLessonData(emptyLessonData);
        setEditingLessonId("");
        setSelectedLessonToEdit("");
        setModules([]);
        setLessons([]);
    };

    const addStep = (stepType) => {
        const template = lessonStepTemplates[stepType];
        if (!template) return;

        setLessonData((prev) => ({
            ...prev,
            steps: [...prev.steps, JSON.parse(JSON.stringify(template))],
        }));
    };

    const removeStep = (stepIndex) => {
        setLessonData((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== stepIndex),
        }));
    };

    const updateStep = (stepIndex, updatedStep) => {
        setLessonData((prev) => {
            const newSteps = [...prev.steps];
            newSteps[stepIndex] = updatedStep;
            return { ...prev, steps: newSteps };
        });
    };

    const addVocabularyItem = (stepIndex) => {
        const step = lessonData.steps[stepIndex];
        updateStep(stepIndex, {
            ...step,
            items: [
                ...step.items,
                {
                    text: "",
                    translation: "",
                    pronunciation: "",
                    audio: null,
                    audioPreview: "",
                    image: null,
                    imagePreview: "",
                    note: "",
                    example: {
                        english: "",
                        translation: "",
                    },
                },
            ],
        });
    };

    const updateVocabularyItem = (stepIndex, itemIndex, field, value) => {
        const step = lessonData.steps[stepIndex];
        const items = [...step.items];
        items[itemIndex] = { ...items[itemIndex], [field]: value };
        updateStep(stepIndex, { ...step, items });
    };

    const updateVocabularyExample = (stepIndex, itemIndex, field, value) => {
        const step = lessonData.steps[stepIndex];
        const items = [...step.items];
        items[itemIndex] = {
            ...items[itemIndex],
            example: {
                ...items[itemIndex].example,
                [field]: value,
            },
        };
        updateStep(stepIndex, { ...step, items });
    };

    const updateStepOption = (stepIndex, optionIndex, value) => {
        const step = lessonData.steps[stepIndex];
        const options = [...(step.options || [])];
        options[optionIndex] = value;
        updateStep(stepIndex, { ...step, options });
    };

    const addConversationMessage = (stepIndex, fromType = "bot") => {
        const step = lessonData.steps[stepIndex];
        const newMessage =
            fromType === "bot"
                ? { from: "bot", text: "" }
                : { from: "user", options: ["", ""] };

        updateStep(stepIndex, {
            ...step,
            messages: [...(step.messages || []), newMessage],
        });
    };

    const updateConversationMessage = (stepIndex, msgIndex, field, value) => {
        const step = lessonData.steps[stepIndex];
        const messages = [...(step.messages || [])];
        messages[msgIndex] = { ...messages[msgIndex], [field]: value };
        updateStep(stepIndex, { ...step, messages });
    };

    const updateConversationOption = (stepIndex, msgIndex, optionIndex, value) => {
        const step = lessonData.steps[stepIndex];
        const messages = [...(step.messages || [])];
        const msg = messages[msgIndex];
        const options = [...(msg.options || [])];
        options[optionIndex] = value;
        messages[msgIndex] = { ...msg, options };
        updateStep(stepIndex, { ...step, messages });
    };

    const addConversationOption = (stepIndex, msgIndex) => {
        const step = lessonData.steps[stepIndex];
        const messages = [...(step.messages || [])];
        const msg = messages[msgIndex];

        messages[msgIndex] = {
            ...msg,
            options: [...(msg.options || []), ""],
        };

        updateStep(stepIndex, { ...step, messages });
    };

    const updateAcceptableAnswer = (stepIndex, answerIndex, value) => {
        const step = lessonData.steps[stepIndex];
        const acceptableAnswers = [...(step.acceptableAnswers || [""])];
        acceptableAnswers[answerIndex] = value;
        updateStep(stepIndex, { ...step, acceptableAnswers });
    };

    const addAcceptableAnswer = (stepIndex) => {
        const step = lessonData.steps[stepIndex];
        updateStep(stepIndex, {
            ...step,
            acceptableAnswers: [...(step.acceptableAnswers || []), ""],
        });
    };

    const updateLetterBankLetter = (stepIndex, letterIndex, value) => {
        const step = lessonData.steps[stepIndex];
        const letters = [...(step.letters || [])];
        letters[letterIndex] = value;
        updateStep(stepIndex, { ...step, letters });
    };

    const addLetterBankLetter = (stepIndex) => {
        const step = lessonData.steps[stepIndex];
        updateStep(stepIndex, {
            ...step,
            letters: [...(step.letters || []), ""],
        });
    };

    const updateUnscrambleWord = (stepIndex, wordIndex, value) => {
        const step = lessonData.steps[stepIndex];
        const words = [...(step.words || [])];
        words[wordIndex] = value;
        updateStep(stepIndex, { ...step, words });
    };

    const addUnscrambleWord = (stepIndex) => {
        const step = lessonData.steps[stepIndex];
        updateStep(stepIndex, {
            ...step,
            words: [...(step.words || []), ""],
        });
    };

    const updateMatchPair = (stepIndex, pairIndex, side, value) => {
        const step = lessonData.steps[stepIndex];
        const pairs = [...(step.pairs || [])];
        pairs[pairIndex] = {
            ...pairs[pairIndex],
            [side]: value,
        };
        updateStep(stepIndex, { ...step, pairs });
    };

    const addMatchPair = (stepIndex) => {
        const step = lessonData.steps[stepIndex];
        updateStep(stepIndex, {
            ...step,
            pairs: [...(step.pairs || []), { left: "", right: "" }],
        });
    };

    const handleVocabularyImageUpload = (stepIndex, itemIndex, file) => {
        if (!file) return;

        const step = lessonData.steps[stepIndex];
        const items = [...step.items];

        items[itemIndex] = {
            ...items[itemIndex],
            image: file,
            imagePreview: URL.createObjectURL(file),
        };

        updateStep(stepIndex, { ...step, items });
    };

    const handleVocabularyAudioUpload = (stepIndex, itemIndex, file) => {
        if (!file) return;

        const step = lessonData.steps[stepIndex];
        const items = [...step.items];

        items[itemIndex] = {
            ...items[itemIndex],
            audio: file,
            audioPreview: URL.createObjectURL(file),
        };

        updateStep(stepIndex, { ...step, items });
    };

    const removeVocabularyImage = (stepIndex, itemIndex) => {
        const step = lessonData.steps[stepIndex];
        const items = [...step.items];

        items[itemIndex] = {
            ...items[itemIndex],
            image: null,
            imagePreview: "",
        };

        updateStep(stepIndex, { ...step, items });
    };

    const removeVocabularyAudio = (stepIndex, itemIndex) => {
        const step = lessonData.steps[stepIndex];
        const items = [...step.items];

        items[itemIndex] = {
            ...items[itemIndex],
            audio: null,
            audioPreview: "",
        };

        updateStep(stepIndex, { ...step, items });
    };

    const editorHandlers = {
        updateStep,
        addVocabularyItem,
        updateVocabularyItem,
        updateVocabularyExample,
        updateStepOption,
        addConversationMessage,
        updateConversationMessage,
        updateConversationOption,
        addConversationOption,
        updateAcceptableAnswer,
        addAcceptableAnswer,
        updateLetterBankLetter,
        addLetterBankLetter,
        updateUnscrambleWord,
        addUnscrambleWord,
        updateMatchPair,
        addMatchPair,
        handleVocabularyImageUpload,
        handleVocabularyAudioUpload,
        removeVocabularyImage,
        removeVocabularyAudio,
    };

    return (
        <div className="cb-lesson-layout">
            <div className="cb-card">
                <h2 className="cb-section-title">
                    {editingLessonId ? "Edit Lesson" : "Create Lesson"}
                </h2>
                <p className="cb-section-text">
                    Build lesson content using dynamic steps instead of only questions.
                </p>

                <div className="cb-grid">
                    <Field label="Course">
                        <select
                            className="cb-input"
                            value={lessonData.courseId}
                            onChange={(e) =>
                                setLessonData({
                                    ...lessonData,
                                    courseId: e.target.value,
                                    moduleId: "",
                                })
                            }
                        >
                            <option value="">Select Course</option>
                            {Array.isArray(courses) &&
                                courses.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                        </select>
                    </Field>

                    <Field label="Module">
                        <select
                            className="cb-input"
                            value={lessonData.moduleId}
                            onChange={(e) =>
                                setLessonData({
                                    ...lessonData,
                                    moduleId: e.target.value,
                                })
                            }
                        >
                            <option value="">Select Module</option>
                            {Array.isArray(modules) &&
                                modules.map((m) => (
                                    <option key={m._id} value={m._id}>
                                        {m.name}
                                    </option>
                                ))}
                        </select>
                    </Field>
                </div>

                <div className="cb-mt-16">
                    <div className="cb-grid">
                        <Field label="Load Existing Lesson">
                            <select
                                className="cb-input"
                                value={selectedLessonToEdit}
                                onChange={(e) => setSelectedLessonToEdit(e.target.value)}
                            >
                                <option value="">Select Lesson</option>
                                {Array.isArray(lessons) &&
                                    lessons.map((lesson) => (
                                        <option key={lesson._id} value={lesson._id}>
                                            {lesson.title}
                                        </option>
                                    ))}
                            </select>
                        </Field>

                        <Field label="Actions">
                            <div className="cb-flex-wrap">
                                <button
                                    className="cb-btn-secondary"
                                    type="button"
                                    onClick={loadLessonForEdit}
                                >
                                    Load Lesson
                                </button>

                                <button
                                    className="cb-btn-secondary"
                                    type="button"
                                    onClick={resetLessonForm}
                                >
                                    Reset Form
                                </button>
                            </div>
                        </Field>
                    </div>
                </div>

                <div className="cb-mt-16">
                    <div className="cb-grid">
                        <Field label="Lesson Title">
                            <input
                                className="cb-input"
                                value={lessonData.title}
                                onChange={(e) =>
                                    setLessonData({ ...lessonData, title: e.target.value })
                                }
                                placeholder="Greetings and Farewells"
                            />
                        </Field>

                        <Field label="Estimated Minutes">
                            <input
                                className="cb-input"
                                type="number"
                                value={lessonData.estimatedMinutes}
                                onChange={(e) =>
                                    setLessonData({
                                        ...lessonData,
                                        estimatedMinutes: e.target.value,
                                    })
                                }
                            />
                        </Field>

                        <Field label="XP Reward">
                            <input
                                className="cb-input"
                                type="number"
                                value={lessonData.xpReward}
                                onChange={(e) =>
                                    setLessonData({ ...lessonData, xpReward: e.target.value })
                                }
                            />
                        </Field>

                        <Field label="Order">
                            <input
                                className="cb-input"
                                type="number"
                                value={lessonData.order}
                                onChange={(e) =>
                                    setLessonData({ ...lessonData, order: e.target.value })
                                }
                            />
                        </Field>
                    </div>
                </div>

                <div className="cb-mt-16">
                    <Field label="Lesson Description">
                        <textarea
                            className="cb-textarea"
                            value={lessonData.description}
                            onChange={(e) =>
                                setLessonData({ ...lessonData, description: e.target.value })
                            }
                            placeholder="Students will learn how to greet, respond, and say goodbye."
                        />
                    </Field>
                </div>

                <div className="cb-check-wrap">
                    <label className="cb-check-label">
                        <input
                            type="checkbox"
                            checked={lessonData.isPublished}
                            onChange={(e) =>
                                setLessonData({ ...lessonData, isPublished: e.target.checked })
                            }
                        />
                        Publish lesson
                    </label>
                </div>

                <h2 className="cb-section-title">Lesson Steps</h2>
                <p className="cb-section-text">Add the experience flow for the student.</p>

                <div className="cb-step-toolbar">
                    {Object.keys(lessonStepTemplates).map((stepType) => (
                        <button
                            key={stepType}
                            type="button"
                            className="cb-pill-btn"
                            onClick={() => addStep(stepType)}
                        >
                            + {stepType}
                        </button>
                    ))}
                </div>

                {lessonData.steps.length === 0 ? (
                    <div className="cb-preview-box">
                        No steps yet. Start by adding intro, vocabulary, theory, or practice
                        blocks.
                    </div>
                ) : (
                    lessonData.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="cb-step-card">
                            <div className="cb-step-header">
                                <div className="cb-step-title">
                                    Step {stepIndex + 1} · {step.type}
                                </div>

                                <button
                                    type="button"
                                    className="cb-remove-btn"
                                    onClick={() => removeStep(stepIndex)}
                                >
                                    Remove
                                </button>
                            </div>

                            <LessonStepEditor
                                step={step}
                                stepIndex={stepIndex}
                                apiUrl={apiUrl}
                                handlers={editorHandlers}
                            />
                        </div>
                    ))
                )}

                <div className="cb-flex-wrap cb-mt-16">
                    <button
                        className="cb-btn-primary"
                        onClick={editingLessonId ? updateLesson : createLesson}
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : editingLessonId
                                ? "Update Lesson"
                                : "Create Lesson"}
                    </button>

                    {editingLessonId && (
                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={resetLessonForm}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="cb-card cb-sidebar-card">
                <h2 className="cb-preview-title">Lesson Preview</h2>
                <p className="cb-preview-muted">Quick overview of what will be saved.</p>

                <div className="cb-preview-box">
                    <div className="cb-preview-line">
                        <strong>Course:</strong> {selectedCourseName}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Module:</strong> {selectedModuleName}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Title:</strong> {lessonData.title || "Untitled lesson"}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Minutes:</strong> {lessonData.estimatedMinutes}
                    </div>
                    <div className="cb-preview-line">
                        <strong>XP:</strong> {lessonData.xpReward}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Status:</strong> {lessonData.isPublished ? "Published" : "Draft"}
                    </div>

                    <div className="cb-preview-steps-title">
                        Steps ({lessonData.steps.length})
                    </div>

                    {lessonData.steps.length === 0 ? (
                        <div className="cb-preview-item">No steps added yet.</div>
                    ) : (
                        lessonData.steps.map((step, index) => (
                            <div key={index} className="cb-preview-item">
                                <strong>
                                    {index + 1}. {step.type}
                                </strong>

                                <div className="cb-preview-item-text">
                                    {step.type === "intro" && (step.content?.headline || "Intro content")}
                                    {step.type === "vocabulary" &&
                                        `${step.items?.length || 0} vocabulary items`}
                                    {step.type === "theory" &&
                                        (step.content?.text?.slice(0, 60) || "Theory block")}
                                    {step.type === "multiple-choice" &&
                                        (step.question || "Multiple choice question")}
                                    {step.type === "listening" &&
                                        (step.question || "Listening question")}
                                    {step.type === "speaking" &&
                                        (step.prompt || "Speaking prompt")}
                                    {step.type === "conversation" &&
                                        `${step.messages?.length || 0} conversation messages`}
                                    {step.type === "fill-in-the-blank" &&
                                        (step.sentence || "Fill in the blank activity")}
                                    {step.type === "letter-bank" &&
                                        (step.template || "Letter bank activity")}
                                    {step.type === "unscramble" &&
                                        `${step.words?.length || 0} scrambled words`}
                                    {step.type === "match-pairs" &&
                                        `${step.pairs?.length || 0} matching pairs`}
                                    {step.type === "translate-short-answer" &&
                                        (step.sourceText || "Translation activity")}
                                    {step.type === "listening-type" &&
                                        (step.prompt || "Listening and type activity")}
                                    {step.type === "image-choice" &&
                                        (step.prompt || "Image choice activity")}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}