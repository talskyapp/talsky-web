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
    platform: "web",
    appliesTo: "monthly",
    discountValue: 0,
    trialDays: 7,
    countries: "",
    buttonText: "Claim Offer",
    badgeText: "Limited Time",
    revenueCatOfferingId: "default",
    revenueCatPackageId: "$rc_monthly",
    applePromotionalOfferId: "",
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
                discountValue: Number(form.discountValue || 0),
                trialDays: Number(form.trialDays || 7),
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

    function getOfferStatus(offer) {
        const now = new Date();

        if (!offer.active) {
            return {
                label: "Disabled",
                className: "disabled",
            };
        }

        if (offer.startsAt && new Date(offer.startsAt) > now) {
            return {
                label: "Scheduled",
                className: "scheduled",
            };
        }

        if (offer.endsAt && new Date(offer.endsAt) < now) {
            return {
                label: "Expired",
                className: "expired",
            };
        }

        return {
            label: "Active",
            className: "active",
        };
    }

    function formatDate(value) {
        if (!value) return "Immediately";

        return new Date(value).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getTimeDistance(value, mode = "ends") {
        if (!value) return mode === "starts" ? "Starts now" : "No expiration";

        const target = new Date(value).getTime();
        const now = Date.now();
        const diff = target - now;
        const abs = Math.abs(diff);

        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs / 3600000) % 24);
        const minutes = Math.floor((abs / 60000) % 60);

        const text =
            days > 0
                ? `${days}d ${hours}h`
                : hours > 0
                    ? `${hours}h ${minutes}m`
                    : `${minutes}m`;

        if (diff < 0) {
            return mode === "starts" ? `Started ${text} ago` : `Expired ${text} ago`;
        }

        return mode === "starts" ? `Starts in ${text}` : `Ends in ${text}`;
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
                        <p>Control what appears across web and mobile.</p>
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
                                <option value="web">Web</option>
                                <option value="android">Android</option>
                                <option value="ios">iOS</option>
                            </select>
                        </label>

                        <label>
                            Applies To
                            <select
                                value={form.appliesTo}
                                onChange={(e) =>
                                    setForm({ ...form, appliesTo: e.target.value })
                                }
                            >
                                <option value="all">All Plans</option>
                                <option value="monthly">Monthly</option>
                                <option value="6months">6 Months</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </label>

                        <label>
                            Launch Discount ($)
                            <input
                                type="number"
                                value={form.discountValue}
                                onChange={(e) => updateField("discountValue", e.target.value)}
                            />
                        </label>

                        <label>
                            Trial Days
                            <input
                                type="number"
                                value={form.trialDays}
                                onChange={(e) => updateField("trialDays", e.target.value)}
                            />
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
                            Apple Promotional Offer ID
                            <input
                                value={form.applePromotionalOfferId || ""}
                                onChange={(e) =>
                                    updateField(
                                        "applePromotionalOfferId",
                                        e.target.value
                                    )
                                }
                                placeholder="talsky_ai_launch_099"
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
                    {offers.map((offer) => {
                        const status = getOfferStatus(offer);

                        return (
                            <div className="admin-offers-row" key={offer._id}>
                                <div className="admin-offers-row-main">
                                    <div className="admin-offers-row-title">
                                        <strong>{offer.title}</strong>

                                        <span className={`admin-offers-status-chip ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <p>
                                        {offer.subtitle || "No subtitle"} · {offer.platform} · Priority{" "}
                                        {offer.priority || 0}
                                    </p>
                                    <div className="admin-offers-tags">
                                        <span>{offer.type}</span>
                                        <span>{offer.campaign}</span>
                                    </div>

                                    <div className="admin-offers-meta-grid">
                                        <span>
                                            <b>Starts</b>
                                            {formatDate(offer.startsAt)}
                                        </span>

                                        <span>
                                            <b>Ends</b>
                                            {offer.endsAt ? formatDate(offer.endsAt) : "No expiration"}
                                        </span>

                                        <span>
                                            <b>Timing</b>
                                            {status.className === "scheduled"
                                                ? getTimeDistance(offer.startsAt, "starts")
                                                : getTimeDistance(offer.endsAt, "ends")}
                                        </span>

                                        <span>
                                            <b>RevenueCat</b>
                                            {offer.revenueCatOfferingId || "None"}
                                        </span>
                                    </div>
                                </div>

                                <div className="admin-offers-row-actions">
                                    <button
                                        className={offer.active ? "active" : "disabled"}
                                        onClick={() => toggleActive(offer)}
                                    >
                                        {offer.active ? "Disable" : "Enable"}
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
                        );
                    })}

                    {!loading && offers.length === 0 ? (
                        <p className="admin-offers-muted">No offers yet.</p>
                    ) : null}
                </div>
            </section>
        </div>
    );
}