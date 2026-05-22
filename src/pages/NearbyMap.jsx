import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { API_URL } from "../lib/config";
import { getImageUrl } from "../utils/getImageUrl.js";
import { useTranslation } from "../hooks/useTranslation";
import {
    GoogleMap,
    Marker,
    InfoWindow,
    OverlayView,
    useJsApiLoader,
} from "@react-google-maps/api";
import "../styles/NearbyMap.css";

const containerStyle = {
    width: "100%",
    height: "100vh",
};

const mapStyles = [
    {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b7280" }],
    },
    {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [{ color: "#e5e7eb" }],
    },
    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [{ color: "#f8fafc" }],
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#eef2ff" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#e5e7eb" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#f3f4f6" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#dbeafe" }],
    },
];

const LIBRARIES = [];

export default function NearbyMap() {
    const navigate = useNavigate();
    const { user } = useOutletContext();
    const { t } = useTranslation();

    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [map, setMap] = useState(null);

    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const center = useMemo(() => {
        const lat = Number(user?.location?.lat);
        const lng = Number(user?.location?.lng);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }

        return { lat: 40.7128, lng: -74.006 };
    }, [user?.location?.lat, user?.location?.lng]);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const token = localStorage.getItem("token");

                const subRes = await fetch(`${API_URL}/api/subscription/status`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!subRes.ok) {
                    setShowPremiumOverlay(true);
                    setSubscriptionLoading(false);
                    return;
                }

                const subData = await subRes.json();

                const isPro =
                    subData?.subscription?.plan === "pro" &&
                    subData?.subscription?.status === "active";

                setShowPremiumOverlay(!isPro);
            } catch (error) {
                console.error("Subscription check error:", error);
                setShowPremiumOverlay(true);
            } finally {
                setSubscriptionLoading(false);
            }
        };

        checkSubscription();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setLoadingUsers(true);

        fetch(`${API_URL}/api/users/nearby`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setNearbyUsers(Array.isArray(data) ? data : []);
            })
            .catch(() => setNearbyUsers([]))
            .finally(() => setLoadingUsers(false));
    }, []);

    useEffect(() => {
        if (!map) return;
        if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) return;

        map.panTo(center);
    }, [map, center]);

    const sortedUsers = useMemo(() => {
        return [...nearbyUsers]
            .filter(
                (u) =>
                    Number.isFinite(Number(u?.location?.lat)) &&
                    Number.isFinite(Number(u?.location?.lng))
            )
            .sort((a, b) => {
                const da = typeof a.distance === "number" ? a.distance : Infinity;
                const db = typeof b.distance === "number" ? b.distance : Infinity;
                return da - db;
            });
    }, [nearbyUsers]);

    const handleSelectUser = useCallback(
        (u) => {
            if (showPremiumOverlay) return;

            setSelectedUser(u);

            const lat = Number(u?.location?.lat);
            const lng = Number(u?.location?.lng);

            if (map && Number.isFinite(lat) && Number.isFinite(lng)) {
                map.panTo({ lat, lng });
            }
        },
        [map, showPremiumOverlay]
    );

    const handleRecenter = useCallback(() => {
        if (showPremiumOverlay) return;
        if (!map) return;
        map.panTo(center);
        map.setZoom(12);
    }, [map, center, showPremiumOverlay]);

    if (loadError) {
        return (
            <div className="nearby-loading-screen">
                <div className="nearby-loading-card">
                    <h2>{t("nearby.mapFailedTitle")}</h2>
                    <p>{t("nearby.mapFailedText")}</p>
                </div>
            </div>
        );
    }

    if (!isLoaded || subscriptionLoading) {
        return (
            <div className="nearby-loading-screen">
                <div className="nearby-loading-card">
                    <div className="nearby-spinner"></div>
                    <h2>{t("nearby.loadingTitle")}</h2>
                    <p>{t("nearby.loadingText")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="nearby-map-page">
            <div className={`nearby-map-shell ${showPremiumOverlay ? "nearby-locked" : ""}`}>
                <div className="nearby-topbar">
                    <div className="nearby-topbar-left">
                        <div className="nearby-title-block">
                            <h1>{t("nearby.title")}</h1>
                        </div>

                        <div className="nearby-tabs">
                            <button onClick={() => navigate("/dashboard/feed")}>
                                {t("nearby.tabs.all")}
                            </button>
                            <button className="active">{t("nearby.tabs.nearby")}</button>
                        </div>
                    </div>

                    <div className="nearby-topbar-right">
                        <button className="nearby-ghost-btn" onClick={handleRecenter}>
                            {t("nearby.recenter")}
                        </button>
                    </div>
                </div>

                <div className="nearby-map-layout">
                    <aside className="nearby-sidebar">
                        <div className="nearby-sidebar-card">
                            <div className="nearby-sidebar-header">
                                <h3>{t("nearby.sidebarTitle")}</h3>
                                <span>{sortedUsers.length}</span>
                            </div>

                            <p className="nearby-sidebar-subtext">
                                {t("nearby.sidebarSubtitle")}
                            </p>

                            <div className="nearby-user-list">
                                {loadingUsers ? (
                                    <div className="nearby-state nearby-state-soft">
                                        {t("nearby.loadingUsers")}
                                    </div>
                                ) : sortedUsers.length === 0 ? (
                                    <div className="nearby-state">
                                        <h4>{t("nearby.noUsersTitle")}</h4>
                                        <p>{t("nearby.noUsersText")}</p>
                                    </div>
                                ) : (
                                    sortedUsers.map((u) => (
                                        <button
                                            key={u._id}
                                            className={`nearby-user-item ${selectedUser?._id === u._id ? "selected" : ""}`}
                                            onClick={() => handleSelectUser(u)}
                                        >
                                            <img
                                                src={getImageUrl(u.photo)}
                                                alt={u.name || "User"}
                                                className="nearby-user-avatar"
                                            />

                                            <div className="nearby-user-meta">
                                                <div className="nearby-user-name-row">
                                                    <h4>{u.name}</h4>
                                                    {typeof u.distance === "number" && (
                                                        <span>{u.distance.toFixed(1)} km</span>
                                                    )}
                                                </div>

                                                <p>
                                                    {t("nearby.native")} <strong>{u.nativeLanguage || "—"}</strong>
                                                </p>

                                                <p className="nearby-learning">
                                                    {t("nearby.learning")}{" "}
                                                    {Array.isArray(u.languageToLearn) &&
                                                        u.languageToLearn.length > 0
                                                        ? u.languageToLearn.join(", ")
                                                        : "—"}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </aside>

                    <div className="nearby-map-card">
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={center}
                            zoom={12}
                            onLoad={(mapInstance) => setMap(mapInstance)}
                            onUnmount={() => setMap(null)}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                                styles: mapStyles,
                                clickableIcons: false,
                                gestureHandling: showPremiumOverlay ? "none" : "auto",
                            }}
                        >
                            {Number.isFinite(Number(user?.location?.lat)) &&
                                Number.isFinite(Number(user?.location?.lng)) && (
                                    <Marker
                                        position={{
                                            lat: Number(user.location.lat),
                                            lng: Number(user.location.lng),
                                        }}
                                        title={t("nearby.youAreHere")}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: 12,
                                            fillColor: "#6D4CFF",
                                            fillOpacity: 1,
                                            strokeColor: "#FFFFFF",
                                            strokeWeight: 5,
                                        }}
                                    />
                                )}

                            {sortedUsers.map((u) => {
                                const isSelected = selectedUser?._id === u._id;

                                return (
                                    <OverlayView
                                        key={u._id}
                                        position={{
                                            lat: Number(u.location.lat),
                                            lng: Number(u.location.lng),
                                        }}
                                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSelectUser(u)}
                                            className={`map-avatar-marker ${isSelected ? "selected" : ""}`}
                                        >
                                            <img
                                                src={getImageUrl(u.photo)}
                                                alt={u.name || "User"}
                                                className="map-avatar-marker-img"
                                            />
                                        </button>
                                    </OverlayView>
                                );
                            })}

                            {selectedUser &&
                                Number.isFinite(Number(selectedUser?.location?.lat)) &&
                                Number.isFinite(Number(selectedUser?.location?.lng)) && (
                                    <InfoWindow
                                        position={{
                                            lat: Number(selectedUser.location.lat),
                                            lng: Number(selectedUser.location.lng),
                                        }}
                                        onCloseClick={() => setSelectedUser(null)}
                                        options={{
                                            pixelOffset: new window.google.maps.Size(0, -20),
                                        }}
                                    >
                                        <div className="nearby-popup nearby-popup-card">
                                            <div className="nearby-popup-top">
                                                <img
                                                    src={getImageUrl(selectedUser.photo)}
                                                    alt={selectedUser.name || "User"}
                                                    className="nearby-popup-photo"
                                                />

                                                <div className="nearby-popup-head">
                                                    <h3>{selectedUser.name}</h3>

                                                    {typeof selectedUser.distance === "number" && (
                                                        <div className="nearby-popup-chip">
                                                            {selectedUser.distance.toFixed(1)} {t("nearby.kmAway")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="nearby-popup-content">
                                                <p>
                                                    <span>{t("nearby.native")}</span>
                                                    <strong>{selectedUser.nativeLanguage || "—"}</strong>
                                                </p>

                                                <p>
                                                    <span>{t("nearby.learning")}</span>
                                                    <strong>
                                                        {Array.isArray(selectedUser.languageToLearn) &&
                                                            selectedUser.languageToLearn.length > 0
                                                            ? selectedUser.languageToLearn.join(", ")
                                                            : "—"}
                                                    </strong>
                                                </p>

                                                {selectedUser.bio?.trim() && (
                                                    <p className="nearby-popup-bio">
                                                        {selectedUser.bio.length > 90
                                                            ? `${selectedUser.bio.slice(0, 90)}...`
                                                            : selectedUser.bio}
                                                    </p>
                                                )}

                                                <div className="nearby-popup-actions">
                                                    <button
                                                        className="nearby-primary-btn"
                                                        onClick={() =>
                                                            navigate(`/dashboard/profile/${selectedUser._id}`)
                                                        }
                                                    >
                                                        {t("nearby.viewProfile")}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                        </GoogleMap>
                    </div>
                </div>
            </div>

            {showPremiumOverlay && (
                <>
                    <div className="nearby-premium-backdrop" />

                    <div className="nearby-premium-modal-wrap">
                        <div className="nearby-premium-modal">
                            <div className="nearby-premium-badge">PRO</div>

                            <h2>{t("nearby.proTitle")}</h2>

                            <p>
                                {t("nearby.proSubtitle")}
                            </p>

                            <div className="nearby-premium-plans">
                                <div className="nearby-premium-plan free">
                                    <h3>{t("nearby.freeTitle")}</h3>
                                    <p>{t("nearby.free1")}</p>
                                    <p>{t("nearby.free2")}</p>
                                    <p>{t("nearby.free3")}</p>
                                </div>

                                <div className="nearby-premium-plan pro">
                                    <h3>{t("nearby.proPlanTitle")}</h3>
                                    <p>{t("nearby.pro1")}</p>
                                    <p>{t("nearby.pro2")}</p>
                                    <p>{t("nearby.pro3")}</p>
                                    <p>{t("nearby.pro4")}</p>
                                </div>
                            </div>

                            <div className="nearby-premium-actions">
                                <button
                                    className="nearby-premium-btn-primary"
                                    onClick={() => navigate("/dashboard/pricing")}
                                >
                                    {t("nearby.upgradeNow")}
                                </button>

                                <button
                                    className="nearby-premium-btn-secondary"
                                    onClick={() => navigate("/dashboard/feed")}
                                >
                                    {t("nearby.notNow")}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}