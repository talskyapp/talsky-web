import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/config";
import axios from "axios";
import UserProfile from "../components/UserProfile";

export default function UserProfilePage() {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/users/${id}`);
                setUser(res.data);
            } catch (error) {
                console.log("Error loading user profile:", error);
            }
        };

        fetchUser();
    }, [id]);

    return (
        <div>
            {user ? <UserProfile user={user} /> : <p>Loading...</p>}
        </div>
    );
}