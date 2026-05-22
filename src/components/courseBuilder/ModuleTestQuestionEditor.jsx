import React from "react";
import Field from "./Field";

export default function ModuleTestQuestionEditor({
    question,
    questionIndex,
    handlers,
}) {
    const {
        updateQuestion,
        updateQuestionOption,
        updateAcceptableAnswer,
        addAcceptableAnswer,
        updateMatchPair,
        addMatchPair,
        updateUnscrambleWord,
        addUnscrambleWord,
    } = handlers;

    const baseFields = (
        <>
            <div className="cb-grid">
                <Field label="Title">
                    <input
                        className="cb-input"
                        value={question.title || ""}
                        onChange={(e) =>
                            updateQuestion(questionIndex, {
                                ...question,
                                title: e.target.value,
                            })
                        }
                        placeholder="Question title"
                    />
                </Field>

                <Field label="Instruction">
                    <input
                        className="cb-input"
                        value={question.instruction || ""}
                        onChange={(e) =>
                            updateQuestion(questionIndex, {
                                ...question,
                                instruction: e.target.value,
                            })
                        }
                        placeholder="Read carefully"
                    />
                </Field>

                <Field label="Points">
                    <input
                        className="cb-input"
                        type="number"
                        value={question.points ?? 10}
                        onChange={(e) =>
                            updateQuestion(questionIndex, {
                                ...question,
                                points: e.target.value,
                            })
                        }
                    />
                </Field>

                <Field label="Order">
                    <input
                        className="cb-input"
                        type="number"
                        value={question.order ?? questionIndex + 1}
                        onChange={(e) =>
                            updateQuestion(questionIndex, {
                                ...question,
                                order: e.target.value,
                            })
                        }
                    />
                </Field>
            </div>

            <div className="cb-mt-16">
                <Field label="Prompt">
                    <textarea
                        className="cb-textarea"
                        value={question.prompt || ""}
                        onChange={(e) =>
                            updateQuestion(questionIndex, {
                                ...question,
                                prompt: e.target.value,
                            })
                        }
                        placeholder="General prompt..."
                    />
                </Field>
            </div>
        </>
    );

    switch (question.type) {
        case "multiple-choice":
            return (
                <>
                    {baseFields}

                    <Field label="Question">
                        <textarea
                            className="cb-textarea"
                            value={question.question || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    question: e.target.value,
                                })
                            }
                            placeholder="What does this mean?"
                        />
                    </Field>

                    <div className="cb-grid cb-mt-16">
                        {(question.options || []).map((option, optionIndex) => (
                            <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                                <input
                                    className="cb-input"
                                    value={option}
                                    onChange={(e) =>
                                        updateQuestionOption(questionIndex, optionIndex, e.target.value)
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                />
                            </Field>
                        ))}
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Correct Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="Exact correct option"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain the answer..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "listening":
            return (
                <>
                    {baseFields}

                    <Field label="Audio URL">
                        <input
                            className="cb-input"
                            value={question.audio || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    audio: e.target.value,
                                })
                            }
                            placeholder="/uploads/listening.mp3"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <Field label="Question">
                            <textarea
                                className="cb-textarea"
                                value={question.question || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        question: e.target.value,
                                    })
                                }
                                placeholder="What did you hear?"
                            />
                        </Field>
                    </div>

                    <div className="cb-grid cb-mt-16">
                        {(question.options || []).map((option, optionIndex) => (
                            <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                                <input
                                    className="cb-input"
                                    value={option}
                                    onChange={(e) =>
                                        updateQuestionOption(questionIndex, optionIndex, e.target.value)
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                />
                            </Field>
                        ))}
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Correct Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="Correct option"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "fill-in-the-blank":
            return (
                <>
                    {baseFields}

                    <Field label="Sentence">
                        <input
                            className="cb-input"
                            value={question.sentence || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    sentence: e.target.value,
                                })
                            }
                            placeholder="I am ____ today."
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <Field label="Main Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="happy"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Acceptable Answers</div>
                        {(question.acceptableAnswers || []).map((item, answerIndex) => (
                            <div key={answerIndex} className="cb-mb-10">
                                <input
                                    className="cb-input"
                                    value={item}
                                    onChange={(e) =>
                                        updateAcceptableAnswer(
                                            questionIndex,
                                            answerIndex,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Alternative answer ${answerIndex + 1}`}
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            className="cb-btn-secondary"
                            onClick={() => addAcceptableAnswer(questionIndex)}
                        >
                            + Add Acceptable Answer
                        </button>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "match-pairs":
            return (
                <>
                    {baseFields}

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Pairs</div>
                        {(question.pairs || []).map((pair, pairIndex) => (
                            <div key={pairIndex} className="cb-grid cb-mb-10">
                                <Field label={`Left ${pairIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={pair.left || ""}
                                        onChange={(e) =>
                                            updateMatchPair(
                                                questionIndex,
                                                pairIndex,
                                                "left",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hello"
                                    />
                                </Field>

                                <Field label={`Right ${pairIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={pair.right || ""}
                                        onChange={(e) =>
                                            updateMatchPair(
                                                questionIndex,
                                                pairIndex,
                                                "right",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hola"
                                    />
                                </Field>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="cb-btn-secondary"
                            onClick={() => addMatchPair(questionIndex)}
                        >
                            + Add Pair
                        </button>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "translate-short-answer":
            return (
                <>
                    {baseFields}

                    <Field label="Source Text">
                        <input
                            className="cb-input"
                            value={question.sourceText || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    sourceText: e.target.value,
                                })
                            }
                            placeholder="Good morning"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <Field label="Main Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="Buenos días"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Acceptable Answers</div>
                        {(question.acceptableAnswers || []).map((item, answerIndex) => (
                            <div key={answerIndex} className="cb-mb-10">
                                <input
                                    className="cb-input"
                                    value={item}
                                    onChange={(e) =>
                                        updateAcceptableAnswer(
                                            questionIndex,
                                            answerIndex,
                                            e.target.value
                                        )
                                    }
                                    placeholder={`Alternative answer ${answerIndex + 1}`}
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            className="cb-btn-secondary"
                            onClick={() => addAcceptableAnswer(questionIndex)}
                        >
                            + Add Acceptable Answer
                        </button>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "image-choice":
            return (
                <>
                    {baseFields}

                    <Field label="Image URL">
                        <input
                            className="cb-input"
                            value={question.image || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    image: e.target.value,
                                })
                            }
                            placeholder="/uploads/image-question.png"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <Field label="Question">
                            <textarea
                                className="cb-textarea"
                                value={question.question || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        question: e.target.value,
                                    })
                                }
                                placeholder="What is in the image?"
                            />
                        </Field>
                    </div>

                    <div className="cb-grid cb-mt-16">
                        {(question.options || []).map((option, optionIndex) => (
                            <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                                <input
                                    className="cb-input"
                                    value={option}
                                    onChange={(e) =>
                                        updateQuestionOption(questionIndex, optionIndex, e.target.value)
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                />
                            </Field>
                        ))}
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Correct Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="Apple"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "unscramble":
            return (
                <>
                    {baseFields}

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Words</div>
                        <div className="cb-grid">
                            {(question.words || []).map((word, wordIndex) => (
                                <Field key={wordIndex} label={`Word ${wordIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={word}
                                        onChange={(e) =>
                                            updateUnscrambleWord(
                                                questionIndex,
                                                wordIndex,
                                                e.target.value
                                            )
                                        }
                                        placeholder="are"
                                    />
                                </Field>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="cb-btn-secondary"
                            onClick={() => addUnscrambleWord(questionIndex)}
                        >
                            + Add Word
                        </button>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Correct Answer">
                            <input
                                className="cb-input"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="How are you?"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Explain..."
                            />
                        </Field>
                    </div>
                </>
            );

        case "speaking":
            return (
                <>
                    {baseFields}

                    <Field label="Target Text">
                        <input
                            className="cb-input"
                            value={question.targetText || ""}
                            onChange={(e) =>
                                updateQuestion(questionIndex, {
                                    ...question,
                                    targetText: e.target.value,
                                })
                            }
                            placeholder="Hello, nice to meet you"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <Field label="Hint">
                            <textarea
                                className="cb-textarea"
                                value={question.hint || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        hint: e.target.value,
                                    })
                                }
                                placeholder="Pronunciation hint..."
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Expected Answer / Notes">
                            <textarea
                                className="cb-textarea"
                                value={question.answer || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        answer: e.target.value,
                                    })
                                }
                                placeholder="What counts as correct?"
                            />
                        </Field>
                    </div>

                    <div className="cb-mt-16">
                        <Field label="Explanation">
                            <textarea
                                className="cb-textarea"
                                value={question.explanation || ""}
                                onChange={(e) =>
                                    updateQuestion(questionIndex, {
                                        ...question,
                                        explanation: e.target.value,
                                    })
                                }
                                placeholder="Notes..."
                            />
                        </Field>
                    </div>
                </>
            );

        default:
            return <div>Unsupported question type</div>;
    }
}