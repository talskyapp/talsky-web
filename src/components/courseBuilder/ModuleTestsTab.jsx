import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Field from "./Field";
import { API_URL } from "../../lib/config";
import ModuleTestQuestionEditor from "./ModuleTestQuestionEditor";

const questionTemplates = {
    "multiple-choice": {
        type: "multiple-choice",
        title: "",
        prompt: "",
        instruction: "",
        question: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
        points: 10,
        order: 1,
    },
    listening: {
        type: "listening",
        title: "",
        prompt: "",
        instruction: "",
        question: "",
        audio: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
        points: 10,
        order: 1,
    },
    "fill-in-the-blank": {
        type: "fill-in-the-blank",
        title: "",
        prompt: "",
        instruction: "",
        sentence: "",
        answer: "",
        acceptableAnswers: [""],
        explanation: "",
        points: 10,
        order: 1,
    },
    "match-pairs": {
        type: "match-pairs",
        title: "",
        prompt: "",
        instruction: "",
        pairs: [
            { left: "", right: "" },
            { left: "", right: "" },
        ],
        explanation: "",
        points: 10,
        order: 1,
    },
    "translate-short-answer": {
        type: "translate-short-answer",
        title: "",
        prompt: "",
        instruction: "",
        sourceText: "",
        answer: "",
        acceptableAnswers: [""],
        explanation: "",
        points: 10,
        order: 1,
    },
    "image-choice": {
        type: "image-choice",
        title: "",
        prompt: "",
        instruction: "",
        question: "",
        image: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
        points: 10,
        order: 1,
    },
    unscramble: {
        type: "unscramble",
        title: "",
        prompt: "",
        instruction: "",
        words: ["", "", ""],
        answer: "",
        explanation: "",
        points: 10,
        order: 1,
    },
    speaking: {
        type: "speaking",
        title: "",
        prompt: "",
        instruction: "",
        targetText: "",
        hint: "",
        answer: "",
        explanation: "",
        points: 10,
        order: 1,
    },
};

const emptyTestData = {
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
    coverImage: "",
    introAudio: "",
    xpReward: 50,
    passingScore: 70,
    estimatedMinutes: 10,
    timeLimitMinutes: 15,
    maxAttempts: 3,
    isPublished: false,
    isLockedUntilLessonsCompleted: true,
    questions: [],
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

export default function ModuleTestsTab({ courses = [] }) {
    const [modules, setModules] = useState([]);
    const [moduleTests, setModuleTests] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [testData, setTestData] = useState(emptyTestData);
    const [editingTestId, setEditingTestId] = useState("");
    const [selectedTestToEdit, setSelectedTestToEdit] = useState("");

    useEffect(() => {
        if (!testData.courseId) {
            setModules([]);
            setModuleTests([]);
            return;
        }

        fetchModulesByCourse(testData.courseId);
    }, [testData.courseId]);

    useEffect(() => {
        if (!testData.moduleId) {
            setModuleTests([]);
            return;
        }

        fetchModuleTestsByModule(testData.moduleId);
    }, [testData.moduleId]);

    const selectedCourseName = useMemo(() => {
        return (
            courses.find((course) => course._id === testData.courseId)?.name ||
            "No course selected"
        );
    }, [courses, testData.courseId]);

    const selectedModuleName = useMemo(() => {
        return (
            modules.find((module) => module._id === testData.moduleId)?.name ||
            "No module selected"
        );
    }, [modules, testData.moduleId]);

    const fetchModulesByCourse = async (courseId) => {
        try {
            const res = await axios.get(`${API_URL}/api/modules/${courseId}`);

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

    const fetchModuleTestsByModule = async (moduleId) => {
        try {
            const res = await axios.get(`${API_URL}/api/module-tests/module/${moduleId}`);

            const data = normalizeArrayResponse(res.data, [
                "tests",
                "moduleTests",
                "data",
                "items",
                "results",
            ]);

            setModuleTests(data);
        } catch (error) {
            console.error("Error fetching module tests:", error);
            setModuleTests([]);
        }
    };

    const fetchOneModuleTest = async (testId) => {
        try {
            const res = await axios.get(`${API_URL}/api/module-tests/${testId}`);
            return res.data;
        } catch (error) {
            console.error("Error fetching module test:", error);
            alert("Failed to load module test");
            return null;
        }
    };

    const resetForm = () => {
        setEditingTestId("");
        setSelectedTestToEdit("");
        setTestData(emptyTestData);
        setModules([]);
        setModuleTests([]);
    };

    const loadTestForEdit = async () => {
        if (!selectedTestToEdit) {
            alert("Select a module test first");
            return;
        }

        const test = await fetchOneModuleTest(selectedTestToEdit);
        if (!test) return;

        setEditingTestId(test._id);
        setTestData({
            courseId: test.courseId || "",
            moduleId: test.moduleId || "",
            title: test.title || "",
            description: test.description || "",
            coverImage: test.coverImage || "",
            introAudio: test.introAudio || "",
            xpReward: test.xpReward ?? 50,
            passingScore: test.passingScore ?? 70,
            estimatedMinutes: test.estimatedMinutes ?? 10,
            timeLimitMinutes: test.timeLimitMinutes ?? 15,
            maxAttempts: test.maxAttempts ?? 3,
            isPublished: !!test.isPublished,
            isLockedUntilLessonsCompleted:
                test.isLockedUntilLessonsCompleted ?? true,
            questions: Array.isArray(test.questions) ? test.questions : [],
        });
    };

    const createModuleTest = async () => {
        if (!testData.courseId || !testData.moduleId) {
            alert("Select a course and module");
            return;
        }

        if (!testData.title.trim()) {
            alert("Add a title");
            return;
        }

        if (!testData.questions.length) {
            alert("Add at least one question");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...testData,
                xpReward: Number(testData.xpReward),
                passingScore: Number(testData.passingScore),
                estimatedMinutes: Number(testData.estimatedMinutes),
                timeLimitMinutes: Number(testData.timeLimitMinutes),
                maxAttempts: Number(testData.maxAttempts),
                questions: testData.questions.map((question, index) => ({
                    ...question,
                    points: Number(question.points || 10),
                    order: Number(question.order || index + 1),
                })),
            };

            await axios.post(`${API_URL}/api/module-tests`, payload);

            alert("Module test created!");
            resetForm();
        } catch (error) {
            console.error("Error creating module test:", error);
            alert(
                error?.response?.data?.error || "Failed to create module test"
            );
        } finally {
            setSaving(false);
        }
    };

    const updateModuleTest = async () => {
        if (!editingTestId) {
            alert("No module test selected");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...testData,
                xpReward: Number(testData.xpReward),
                passingScore: Number(testData.passingScore),
                estimatedMinutes: Number(testData.estimatedMinutes),
                timeLimitMinutes: Number(testData.timeLimitMinutes),
                maxAttempts: Number(testData.maxAttempts),
                questions: testData.questions.map((question, index) => ({
                    ...question,
                    points: Number(question.points || 10),
                    order: Number(question.order || index + 1),
                })),
            };

            await axios.put(`${API_URL}/api/module-tests/${editingTestId}`, payload);

            alert("Module test updated!");

            if (testData.moduleId) {
                fetchModuleTestsByModule(testData.moduleId);
            }
        } catch (error) {
            console.error("Error updating module test:", error);
            alert(
                error?.response?.data?.error || "Failed to update module test"
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteModuleTest = async () => {
        if (!editingTestId) {
            alert("Load a module test first");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this module test?"
        );

        if (!confirmed) return;

        try {
            setDeleting(true);

            await axios.delete(`${API_URL}/api/module-tests/${editingTestId}`);

            alert("Module test deleted!");
            resetForm();
        } catch (error) {
            console.error("Error deleting module test:", error);
            alert(
                error?.response?.data?.error || "Failed to delete module test"
            );
        } finally {
            setDeleting(false);
        }
    };

    const addQuestion = (questionType) => {
        const template = questionTemplates[questionType];
        if (!template) return;

        setTestData((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    ...JSON.parse(JSON.stringify(template)),
                    order: prev.questions.length + 1,
                },
            ],
        }));
    };

    const removeQuestion = (questionIndex) => {
        setTestData((prev) => ({
            ...prev,
            questions: prev.questions
                .filter((_, index) => index !== questionIndex)
                .map((question, index) => ({
                    ...question,
                    order: index + 1,
                })),
        }));
    };

    const updateQuestion = (questionIndex, updatedQuestion) => {
        setTestData((prev) => {
            const newQuestions = [...prev.questions];
            newQuestions[questionIndex] = updatedQuestion;
            return { ...prev, questions: newQuestions };
        });
    };

    const updateQuestionOption = (questionIndex, optionIndex, value) => {
        const question = testData.questions[questionIndex];
        const options = [...(question.options || [])];
        options[optionIndex] = value;
        updateQuestion(questionIndex, { ...question, options });
    };

    const updateAcceptableAnswer = (questionIndex, answerIndex, value) => {
        const question = testData.questions[questionIndex];
        const acceptableAnswers = [...(question.acceptableAnswers || [""])];
        acceptableAnswers[answerIndex] = value;
        updateQuestion(questionIndex, { ...question, acceptableAnswers });
    };

    const addAcceptableAnswer = (questionIndex) => {
        const question = testData.questions[questionIndex];
        updateQuestion(questionIndex, {
            ...question,
            acceptableAnswers: [...(question.acceptableAnswers || []), ""],
        });
    };

    const updateMatchPair = (questionIndex, pairIndex, side, value) => {
        const question = testData.questions[questionIndex];
        const pairs = [...(question.pairs || [])];
        pairs[pairIndex] = {
            ...pairs[pairIndex],
            [side]: value,
        };
        updateQuestion(questionIndex, { ...question, pairs });
    };

    const addMatchPair = (questionIndex) => {
        const question = testData.questions[questionIndex];
        updateQuestion(questionIndex, {
            ...question,
            pairs: [...(question.pairs || []), { left: "", right: "" }],
        });
    };

    const updateUnscrambleWord = (questionIndex, wordIndex, value) => {
        const question = testData.questions[questionIndex];
        const words = [...(question.words || [])];
        words[wordIndex] = value;
        updateQuestion(questionIndex, { ...question, words });
    };

    const addUnscrambleWord = (questionIndex) => {
        const question = testData.questions[questionIndex];
        updateQuestion(questionIndex, {
            ...question,
            words: [...(question.words || []), ""],
        });
    };

    const editorHandlers = {
        updateQuestion,
        updateQuestionOption,
        updateAcceptableAnswer,
        addAcceptableAnswer,
        updateMatchPair,
        addMatchPair,
        updateUnscrambleWord,
        addUnscrambleWord,
    };

    return (
        <div className="cb-lesson-layout">
            <div className="cb-card">
                <h2 className="cb-section-title">
                    {editingTestId ? "Edit Module Test" : "Create Module Test"}
                </h2>
                <p className="cb-section-text">
                    Build the final exam for each module.
                </p>

                <div className="cb-grid">
                    <Field label="Course">
                        <select
                            className="cb-input"
                            value={testData.courseId}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    courseId: e.target.value,
                                    moduleId: "",
                                }))
                            }
                        >
                            <option value="">Select Course</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Module">
                        <select
                            className="cb-input"
                            value={testData.moduleId}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    moduleId: e.target.value,
                                }))
                            }
                        >
                            <option value="">Select Module</option>
                            {modules.map((module) => (
                                <option key={module._id} value={module._id}>
                                    {module.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="cb-mt-16">
                    <div className="cb-grid">
                        <Field label="Load Existing Test">
                            <select
                                className="cb-input"
                                value={selectedTestToEdit}
                                onChange={(e) => setSelectedTestToEdit(e.target.value)}
                            >
                                <option value="">Select Module Test</option>
                                {moduleTests.map((test) => (
                                    <option key={test._id} value={test._id}>
                                        {test.title}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Actions">
                            <div className="cb-flex-wrap">
                                <button
                                    type="button"
                                    className="cb-btn-secondary"
                                    onClick={loadTestForEdit}
                                >
                                    Load Test
                                </button>

                                <button
                                    type="button"
                                    className="cb-btn-secondary"
                                    onClick={resetForm}
                                >
                                    Reset Form
                                </button>
                            </div>
                        </Field>
                    </div>
                </div>

                <div className="cb-mt-16">
                    <div className="cb-grid">
                        <Field label="Test Title">
                            <input
                                className="cb-input"
                                value={testData.title}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                placeholder="Module 1 Final Test"
                            />
                        </Field>

                        <Field label="XP Reward">
                            <input
                                className="cb-input"
                                type="number"
                                value={testData.xpReward}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        xpReward: e.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Passing Score">
                            <input
                                className="cb-input"
                                type="number"
                                value={testData.passingScore}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        passingScore: e.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Estimated Minutes">
                            <input
                                className="cb-input"
                                type="number"
                                value={testData.estimatedMinutes}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        estimatedMinutes: e.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Time Limit Minutes">
                            <input
                                className="cb-input"
                                type="number"
                                value={testData.timeLimitMinutes}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        timeLimitMinutes: e.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Max Attempts">
                            <input
                                className="cb-input"
                                type="number"
                                value={testData.maxAttempts}
                                onChange={(e) =>
                                    setTestData((prev) => ({
                                        ...prev,
                                        maxAttempts: e.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                </div>

                <div className="cb-mt-16">
                    <Field label="Description">
                        <textarea
                            className="cb-textarea"
                            value={testData.description}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Describe this module exam..."
                        />
                    </Field>
                </div>

                <div className="cb-mt-16 cb-grid">
                    <Field label="Cover Image URL">
                        <input
                            className="cb-input"
                            value={testData.coverImage}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    coverImage: e.target.value,
                                }))
                            }
                            placeholder="/uploads/module-test-cover.png"
                        />
                    </Field>

                    <Field label="Intro Audio URL">
                        <input
                            className="cb-input"
                            value={testData.introAudio}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    introAudio: e.target.value,
                                }))
                            }
                            placeholder="/uploads/module-test-intro.mp3"
                        />
                    </Field>
                </div>

                <div className="cb-check-wrap">
                    <label className="cb-check-label">
                        <input
                            type="checkbox"
                            checked={testData.isPublished}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    isPublished: e.target.checked,
                                }))
                            }
                        />
                        Publish module test
                    </label>
                </div>

                <div className="cb-check-wrap">
                    <label className="cb-check-label">
                        <input
                            type="checkbox"
                            checked={testData.isLockedUntilLessonsCompleted}
                            onChange={(e) =>
                                setTestData((prev) => ({
                                    ...prev,
                                    isLockedUntilLessonsCompleted: e.target.checked,
                                }))
                            }
                        />
                        Lock until lessons are completed
                    </label>
                </div>

                <h2 className="cb-section-title">Questions</h2>
                <p className="cb-section-text">Add the exam questions.</p>

                <div className="cb-step-toolbar">
                    {Object.keys(questionTemplates).map((questionType) => (
                        <button
                            key={questionType}
                            type="button"
                            className="cb-pill-btn"
                            onClick={() => addQuestion(questionType)}
                        >
                            + {questionType}
                        </button>
                    ))}
                </div>

                {testData.questions.length === 0 ? (
                    <div className="cb-preview-box">
                        No questions yet. Add at least one question.
                    </div>
                ) : (
                    testData.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="cb-step-card">
                            <div className="cb-step-header">
                                <div className="cb-step-title">
                                    Question {questionIndex + 1} · {question.type}
                                </div>

                                <button
                                    type="button"
                                    className="cb-remove-btn"
                                    onClick={() => removeQuestion(questionIndex)}
                                >
                                    Remove
                                </button>
                            </div>

                            <ModuleTestQuestionEditor
                                question={question}
                                questionIndex={questionIndex}
                                handlers={editorHandlers}
                            />
                        </div>
                    ))
                )}

                <div className="cb-flex-wrap cb-mt-16">
                    <button
                        className="cb-btn-primary"
                        onClick={editingTestId ? updateModuleTest : createModuleTest}
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : editingTestId
                                ? "Update Module Test"
                                : "Create Module Test"}
                    </button>

                    {editingTestId && (
                        <button
                            type="button"
                            className="cb-btn-danger"
                            onClick={deleteModuleTest}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete Test"}
                        </button>
                    )}

                    {editingTestId && (
                        <button
                            type="button"
                            className="cb-btn-secondary"
                            onClick={resetForm}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="cb-card cb-sidebar-card">
                <h2 className="cb-preview-title">Module Test Preview</h2>
                <p className="cb-preview-muted">Quick overview of what will be saved.</p>

                <div className="cb-preview-box">
                    <div className="cb-preview-line">
                        <strong>Course:</strong> {selectedCourseName}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Module:</strong> {selectedModuleName}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Title:</strong> {testData.title || "Untitled test"}
                    </div>
                    <div className="cb-preview-line">
                        <strong>XP Reward:</strong> {testData.xpReward}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Passing Score:</strong> {testData.passingScore}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Estimated Minutes:</strong> {testData.estimatedMinutes}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Time Limit:</strong> {testData.timeLimitMinutes}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Attempts:</strong> {testData.maxAttempts}
                    </div>
                    <div className="cb-preview-line">
                        <strong>Status:</strong> {testData.isPublished ? "Published" : "Draft"}
                    </div>

                    <div className="cb-preview-steps-title">
                        Questions ({testData.questions.length})
                    </div>

                    {testData.questions.length === 0 ? (
                        <div className="cb-preview-item">No questions added yet.</div>
                    ) : (
                        testData.questions.map((question, index) => (
                            <div key={index} className="cb-preview-item">
                                <strong>
                                    {index + 1}. {question.type}
                                </strong>
                                <div className="cb-preview-item-text">
                                    {question.question ||
                                        question.prompt ||
                                        question.sentence ||
                                        question.sourceText ||
                                        "Untitled question"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}