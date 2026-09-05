import { Navigate, Outlet } from "react-router-dom";

export default function RequireAiTutorAccess() {
    const betaOnly =
        import.meta.env.VITE_AI_TUTOR_BETA_ONLY !== "false";

    if (!betaOnly) {
        return <Outlet />;
    }

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        user = null;
    }

    const testerAccess = user?.testerAccess;

    const hasNotExpired =
        !testerAccess?.expiresAt ||
        new Date(testerAccess.expiresAt).getTime() > Date.now();

    const hasAccess =
        user?.isAdmin === true ||
        (
            testerAccess?.enabled === true &&
            testerAccess?.aiTutor === true &&
            hasNotExpired
        );

    if (!hasAccess) {
        return (
            <Navigate
                to="/dashboard/home"
                replace
                state={{ aiTutorAccessDenied: true }}
            />
        );
    }

    return <Outlet />;
}