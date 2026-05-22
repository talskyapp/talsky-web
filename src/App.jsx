import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getSocket } from "./socket";
import { API_URL } from "./lib/config";

const socket = getSocket();
window.socket = socket;

/* PAGES */
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Feed from "./pages/Feed";
import Pricing from "./pages/Pricing";
import PricingSuccess from "./pages/PricingSuccess";
import Learn from "./pages/Learn";
import AITutorPage from "./pages/AITutorPage";
import AIChatPage from "./pages/AIChatPage";
import MyCardsPage from "./pages/MyCardsPage";
import CardsReviewPage from "./pages/CardsReviewPage";
import LessonPlayer from "./pages/LessonPlayer";
import ModuleTestPlayer from "./pages/ModuleTestPlayer";
import Course from "./pages/Course";
import CourseHub from "./pages/CourseHub";
import SavedWords from "./pages/SaveWords";
import DifficultWords from "./pages/DifficultWords";
import CourseBuilderPage from "./pages/CourseBuilderPage";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import CreateProfile from "./pages/CreateProfile";
import UserProfilePage from "./pages/UserProfilePage";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import SettingsPage from "./pages/SettingsPage";
import NotificationsSettings from "./pages/NotificationsSettings";
import NotificationsPage from "./pages/NotificationsPage";
import PrivacySafetyPage from "./pages/PrivacySafetyPage";
import BlockedUsersPage from "./pages/BlockedUsersPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import DeactivateAccountPage from "./pages/DeactivateAccountPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import HelpPage from "./pages/HelpPage";
import ChatPage from "./pages/ChatPage";
import AppLanguagePage from "./pages/AppLanguagePage";
import NearbyPermission from "./pages/NearbyPermission";
import NearbyMap from "./pages/NearbyMap";
import UpdateLocation from "./pages/UpdateLocation";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptionsPage";
import AdminVerificationsPage from "./pages/admin/AdminVerificationsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminModerationLogsPage from "./pages/admin/AdminModerationLogsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

/* COMPONENTS */
import ProtectedRoute from "./components/ProtectedRoute";

/* LAYOUTS */
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [socketReady, setSocketReady] = useState(false);

    useEffect(() => {
        const syncToken = () => {
            setToken(localStorage.getItem("token"));
        };

        window.addEventListener("storage", syncToken);
        window.addEventListener("focus", syncToken);

        return () => {
            window.removeEventListener("storage", syncToken);
            window.removeEventListener("focus", syncToken);
        };
    }, []);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const interval = setInterval(() => {
            fetch(`${API_URL}/api/users/heartbeat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }).catch(() => { });
        }, 20000);

        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (!token) {
            setSocketReady(false);
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const myId = payload?.id;

            if (!myId) return;

            socket.emit("register_user", myId);

            const handleRegistered = () => {
                console.log("✔ Socket registered");
                setSocketReady(true);
            };

            socket.on("registered", handleRegistered);

            return () => {
                socket.off("registered", handleRegistered);
            };
        } catch (err) {
            console.error("Invalid token payload:", err);
            setSocketReady(false);
        }
    }, [token]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* rutas legales públicas */}
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />

                <Route
                    path="/onboarding"
                    element={
                        <ProtectedRoute>
                            <Onboarding />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout />
                        </AdminRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />

                    <Route
                        path="users"
                        element={<AdminUsersPage />}
                    />

                    <Route
                        path="subscriptions"
                        element={<AdminSubscriptionsPage />}
                    />

                    <Route
                        path="verifications"
                        element={<AdminVerificationsPage />}
                    />

                    <Route
                        path="reports"
                        element={<AdminReportsPage />}
                    />

                    <Route
                        path="moderation-logs"
                        element={<AdminModerationLogsPage />} />
                </Route>

                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="feed" element={<Feed />} />
                    <Route path="profile" element={<MyProfile />} />
                    <Route path="profile/:id" element={<UserProfilePage />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="pricing/success" element={<PricingSuccess />} />
                    <Route path="learn" element={<Learn />} />
                    <Route path="ai-tutor" element={<AITutorPage />} />
                    <Route path="ai-chat" element={<AIChatPage />} />
                    <Route path="cards" element={<MyCardsPage />} />
                    <Route path="cards/review" element={<CardsReviewPage />} />
                    <Route path="learn/course" element={<Course />} />
                    <Route path="course-hub" element={<CourseHub />} />
                    <Route path="course-hub/saved-words" element={<SavedWords />} />
                    <Route path="course-hub/difficult-words" element={<DifficultWords />} />
                    <Route path="learn/lesson/:lessonId" element={<LessonPlayer />} />
                    <Route path="learn/module-test/:testId" element={<ModuleTestPlayer />} />
                    <Route path="course-builder" element={<CourseBuilderPage />} />
                    <Route path="community" element={<Community />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    <Route path="create-profile" element={<CreateProfile />} />
                    <Route path="profile/edit" element={<EditProfile />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="settings/language" element={<AppLanguagePage />} />
                    <Route path="settings/privacy" element={<PrivacySafetyPage />} />
                    <Route path="settings/blocked-users" element={<BlockedUsersPage />} />
                    <Route path="settings/change-password" element={<ChangePasswordPage />} />
                    <Route path="settings/deactivate-account" element={<DeactivateAccountPage />} />
                    <Route path="settings/delete-account" element={<DeleteAccountPage />} />
                    <Route path="settings/help" element={<HelpPage />} />
                    <Route path="settings/notifications" element={<NotificationsSettings />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="nearby-permission" element={<NearbyPermission />} />
                    <Route path="nearby-map" element={<NearbyMap />} />
                    <Route path="update-location" element={<UpdateLocation />} />
                    <Route
                        path="chat-v2"
                        element={<ChatPage socketReady={socketReady} />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;