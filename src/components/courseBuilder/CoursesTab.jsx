import React from "react";
import Field from "./Field";

export default function CoursesTab({
    courseData,
    setCourseData,
    createCourse,
    saving,
}) {
    return (
        <div className="cb-card">
            <h2 className="cb-section-title">Create Course</h2>
            <p className="cb-section-text">
                Build the main course with track, level, language, and branding.
            </p>

            <div className="cb-grid">
                <Field label="Course Name">
                    <input
                        className="cb-input"
                        value={courseData.name}
                        onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
                        placeholder="Complete Korean Course"
                    />
                </Field>

                <Field label="Track Name">
                    <input
                        className="cb-input"
                        value={courseData.track}
                        onChange={(e) => setCourseData({ ...courseData, track: e.target.value })}
                        placeholder="Complete Course"
                    />
                </Field>

                <Field label="Goal">
                    <select
                        className="cb-input"
                        value={courseData.goal}
                        onChange={(e) => setCourseData({ ...courseData, goal: e.target.value })}
                    >
                        <option value="">Select Goal</option>
                        <option value="Travel">Travel</option>
                        <option value="Conversation">Conversation</option>
                        <option value="Work">Work</option>
                        <option value="Culture">Culture</option>
                        <option value="General">General</option>
                    </select>
                </Field>

                <Field label="Level">
                    <select
                        className="cb-input"
                        value={courseData.level}
                        onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
                    >
                        <option value="">Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </Field>

                <Field label="Language">
                    <input
                        className="cb-input"
                        value={courseData.language}
                        onChange={(e) => setCourseData({ ...courseData, language: e.target.value })}
                        placeholder="Korean"
                    />
                </Field>

                <Field label="Icon">
                    <input
                        className="cb-input"
                        value={courseData.icon}
                        onChange={(e) => setCourseData({ ...courseData, icon: e.target.value })}
                        placeholder="📘"
                    />
                </Field>

                <Field label="Order">
                    <input
                        className="cb-input"
                        type="number"
                        value={courseData.order}
                        onChange={(e) => setCourseData({ ...courseData, order: e.target.value })}
                    />
                </Field>
            </div>

            <div className="cb-mt-16">
                <Field label="Description">
                    <textarea
                        className="cb-textarea"
                        value={courseData.description}
                        onChange={(e) =>
                            setCourseData({ ...courseData, description: e.target.value })
                        }
                        placeholder="Describe what students will learn in this course..."
                    />
                </Field>
            </div>

            <button className="cb-btn-primary" onClick={createCourse} disabled={saving}>
                {saving ? "Saving..." : "Create Course"}
            </button>
        </div>
    );
}