import React, { useEffect, useState } from "react";
import axios from "axios";
import CoursesTab from "./CoursesTab";
import ModulesTab from "./ModulesTab";
import LessonsTab from "./LessonsTab";
import ModuleTestsTab from "./ModuleTestsTab";
import { API_URL } from "../../lib/config";

const tabList = [
    { key: "courses", label: "Courses" },
    { key: "modules", label: "Modules" },
    { key: "lessons", label: "Lessons" },
    { key: "module-tests", label: "Module Tests" },
];

const emptyCourseData = {
    name: "",
    track: "",
    goal: "",
    level: "",
    language: "",
    description: "",
    icon: "📘",
    order: 1,
};

const emptyModuleData = {
    courseId: "",
    name: "",
    description: "",
    order: 1,
};

export default function CourseBuilder() {
    const [tab, setTab] = useState("courses");
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [saving, setSaving] = useState(false);

    const [courseData, setCourseData] = useState(emptyCourseData);
    const [moduleData, setModuleData] = useState(emptyModuleData);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoadingCourses(true);
            const res = await axios.get(`${API_URL}/api/courses`);
            setCourses(Array.isArray(res.data) ? res.data : res.data.courses || []);
        } catch (error) {
            console.error("Error fetching courses:", error);
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const createCourse = async () => {
        try {
            setSaving(true);

            await axios.post(`${API_URL}/api/courses`, {
                ...courseData,
                order: Number(courseData.order),
            });

            alert("Course created!");
            setCourseData(emptyCourseData);
            fetchCourses();
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course");
        } finally {
            setSaving(false);
        }
    };

    const createModule = async () => {
        try {
            setSaving(true);

            await axios.post(`${API_URL}/api/modules`, {
                ...moduleData,
                order: Number(moduleData.order),
            });

            alert("Module created!");
            setModuleData(emptyModuleData);
        } catch (error) {
            console.error("Error creating module:", error);
            alert("Failed to create module");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="cb-page">
            <div className="cb-shell">
                <div className="cb-header">
                    <h1 className="cb-title">Course Builder Pro</h1>
                    <p className="cb-subtitle">
                        Create courses, modules, and dynamic lessons with a modern admin UI.
                    </p>
                </div>

                <div className="cb-tabs">
                    {tabList.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            className={`cb-tab ${tab === item.key ? "active" : ""}`}
                            onClick={() => setTab(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {loadingCourses ? (
                    <div className="cb-card">Loading courses...</div>
                ) : (
                    <>
                        {tab === "courses" && (
                            <CoursesTab
                                courseData={courseData}
                                setCourseData={setCourseData}
                                createCourse={createCourse}
                                saving={saving}
                            />
                        )}

                        {tab === "modules" && (
                            <ModulesTab
                                courses={courses}
                                moduleData={moduleData}
                                setModuleData={setModuleData}
                                createModule={createModule}
                                saving={saving}
                            />
                        )}

                        {tab === "lessons" && (
                            <LessonsTab
                                courses={courses}
                                apiUrl={API_URL}
                            />
                        )}

                        {tab === "module-tests" && (
                            <ModuleTestsTab
                                courses={courses}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}