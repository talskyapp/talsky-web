import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles } from "lucide-react";
import { API_URL } from "../lib/config";
import countries from "../data/countries";
import "../styles/CreateProfile.css";

const MAX_BIO_LENGTH = 180;

export default function CreateProfile() {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(storedUser?.photo || "");
    const [bio, setBio] = useState("");
    const [country, setCountry] = useState("");
    const [birthday, setBirthday] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    const today = useMemo(() => {
        return new Date().toISOString().split("T")[0];
    }, []);

    const validateForm = () => {
        const errors = {};

        if (!bio.trim()) {
            errors.bio = "Please write a short bio.";
        } else if (bio.trim().length < 10) {
            errors.bio = "Your bio should be at least 10 characters.";
        }

        if (!country) {
            errors.country = "Please select your country of birth.";
        }

        if (!birthday) {
            errors.birthday = "Please select your birthday.";
        } else {
            const birthDate = new Date(birthday);
            const now = new Date();

            if (birthDate > now) {
                errors.birthday = "Birthday cannot be in the future.";
            } else {
                let age = now.getFullYear() - birthDate.getFullYear();
                const monthDiff = now.getMonth() - birthDate.getMonth();

                if (
                    monthDiff < 0 ||
                    (monthDiff === 0 && now.getDate() < birthDate.getDate())
                ) {
                    age--;
                }

                if (age < 18) {
                    errors.birthday = "You must be at least 18 years old.";
                }
            }
        }

        if (photoFile) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "image/gif",
            ];
            const maxSize = 5 * 1024 * 1024;

            if (!allowedTypes.includes(photoFile.type)) {
                errors.photo = "Please upload a JPG, PNG, WEBP, or GIF image.";
            }

            if (photoFile.size > maxSize) {
                errors.photo = "Image must be smaller than 5MB.";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setFieldErrors((prev) => ({ ...prev, photo: "" }));

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
        ];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setFieldErrors((prev) => ({
                ...prev,
                photo: "Please upload a JPG, PNG, WEBP, or GIF image.",
            }));
            return;
        }

        if (file.size > maxSize) {
            setFieldErrors((prev) => ({
                ...prev,
                photo: "Image must be smaller than 5MB.",
            }));
            return;
        }

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview("");
        setFieldErrors((prev) => ({ ...prev, photo: "" }));
    };

    const handleBioChange = (e) => {
        const value = e.target.value;

        if (value.length <= MAX_BIO_LENGTH) {
            setBio(value);

            if (fieldErrors.bio) {
                setFieldErrors((prev) => ({ ...prev, bio: "" }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        try {
            setLoading(true);

            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append("bio", bio.trim());
            formData.append("country", country);
            formData.append("birthday", birthday);
            formData.append("profileCompleted", "true");

            if (photoFile) {
                formData.append("photo", photoFile);
            }

            const res = await fetch(`${API_URL}/api/users/me`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.msg || "Something went wrong.");
                return;
            }

            localStorage.setItem("user", JSON.stringify(data));
            navigate("/");
        } catch (err) {
            console.error("PROFILE SETUP ERROR:", err);
            setError("Error updating profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cp-wrapper">
            <div className="cp-card">
                <div className="cp-header">
                    <span className="cp-step">Final step</span>
                    <h1>Create your profile</h1>
                    <p>Complete your profile to start connecting and learning.</p>
                </div>

                <form onSubmit={handleSubmit} className="cp-form">
                    <div className="cp-field">
                        <label>Profile photo</label>
                        <p className="cp-help">
                            Add a friendly photo so people can recognize you in chats and nearby.
                        </p>

                        <label className="cp-photo-hero">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                onChange={handlePhotoChange}
                                hidden
                            />

                            <div className="cp-avatar-ring">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" />
                                ) : (
                                    <div className="cp-avatar-placeholder">
                                        {storedUser?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                )}

                                <div className="cp-camera-badge">
                                    <Camera size={18} />
                                </div>
                            </div>

                            <span className="cp-photo-title">
                                {photoPreview ? "Change profile photo" : "Upload profile photo"}
                            </span>
                        </label>

                        {photoPreview ? (
                            <button
                                type="button"
                                className="cp-remove-btn"
                                onClick={handleRemovePhoto}
                            >
                                ✕ Remove photo
                            </button>
                        ) : null}

                        {fieldErrors.photo ? (
                            <div className="cp-field-error">{fieldErrors.photo}</div>
                        ) : null}
                    </div>

                    <div className="cp-field">
                        <label>About you</label>
                        <p className="cp-help">
                            Tell people a little about yourself, your interests, or the language
                            you&apos;re learning.
                        </p>

                        <textarea
                            placeholder="I love languages, culture, and meeting new people..."
                            value={bio}
                            onChange={handleBioChange}
                            maxLength={MAX_BIO_LENGTH}
                        />

                        <div className="cp-field-footer">
                            {fieldErrors.bio ? (
                                <span className="cp-field-error">{fieldErrors.bio}</span>
                            ) : (
                                <span className="cp-help">Keep it short and natural.</span>
                            )}

                            <span className="cp-counter">
                                {bio.length}/{MAX_BIO_LENGTH}
                            </span>
                        </div>
                    </div>

                    <div className="cp-field">
                        <label>Country</label>
                        <p className="cp-help">Select your country of birth.</p>

                        <select
                            value={country}
                            onChange={(e) => {
                                setCountry(e.target.value);
                                if (fieldErrors.country) {
                                    setFieldErrors((prev) => ({ ...prev, country: "" }));
                                }
                            }}
                        >
                            <option value="">Select your country of birth</option>
                            {countries.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        {fieldErrors.country ? (
                            <div className="cp-field-error">{fieldErrors.country}</div>
                        ) : null}
                    </div>

                    <div className="cp-field">
                        <label>Birthday</label>
                        <p className="cp-help">
                            Used to personalize your profile. You must be at least 18 years old.
                        </p>

                        <input
                            type="date"
                            value={birthday}
                            max={today}
                            onChange={(e) => {
                                setBirthday(e.target.value);
                                if (fieldErrors.birthday) {
                                    setFieldErrors((prev) => ({ ...prev, birthday: "" }));
                                }
                            }}
                        />

                        {birthday ? (
                            <button
                                type="button"
                                className="cp-clear-birthday-btn"
                                onClick={() => {
                                    setBirthday("");
                                    setFieldErrors((prev) => ({ ...prev, birthday: "" }));
                                }}
                            >
                                ✕ Clear birthday
                            </button>
                        ) : null}

                        {fieldErrors.birthday ? (
                            <div className="cp-field-error">{fieldErrors.birthday}</div>
                        ) : null}
                    </div>

                    {error ? <div className="cp-error">{error}</div> : null}

                    <button type="submit" className="cp-btn" disabled={loading}>
                        {loading ? (
                            "Creating your profile..."
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Save and enter TalSky
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}