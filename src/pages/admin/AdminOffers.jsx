import { useEffect, useState } from "react";
import axios from "axios";
import { Gift, Plus, Save, Trash2 } from "lucide-react";
import { API_URL } from "../../lib/config";
import "../../styles/AdminOffers.css";

const emptyForm = {
    title: "🚀 Launch Offer",
    subtitle: "First month only $0.99",
    description: "Unlock unlimited chats and premium features.",
    type: "launch",
    campaign: "launch",
    active: true,
    showInFeed: true,
    showInProfile: true,
    showInPricing: true,
    onlyNewUsers: false,
    delayAfterSignupHours: 0,
    priority: 100,
    startsAt: "",
    endsAt: "",
    platform: "android",
    countries: "",
    buttonText: "Claim Offer",
    badgeText: "Limited Time",
    revenueCatOfferingId: "launch_offer",
    revenueCatPackageId: "$rc_monthly",
    bannerStyle: "gradient",
    gradientStart: "#2563EB",
    gradientEnd: "#7C3AED",
    backgroundColor: "#4F46E5",
    textColor: "#FFFFFF",
    icon: "crown",
    animation: "shine",
};

export default function AdminOffers() {
    const [offers, setOffers] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadOffers();
    }, []);

    const token = localStorage.getItem("token");

    async function loadOffers() {
        try {
            setLoading(true);

            const res = await axios.get(`${API_URL}/api/admin/offers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setOffers(res.data.offers || []);
        } catch (error) {
            console.error("LOAD OFFERS ERROR:", error);
        } finally {
            setLoading(false);
        }
    }

    function updateField(name, value) {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function editOffer(offer) {
        setEditingId(offer._id);

        setForm({
            ...emptyForm,
            ...offer,
            countries: Array.isArray(offer.countries)
                ? offer.countries.join(", ")
                : "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function resetForm() {
        setEditingId("");
        setForm(emptyForm);
    }

    async function saveOffer(e) {
        e.preventDefault();

        try {
            setSaving(true);

            const payload = {
                ...form,
                priority: Number(form.priority || 0),
                delayAfterSignupHours: Number(form.delayAfterSignupHours || 0),
                startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
                endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
                countries: form.countries
                    ? form.countries
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean)
                    : [],
            };

            if (editingId) {
                await axios.patch(
                    `${API_URL}/api/admin/offers/${editingId}`,
                    payload,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
            } else {
                await axios.post(`${API_URL}/api/admin/offers`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            await loadOffers();
            resetForm();
        } catch (error) {
            console.error("SAVE OFFER ERROR:", error);
            alert("Could not save offer.");
        } finally {
            setSaving(false);
        }
    }

    async function deleteOffer(id) {
        if (!window.confirm("Delete this offer?")) return;

        try {
            await axios.delete(`${API_URL}/api/admin/offers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            await loadOffers();
        } catch (error) {
            console.error("DELETE OFFER ERROR:", error);
            alert("Could not delete offer.");
        }
    }

    async function toggleActive(offer) {
        try {
            await axios.patch(
                `${API_URL}/api/admin/offers/${offer._id}`,
                { active: !offer.active },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await loadOffers();
        } catch (error) {
            console.error("TOGGLE OFFER ERROR:", error);
            alert("Could not update offer.");
        }
    }

    return (
        <div className="admin-offers-page">
            <div className="admin-offers-hero">
                <div>
                    <p className="admin-kicker">TalSky Promotions</p>
                    <h1>Offers</h1>
                    <p>
                        Create launch offers, discounts, trials, and app banners
                        without publishing a new app version.
                    </p>
                </div>

                <div className="admin-offers-badge">
                    <Gift size={18} />
                    <span>{offers.length} offers</span>
                </div>
            </div>

            <section className="admin-offers-card">
                <div className="admin-offers-section-header">
                    <div>
                        <h2>{editingId ? "Edit Offer" : "Create Offer"}</h2>
                        <p>Control what appears in the native app.</p>
                    </div>

                    {editingId ? (
                        <button className="admin-offers-secondary" onClick={resetForm}>
                            <Plus size={16} />
                            New
                        </button>
                    ) : null}
                </div>

                <form className="admin-offers-form" onSubmit={saveOffer}>
                    <div className="admin-offers-grid">
                        <label>
                            Title
                            <input
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                            />
                        </label>

                        <label>
                            Subtitle
                            <input
                                value={form.subtitle}
                                onChange={(e) => updateField("subtitle", e.target.value)}
                            />
                        </label>

                        <label>
                            Type
                            <select
                                value={form.type}
                                onChange={(e) => updateField("type", e.target.value)}
                            >
                                <option value="launch">Launch</option>
                                <option value="discount">Discount</option>
                                <option value="free_days">Free Days</option>
                                <option value="trial">Trial</option>
                            </select>
                        </label>

                        <label>
                            Campaign
                            <select
                                value={form.campaign}
                                onChange={(e) => updateField("campaign", e.target.value)}
                            >
                                <option value="launch">Launch</option>
                                <option value="welcome">Welcome</option>
                                <option value="discount">Discount</option>
                                <option value="trial">Trial</option>
                                <option value="summer">Summer</option>
                                <option value="black_friday">Black Friday</option>
                                <option value="christmas">Christmas</option>
                            </select>
                        </label>

                        <label>
                            Platform
                            <select
                                value={form.platform}
                                onChange={(e) => updateField("platform", e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="android">Android</option>
                                <option value="ios">iOS</option>
                            </select>
                        </label>

                        <label>
                            Priority
                            <input
                                type="number"
                                value={form.priority}
                                onChange={(e) => updateField("priority", e.target.value)}
                            />
                        </label>

                        <label>
                            Starts At
                            <input
                                type="datetime-local"
                                value={form.startsAt || ""}
                                onChange={(e) => updateField("startsAt", e.target.value)}
                            />
                        </label>

                        <label>
                            Ends At
                            <input
                                type="datetime-local"
                                value={form.endsAt || ""}
                                onChange={(e) => updateField("endsAt", e.target.value)}
                            />
                        </label>

                        <label>
                            RevenueCat Offering ID
                            <input
                                value={form.revenueCatOfferingId}
                                onChange={(e) =>
                                    updateField("revenueCatOfferingId", e.target.value)
                                }
                            />
                        </label>

                        <label>
                            RevenueCat Package ID
                            <input
                                value={form.revenueCatPackageId}
                                onChange={(e) =>
                                    updateField("revenueCatPackageId", e.target.value)
                                }
                            />
                        </label>

                        <label>
                            Button Text
                            <input
                                value={form.buttonText}
                                onChange={(e) => updateField("buttonText", e.target.value)}
                            />
                        </label>

                        <label>
                            Badge Text
                            <input
                                value={form.badgeText}
                                onChange={(e) => updateField("badgeText", e.target.value)}
                            />
                        </label>

                        <label>
                            Delay After Signup Hours
                            <input
                                type="number"
                                value={form.delayAfterSignupHours}
                                onChange={(e) =>
                                    updateField("delayAfterSignupHours", e.target.value)
                                }
                            />
                        </label>

                        <label>
                            Countries
                            <input
                                placeholder="US, JP, ES"
                                value={form.countries}
                                onChange={(e) => updateField("countries", e.target.value)}
                            />
                        </label>
                    </div>

                    <label>
                        Description
                        <textarea
                            value={form.description}
                            onChange={(e) => updateField("description", e.target.value)}
                        />
                    </label>

                    <div className="admin-offers-checks">
                        {[
                            ["active", "Active"],
                            ["showInFeed", "Show in Feed"],
                            ["showInProfile", "Show in Profile"],
                            ["showInPricing", "Show in Pricing"],
                            ["onlyNewUsers", "Only New Users"],
                        ].map(([key, label]) => (
                            <label key={key}>
                                <input
                                    type="checkbox"
                                    checked={!!form[key]}
                                    onChange={(e) => updateField(key, e.target.checked)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>

                    <div className="admin-offers-grid">
                        <label>
                            Banner Style
                            <select
                                value={form.bannerStyle}
                                onChange={(e) => updateField("bannerStyle", e.target.value)}
                            >
                                <option value="gradient">Gradient</option>
                                <option value="solid">Solid</option>
                                <option value="image">Image</option>
                            </select>
                        </label>

                        <label>
                            Gradient Start
                            <input
                                type="color"
                                value={form.gradientStart}
                                onChange={(e) => updateField("gradientStart", e.target.value)}
                            />
                        </label>

                        <label>
                            Gradient End
                            <input
                                type="color"
                                value={form.gradientEnd}
                                onChange={(e) => updateField("gradientEnd", e.target.value)}
                            />
                        </label>

                        <label>
                            Background
                            <input
                                type="color"
                                value={form.backgroundColor}
                                onChange={(e) =>
                                    updateField("backgroundColor", e.target.value)
                                }
                            />
                        </label>

                        <label>
                            Text Color
                            <input
                                type="color"
                                value={form.textColor}
                                onChange={(e) => updateField("textColor", e.target.value)}
                            />
                        </label>

                        <label>
                            Icon
                            <input
                                value={form.icon}
                                onChange={(e) => updateField("icon", e.target.value)}
                            />
                        </label>
                    </div>

                    <button className="admin-offers-save" type="submit" disabled={saving}>
                        <Save size={17} />
                        {saving ? "Saving..." : editingId ? "Save Changes" : "Create Offer"}
                    </button>
                </form>
            </section>

            <section className="admin-offers-card">
                <div className="admin-offers-section-header">
                    <div>
                        <h2>All Offers</h2>
                        <p>Activate, edit or remove promotions.</p>
                    </div>
                </div>

                {loading ? <p className="admin-offers-muted">Loading offers...</p> : null}

                <div className="admin-offers-list">
                    {offers.map((offer) => (
                        <div className="admin-offers-row" key={offer._id}>
                            <div>
                                <strong>{offer.title}</strong>
                                <p>
                                    {offer.subtitle || "No subtitle"} · {offer.platform} ·{" "}
                                    {offer.revenueCatOfferingId || "No RevenueCat offering"}
                                </p>
                            </div>

                            <div className="admin-offers-row-actions">
                                <button
                                    className={offer.active ? "active" : ""}
                                    onClick={() => toggleActive(offer)}
                                >
                                    {offer.active ? "Active" : "Disabled"}
                                </button>

                                <button onClick={() => editOffer(offer)}>Edit</button>

                                <button
                                    className="danger"
                                    onClick={() => deleteOffer(offer._id)}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && offers.length === 0 ? (
                        <p className="admin-offers-muted">No offers yet.</p>
                    ) : null}
                </div>
            </section>
        </div>
    );
}