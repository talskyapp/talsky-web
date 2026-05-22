import { useOutletContext } from "react-router-dom";
import Learn from "./Learn";
import Course from "./Course";

export default function LearnEntry() {
    const { user } = useOutletContext();

    if (user?.courseActivated) {
        return <Course />;
    }

    return <Learn />;
}