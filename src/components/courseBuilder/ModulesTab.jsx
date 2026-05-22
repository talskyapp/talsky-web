import React from "react";
import Field from "./Field";

export default function ModulesTab({
    courses,
    moduleData,
    setModuleData,
    createModule,
    saving,
}) {
    return (
        <div className="cb-card">
            <h2 className="cb-section-title">Create Module</h2>
            <p className="cb-section-text">
                Organize your course into clear learning blocks.
            </p>

            <div className="cb-grid">
                <Field label="Course">
                    <select
                        className="cb-input"
                        value={moduleData.courseId}
                        onChange={(e) => setModuleData({ ...moduleData, courseId: e.target.value })}
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

                <Field label="Module Name">
                    <input
                        className="cb-input"
                        value={moduleData.name}
                        onChange={(e) => setModuleData({ ...moduleData, name: e.target.value })}
                        placeholder="Module 1: Foundations"
                    />
                </Field>

                <Field label="Order">
                    <input
                        className="cb-input"
                        type="number"
                        value={moduleData.order}
                        onChange={(e) => setModuleData({ ...moduleData, order: e.target.value })}
                    />
                </Field>
            </div>

            <div className="cb-mt-16">
                <Field label="Description">
                    <textarea
                        className="cb-textarea"
                        value={moduleData.description}
                        onChange={(e) =>
                            setModuleData({ ...moduleData, description: e.target.value })
                        }
                        placeholder="What is this module about?"
                    />
                </Field>
            </div>

            <button className="cb-btn-primary" onClick={createModule} disabled={saving}>
                {saving ? "Saving..." : "Create Module"}
            </button>
        </div>
    );
}