import React from "react";
import Field from "./Field";

export default function LessonStepEditor({ step, stepIndex, apiUrl, handlers }) {
    const {
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
    } = handlers;

    switch (step.type) {
        case "intro":
            return (
                <>
                    <Field label="Headline">
                        <input
                            className="cb-input"
                            value={step.content?.headline || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, {
                                    ...step,
                                    content: { ...step.content, headline: e.target.value },
                                })
                            }
                            placeholder="In less than 5 minutes..."
                        />
                    </Field>

                    <Field label="Text">
                        <textarea
                            className="cb-textarea"
                            value={step.content?.text || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, {
                                    ...step,
                                    content: { ...step.content, text: e.target.value },
                                })
                            }
                            placeholder="You will learn how to greet people..."
                        />
                    </Field>
                </>
            );

        case "vocabulary":
            return (
                <>
                    {(step.items || []).map((item, itemIndex) => (
                        <div key={itemIndex} className="cb-inner-card">
                            <div className="cb-grid">
                                <Field label="Word / Phrase">
                                    <input
                                        className="cb-input"
                                        value={item.text}
                                        onChange={(e) =>
                                            updateVocabularyItem(stepIndex, itemIndex, "text", e.target.value)
                                        }
                                        placeholder="Hello"
                                    />
                                </Field>

                                <Field label="Translation">
                                    <input
                                        className="cb-input"
                                        value={item.translation}
                                        onChange={(e) =>
                                            updateVocabularyItem(
                                                stepIndex,
                                                itemIndex,
                                                "translation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hola"
                                    />
                                </Field>

                                <Field label="Pronunciation">
                                    <input
                                        className="cb-input"
                                        value={item.pronunciation || ""}
                                        onChange={(e) =>
                                            updateVocabularyItem(
                                                stepIndex,
                                                itemIndex,
                                                "pronunciation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="/gud MÓR-ning/"
                                    />
                                </Field>

                                <Field label="Usage Note">
                                    <textarea
                                        className="cb-textarea"
                                        value={item.note || ""}
                                        onChange={(e) =>
                                            updateVocabularyItem(stepIndex, itemIndex, "note", e.target.value)
                                        }
                                        placeholder="Formal or neutral greeting used in the morning..."
                                    />
                                </Field>

                                <Field label="Example in English">
                                    <input
                                        className="cb-input"
                                        value={item.example?.english || ""}
                                        onChange={(e) =>
                                            updateVocabularyExample(
                                                stepIndex,
                                                itemIndex,
                                                "english",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hello, my name is Anna."
                                    />
                                </Field>

                                <Field label="Example Translation">
                                    <input
                                        className="cb-input"
                                        value={item.example?.translation || ""}
                                        onChange={(e) =>
                                            updateVocabularyExample(
                                                stepIndex,
                                                itemIndex,
                                                "translation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hola, mi nombre es Anna."
                                    />
                                </Field>
                            </div>

                            <div className="cb-grid cb-mt-16">
                                <Field label="Upload Image">
                                    <input
                                        className="cb-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleVocabularyImageUpload(
                                                stepIndex,
                                                itemIndex,
                                                e.target.files?.[0]
                                            )
                                        }
                                    />
                                </Field>

                                <Field label="Upload Audio">
                                    <input
                                        className="cb-input"
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) =>
                                            handleVocabularyAudioUpload(
                                                stepIndex,
                                                itemIndex,
                                                e.target.files?.[0]
                                            )
                                        }
                                    />
                                </Field>
                            </div>

                            {(item.imagePreview || item.audioPreview || item.image || item.audio) && (
                                <div className="cb-upload-preview-row">
                                    {(item.imagePreview || typeof item.image === "string") && (
                                        <div className="cb-upload-preview-card">
                                            <div className="cb-upload-preview-label">Image Preview</div>
                                            <img
                                                src={
                                                    item.imagePreview
                                                        ? item.imagePreview
                                                        : `${apiUrl}${item.image}`
                                                }
                                                alt={item.text || "preview"}
                                                className="cb-upload-image-preview"
                                            />
                                            <button
                                                type="button"
                                                className="cb-btn-secondary"
                                                onClick={() => removeVocabularyImage(stepIndex, itemIndex)}
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}

                                    {(item.audioPreview || typeof item.audio === "string") && (
                                        <div className="cb-upload-preview-card">
                                            <div className="cb-upload-preview-label">Audio Preview</div>
                                            <audio
                                                key={item.audioPreview || item.audio}
                                                controls
                                                preload="metadata"
                                                className="cb-upload-audio-preview"
                                            >
                                                <source
                                                    src={
                                                        item.audioPreview
                                                            ? item.audioPreview
                                                            : `${apiUrl}${item.audio}`
                                                    }
                                                />
                                                Your browser does not support audio playback.
                                            </audio>
                                            <button
                                                type="button"
                                                className="cb-btn-secondary"
                                                onClick={() => removeVocabularyAudio(stepIndex, itemIndex)}
                                            >
                                                Remove audio
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                className="cb-btn-secondary"
                                type="button"
                                onClick={() => addVocabularyItem(stepIndex)}
                            >
                                + Add Vocabulary Item
                            </button>
                        </div>
                    ))}
                </>
            );

        case "theory":
            return (
                <Field label="Theory Text">
                    <textarea
                        className="cb-textarea"
                        value={step.content?.text || ""}
                        onChange={(e) =>
                            updateStep(stepIndex, {
                                ...step,
                                content: { ...step.content, text: e.target.value },
                            })
                        }
                        placeholder="Hi is informal, Hello is more formal..."
                    />
                </Field>
            );

        case "multiple-choice":
        case "listening":
            return (
                <>
                    {step.type === "listening" && (
                        <Field label="Audio URL / file name">
                            <input
                                className="cb-input"
                                value={step.audio || ""}
                                onChange={(e) =>
                                    updateStep(stepIndex, { ...step, audio: e.target.value })
                                }
                                placeholder="good-morning.mp3"
                            />
                        </Field>
                    )}

                    <Field label="Question">
                        <input
                            className="cb-input"
                            value={step.question || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, question: e.target.value })
                            }
                            placeholder="What does 'Hello' mean?"
                        />
                    </Field>

                    <div className="cb-grid">
                        {(step.options || []).map((opt, optionIndex) => (
                            <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                                <input
                                    className="cb-input"
                                    value={opt}
                                    onChange={(e) =>
                                        updateStepOption(stepIndex, optionIndex, e.target.value)
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                />
                            </Field>
                        ))}
                    </div>

                    <Field label="Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="Hola"
                        />
                    </Field>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain why this is correct..."
                        />
                    </Field>
                </>
            );

        case "speaking":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Say: Hello"
                        />
                    </Field>

                    <Field label="Target Text">
                        <input
                            className="cb-input"
                            value={step.targetText || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, targetText: e.target.value })
                            }
                            placeholder="Hello"
                        />
                    </Field>

                    <Field label="Hint">
                        <textarea
                            className="cb-textarea"
                            value={step.hint || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, hint: e.target.value })
                            }
                            placeholder="Open your mouth softly for the h sound..."
                        />
                    </Field>
                </>
            );

        case "conversation":
            return (
                <>
                    {(step.messages || []).map((msg, msgIndex) => (
                        <div key={msgIndex} className="cb-inner-card">
                            <div className="cb-grid">
                                <Field label="From">
                                    <select
                                        className="cb-input"
                                        value={msg.from}
                                        onChange={(e) =>
                                            updateConversationMessage(
                                                stepIndex,
                                                msgIndex,
                                                "from",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="bot">Bot</option>
                                        <option value="user">User</option>
                                    </select>
                                </Field>
                            </div>

                            {msg.from === "bot" ? (
                                <Field label="Bot Message">
                                    <input
                                        className="cb-input"
                                        value={msg.text || ""}
                                        onChange={(e) =>
                                            updateConversationMessage(
                                                stepIndex,
                                                msgIndex,
                                                "text",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Hello!"
                                    />
                                </Field>
                            ) : (
                                <div>
                                    <div className="cb-label cb-mb-8">User Options</div>

                                    {(msg.options || []).map((opt, optionIndex) => (
                                        <div key={optionIndex} className="cb-mb-10">
                                            <input
                                                className="cb-input"
                                                value={opt}
                                                onChange={(e) =>
                                                    updateConversationOption(
                                                        stepIndex,
                                                        msgIndex,
                                                        optionIndex,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Option ${optionIndex + 1}`}
                                            />
                                        </div>
                                    ))}

                                    <button
                                        className="cb-btn-secondary"
                                        type="button"
                                        onClick={() => addConversationOption(stepIndex, msgIndex)}
                                    >
                                        + Add User Option
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="cb-flex-wrap">
                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addConversationMessage(stepIndex, "bot")}
                        >
                            + Add Bot Message
                        </button>

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addConversationMessage(stepIndex, "user")}
                        >
                            + Add User Choice
                        </button>
                    </div>
                </>
            );

        case "fill-in-the-blank":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Complete the missing word"
                        />
                    </Field>

                    <Field label="Sentence / Pattern">
                        <input
                            className="cb-input"
                            value={step.sentence || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, sentence: e.target.value })
                            }
                            placeholder="I'm _____, thanks."
                        />
                    </Field>

                    <Field label="Main Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="fine"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Acceptable Answers</div>
                        {(step.acceptableAnswers || []).map((item, answerIndex) => (
                            <div key={answerIndex} className="cb-mb-10">
                                <input
                                    className="cb-input"
                                    value={item}
                                    onChange={(e) =>
                                        updateAcceptableAnswer(stepIndex, answerIndex, e.target.value)
                                    }
                                    placeholder={`Alternative answer ${answerIndex + 1}`}
                                />
                            </div>
                        ))}

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addAcceptableAnswer(stepIndex)}
                        >
                            + Add Acceptable Answer
                        </button>
                    </div>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain why this answer is correct..."
                        />
                    </Field>
                </>
            );

        case "letter-bank":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Complete the word"
                        />
                    </Field>

                    <Field label="Template">
                        <input
                            className="cb-input"
                            value={step.template || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, template: e.target.value })
                            }
                            placeholder="g__d mor___g"
                        />
                    </Field>

                    <Field label="Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="good morning"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Letter Bank</div>
                        <div className="cb-grid">
                            {(step.letters || []).map((letter, letterIndex) => (
                                <Field key={letterIndex} label={`Letter ${letterIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={letter}
                                        onChange={(e) =>
                                            updateLetterBankLetter(stepIndex, letterIndex, e.target.value)
                                        }
                                        placeholder="o"
                                    />
                                </Field>
                            ))}
                        </div>

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addLetterBankLetter(stepIndex)}
                        >
                            + Add Letter
                        </button>
                    </div>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain the correct spelling..."
                        />
                    </Field>
                </>
            );

        case "unscramble":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Put the sentence in the correct order"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Shuffled Words</div>
                        <div className="cb-grid">
                            {(step.words || []).map((word, wordIndex) => (
                                <Field key={wordIndex} label={`Word ${wordIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={word}
                                        onChange={(e) =>
                                            updateUnscrambleWord(stepIndex, wordIndex, e.target.value)
                                        }
                                        placeholder="how"
                                    />
                                </Field>
                            ))}
                        </div>

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addUnscrambleWord(stepIndex)}
                        >
                            + Add Word
                        </button>
                    </div>

                    <Field label="Correct Sentence">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="How are you?"
                        />
                    </Field>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain the sentence order..."
                        />
                    </Field>
                </>
            );

        case "match-pairs":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Match the words with their translations"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Pairs</div>
                        {(step.pairs || []).map((pair, pairIndex) => (
                            <div key={pairIndex} className="cb-grid cb-mb-10">
                                <Field label={`Left ${pairIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={pair.left}
                                        onChange={(e) =>
                                            updateMatchPair(stepIndex, pairIndex, "left", e.target.value)
                                        }
                                        placeholder="Hello"
                                    />
                                </Field>

                                <Field label={`Right ${pairIndex + 1}`}>
                                    <input
                                        className="cb-input"
                                        value={pair.right}
                                        onChange={(e) =>
                                            updateMatchPair(stepIndex, pairIndex, "right", e.target.value)
                                        }
                                        placeholder="Hola"
                                    />
                                </Field>
                            </div>
                        ))}

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addMatchPair(stepIndex)}
                        >
                            + Add Pair
                        </button>
                    </div>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain the matches..."
                        />
                    </Field>
                </>
            );

        case "translate-short-answer":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Translate this sentence"
                        />
                    </Field>

                    <Field label="Source Text">
                        <input
                            className="cb-input"
                            value={step.sourceText || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, sourceText: e.target.value })
                            }
                            placeholder="Good morning"
                        />
                    </Field>

                    <Field label="Main Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="Buenos días"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Acceptable Answers</div>
                        {(step.acceptableAnswers || []).map((item, answerIndex) => (
                            <div key={answerIndex} className="cb-mb-10">
                                <input
                                    className="cb-input"
                                    value={item}
                                    onChange={(e) =>
                                        updateAcceptableAnswer(stepIndex, answerIndex, e.target.value)
                                    }
                                    placeholder={`Alternative answer ${answerIndex + 1}`}
                                />
                            </div>
                        ))}

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addAcceptableAnswer(stepIndex)}
                        >
                            + Add Acceptable Answer
                        </button>
                    </div>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain the translation..."
                        />
                    </Field>
                </>
            );

        case "listening-type":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="Listen and type what you hear"
                        />
                    </Field>

                    <Field label="Audio URL / file name">
                        <input
                            className="cb-input"
                            value={step.audio || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, audio: e.target.value })
                            }
                            placeholder="hello-audio.mp3"
                        />
                    </Field>

                    <Field label="Main Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="Hello"
                        />
                    </Field>

                    <div className="cb-mt-16">
                        <div className="cb-label cb-mb-8">Acceptable Answers</div>
                        {(step.acceptableAnswers || []).map((item, answerIndex) => (
                            <div key={answerIndex} className="cb-mb-10">
                                <input
                                    className="cb-input"
                                    value={item}
                                    onChange={(e) =>
                                        updateAcceptableAnswer(stepIndex, answerIndex, e.target.value)
                                    }
                                    placeholder={`Alternative answer ${answerIndex + 1}`}
                                />
                            </div>
                        ))}

                        <button
                            className="cb-btn-secondary"
                            type="button"
                            onClick={() => addAcceptableAnswer(stepIndex)}
                        >
                            + Add Acceptable Answer
                        </button>
                    </div>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain what the learner should hear..."
                        />
                    </Field>
                </>
            );

        case "image-choice":
            return (
                <>
                    <Field label="Prompt">
                        <input
                            className="cb-input"
                            value={step.prompt || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, prompt: e.target.value })
                            }
                            placeholder="What is this?"
                        />
                    </Field>

                    <Field label="Image URL / path">
                        <input
                            className="cb-input"
                            value={step.image || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, image: e.target.value })
                            }
                            placeholder="/uploads/apple.png"
                        />
                    </Field>

                    <div className="cb-grid">
                        {(step.options || []).map((opt, optionIndex) => (
                            <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                                <input
                                    className="cb-input"
                                    value={opt}
                                    onChange={(e) =>
                                        updateStepOption(stepIndex, optionIndex, e.target.value)
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                />
                            </Field>
                        ))}
                    </div>

                    <Field label="Correct Answer">
                        <input
                            className="cb-input"
                            value={step.answer || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, answer: e.target.value })
                            }
                            placeholder="Apple"
                        />
                    </Field>

                    <Field label="Explanation">
                        <textarea
                            className="cb-textarea"
                            value={step.explanation || ""}
                            onChange={(e) =>
                                updateStep(stepIndex, { ...step, explanation: e.target.value })
                            }
                            placeholder="Explain why this image matches the answer..."
                        />
                    </Field>
                </>
            );

        default:
            return <div>Unsupported step type</div>;
    }
}