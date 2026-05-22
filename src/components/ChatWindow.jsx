import { useState, useRef, useEffect, useLayoutEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatInputBar from "./ChatInputBar";
import { API_URL } from "../lib/config";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Ban, ChevronDown, X, Send } from "lucide-react";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslation } from "../hooks/useTranslation";

dayjs.extend(relativeTime);

export default function ChatWindow({
    chat,
    messages,
    hasMoreMessages,
    loadingOlderMessages,
    onLoadOlderMessages,
    myId,
    onlineUsers,
    onSend,
    onUnsend,
    onEdit,
    onDeleteForMe,
    typingUsers,
    newMessageSignal,
    onBack,
    isMobileView,
    showChatErrorOverlay,
    chatErrorMessage,
}) {
    const { t } = useTranslation();

    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [focusedReply, setFocusedReply] = useState(null);
    const [deletingMessageId, setDeletingMessageId] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);

    const [autoScroll, setAutoScroll] = useState(true);
    const [isJumpingToReply, setIsJumpingToReply] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);
    const [openHeaderMenu, setOpenHeaderMenu] = useState(false);
    const [isReadyToShowMessages, setIsReadyToShowMessages] = useState(false);

    const [swipeOffsets, setSwipeOffsets] = useState({});
    const [activeSwipeId, setActiveSwipeId] = useState(null);
    const [listSwipeReveal, setListSwipeReveal] = useState(0);
    const [screenSwipeX, setScreenSwipeX] = useState(0);

    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const [selectedVideos, setSelectedVideos] = useState([]);
    const [videoPreviews, setVideoPreviews] = useState([]);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const [openMediaViewer, setOpenMediaViewer] = useState(false);
    const [viewerItems, setViewerItems] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [viewerZoom, setViewerZoom] = useState(1);
    const [viewerShowStrip, setViewerShowStrip] = useState(true);

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
    const [pendingUnfollowUser, setPendingUnfollowUser] = useState(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportLoading, setReportLoading] = useState(false);

    const [reportToast, setReportToast] = useState("");
    const [showReportToast, setShowReportToast] = useState(false);

    const [isBlocked, setIsBlocked] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);

    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);

    const navigate = useNavigate();

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeout = useRef(null);
    const firstLoadRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);
    const wasNearBottomRef = useRef(true);

    const loadingOlderRef = useRef(false);

    const longPressTimerRef = useRef(null);
    const touchStartXRef = useRef(0);
    const touchStartYRef = useRef(0);
    const longPressTriggeredRef = useRef(false);

    const listTouchStartXRef = useRef(0);
    const listTouchStartYRef = useRef(0);
    const listStartedOnBubbleRef = useRef(false);

    const screenTouchStartXRef = useRef(0);
    const screenTouchStartYRef = useRef(0);
    const screenSwipeActiveRef = useRef(false);

    const mediaInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const viewerTouchStartXRef = useRef(0);
    const viewerTouchEndXRef = useRef(0);
    const lastTapRef = useRef(0);

    const previewUrlsRef = useRef([]);
    const previewVideoUrlsRef = useRef([]);

    const isMobile = !!isMobileView;
    const SWIPE_REPLY_THRESHOLD = 64;
    const SWIPE_MAX = 84;
    const LIST_SWIPE_MAX = 72;

    const EDGE_BACK_START = 55;
    const EDGE_BACK_TRIGGER = 250;
    const EDGE_BACK_MAX = 400;

    const SCROLL_DOWN_THRESHOLD = isMobile ? 400 : 300;

    if (!chat) {
        return (
            <div className="chat-area center">
                <h3>{t("chatWindow.selectChat")}</h3>
            </div>
        );
    }

    const chatKey = chat?._id || chat?.otherUser?._id || "temp-chat";

    const other =
        chat.otherUser ||
        (Array.isArray(chat.users)
            ? chat.users.find((u) => {
                const userId = typeof u === "string" ? u : u?._id;
                return userId?.toString() !== myId?.toString();
            })
            : null);

    const otherId = typeof other === "string" ? other : other?._id;

    const isOnline =
        otherId &&
        onlineUsers.some((id) => id?.toString() === otherId?.toString());

    const scrollToBottomInstant = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.style.scrollBehavior = "auto";
        container.scrollTop = container.scrollHeight;

        requestAnimationFrame(() => {
            container.style.scrollBehavior = "";
        });
    };

    const getMediaUrl = (value, variant = "full") => {
        if (!value) return "";

        const raw =
            typeof value === "string"
                ? value
                : value?.[variant] || value?.full || value?.thumb || "";

        if (!raw) return "";
        if (raw.startsWith("http")) return raw;

        return `${API_URL}${raw}`;
    };

    const getThumbUrl = (value) => getMediaUrl(value, "thumb");
    const getFullUrl = (value) => getMediaUrl(value, "full");

    const clearSelectedImages = () => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];
        setSelectedImages([]);
        setImagePreviews([]);

        if (mediaInputRef.current) {
            mediaInputRef.current.value = "";
        }
    };

    const clearSelectedVideo = () => {
        previewVideoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewVideoUrlsRef.current = [];
        setSelectedVideos([]);
        setVideoPreviews([]);

        if (mediaInputRef.current) {
            mediaInputRef.current.value = "";
        }
    };

    const handlePickMedia = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const hasVideo = files.some((file) => file.type.startsWith("video/"));
        const hasImage = files.some((file) => file.type.startsWith("image/"));

        if (hasVideo && hasImage) {
            alert(t("chatWindow.errors.selectImagesOrVideoOnly"));
            return;
        }

        if (hasVideo) {
            const validVideos = [];
            const previewUrls = [];

            for (const file of files) {
                if (!file.type.startsWith("video/")) continue;
                if (file.size > 50 * 1024 * 1024) continue;

                validVideos.push(file);
                previewUrls.push(URL.createObjectURL(file));
            }

            if (!validVideos.length) {
                alert(t("chatWindow.errors.onlyVideosUnder50MB"));
                return;
            }

            if (validVideos.length > 3) {
                alert(t("chatWindow.errors.maxVideos"));
                return;
            }

            clearSelectedImages();
            clearSelectedVideo();

            previewVideoUrlsRef.current = previewUrls;
            setSelectedVideos(validVideos);
            setVideoPreviews(previewUrls);

            if (mediaInputRef.current) {
                mediaInputRef.current.value = "";
            }

            return;
        }

        if (hasImage) {
            const validImages = [];
            const previewUrls = [];

            for (const file of files) {
                if (!file.type.startsWith("image/")) continue;
                if (file.size > 8 * 1024 * 1024) continue;

                validImages.push(file);
                previewUrls.push(URL.createObjectURL(file));
            }

            if (!validImages.length) {
                alert(t("chatWindow.errors.onlyImagesUnder8MB"));
                return;
            }

            clearSelectedVideo();
            clearSelectedImages();

            previewUrlsRef.current = previewUrls;
            setSelectedImages(validImages);
            setImagePreviews(previewUrls);

            if (mediaInputRef.current) {
                mediaInputRef.current.value = "";
            }
        }
    };

    const removeSelectedVideoAt = (index) => {
        const removed = previewVideoUrlsRef.current[index];
        if (removed) URL.revokeObjectURL(removed);

        const nextFiles = selectedVideos.filter((_, i) => i !== index);
        const nextPreviews = videoPreviews.filter((_, i) => i !== index);

        previewVideoUrlsRef.current = nextPreviews;
        setSelectedVideos(nextFiles);
        setVideoPreviews(nextPreviews);

        if (mediaInputRef.current && nextFiles.length === 0) {
            mediaInputRef.current.value = "";
        }
    };

    const handlePickCamera = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert(t("chatWindow.errors.onlyImagesAllowed"));
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            alert(t("chatWindow.errors.photoUnder8MB"));
            return;
        }

        clearSelectedVideo();
        clearSelectedImages();

        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current = [previewUrl];

        setSelectedImages([file]);
        setImagePreviews([previewUrl]);

        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
        }
    };

    const removeSelectedImageAt = (index) => {
        const removed = previewUrlsRef.current[index];
        if (removed) URL.revokeObjectURL(removed);

        const nextFiles = selectedImages.filter((_, i) => i !== index);
        const nextPreviews = imagePreviews.filter((_, i) => i !== index);

        previewUrlsRef.current = nextPreviews;
        setSelectedImages(nextFiles);
        setImagePreviews(nextPreviews);

        if (mediaInputRef.current && nextFiles.length === 0) {
            mediaInputRef.current.value = "";
        }
    };

    const handleSendImages = async () => {
        if (!selectedImages.length || !chat?._id || isBlocked) return;

        try {
            setUploadingImages(true);

            const token = localStorage.getItem("token");
            const formData = new FormData();

            selectedImages.forEach((file) => {
                formData.append("images", file);
            });

            if (replyTo?._id) {
                formData.append("replyTo", replyTo._id);
            }

            const res = await fetch(`${API_URL}/api/messages/${chat._id}/images`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedSendImages"));
            }

            clearSelectedImages();
            setReplyTo(null);
            setOpenMenuId(null);
            setSelectedMessageId(null);
            setFocusedReply(null);
            setAutoScroll(true);
            setHasNewMessageBelow(false);
            setShowScrollDown(false);

            requestAnimationFrame(() => {
                const container = messagesContainerRef.current;
                if (!container) return;

                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth",
                });
            });
        } catch (error) {
            console.error("handleSendImages error:", error);
            alert(error.message || t("chatWindow.errors.failedSendImages"));
        } finally {
            setUploadingImages(false);
        }
    };

    const handleSendVideo = async () => {
        if (!selectedVideos.length || !chat?._id || isBlocked) return;

        try {
            setUploadingVideo(true);

            const token = localStorage.getItem("token");
            const formData = new FormData();

            selectedVideos.forEach((file) => {
                formData.append("videos", file);
            });

            if (replyTo?._id) {
                formData.append("replyTo", replyTo._id);
            }

            const res = await fetch(`${API_URL}/api/messages/${chat._id}/videos`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || data.error || t("chatWindow.errors.failedSendVideos"));
            }

            clearSelectedVideo();
            setReplyTo(null);
            setOpenMenuId(null);
            setSelectedMessageId(null);
            setFocusedReply(null);
            setAutoScroll(true);
            setHasNewMessageBelow(false);
            setShowScrollDown(false);

            requestAnimationFrame(() => {
                const container = messagesContainerRef.current;
                if (!container) return;

                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth",
                });
            });
        } catch (error) {
            console.error("handleSendVideo error:", error);
            alert(error.message || t("chatWindow.errors.failedSendVideos"));
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleOpenMediaViewer = (items, startIndex = 0) => {
        const safeItems = (items || []).filter((item) => item?.src);
        if (!safeItems.length) return;

        const safeIndex =
            startIndex >= 0 && startIndex < safeItems.length ? startIndex : 0;

        setViewerItems(safeItems);
        setViewerIndex(safeIndex);
        setViewerZoom(1);
        setViewerShowStrip(false);
        setOpenMediaViewer(true);
    };

    const handleCloseMediaViewer = () => {
        setOpenMediaViewer(false);
        setViewerItems([]);
        setViewerIndex(0);
        setViewerZoom(1);
        setViewerShowStrip(true);
    };

    const toggleViewerStrip = () => {
        setViewerShowStrip((prev) => !prev);
    };

    const handlePrevViewerItem = () => {
        setViewerIndex((prev) => (prev > 0 ? prev - 1 : prev));
        setViewerZoom(1);
    };

    const handleNextViewerItem = () => {
        setViewerIndex((prev) =>
            prev < viewerItems.length - 1 ? prev + 1 : prev
        );
        setViewerZoom(1);
    };

    const handleViewerTouchStart = (e) => {
        viewerTouchStartXRef.current = e.changedTouches[0].clientX;
    };

    const handleViewerTouchEnd = (e) => {
        viewerTouchEndXRef.current = e.changedTouches[0].clientX;
        const deltaX = viewerTouchEndXRef.current - viewerTouchStartXRef.current;

        if (Math.abs(deltaX) < 40) return;

        if (deltaX < 0) handleNextViewerItem();
        else handlePrevViewerItem();
    };

    const handleViewerImageClick = () => {
        const now = Date.now();
        const delta = now - lastTapRef.current;

        if (delta < 260) {
            setViewerZoom((prev) => (prev === 1 ? 2 : 1));
        } else {
            setViewerShowStrip((prev) => !prev);
        }

        lastTapRef.current = now;
    };

    useEffect(() => {
        loadingOlderRef.current = loadingOlderMessages;
    }, [loadingOlderMessages]);

    useEffect(() => {
        previewUrlsRef.current = imagePreviews;
    }, [imagePreviews]);

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        previewVideoUrlsRef.current = videoPreviews;
    }, [videoPreviews]);

    useEffect(() => {
        return () => {
            previewVideoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        if (!openMediaViewer) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") handleCloseMediaViewer();
            if (e.key === "ArrowLeft") handlePrevViewerItem();
            if (e.key === "ArrowRight") handleNextViewerItem();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [openMediaViewer, viewerItems.length]);

    useEffect(() => {
        firstLoadRef.current = true;
        prevMessagesLengthRef.current = 0;
        wasNearBottomRef.current = true;

        setIsReadyToShowMessages(false);
        setAutoScroll(true);
        setShowScrollDown(false);
        setHasNewMessageBelow(false);
        setOpenMenuId(null);
        setSelectedMessageId(null);
        setFocusedReply(null);
        setReplyTo(null);
        setEditingMessage(null);
        setDeletingMessageId(null);
        setOpenHeaderMenu(false);
        setSwipeOffsets({});
        setActiveSwipeId(null);
        setListSwipeReveal(0);
        setScreenSwipeX(0);
        clearSelectedImages();
        clearSelectedVideo();
    }, [chatKey]);

    useLayoutEffect(() => {
        if (!chatKey) return;
        if (!firstLoadRef.current) return;

        const container = messagesContainerRef.current;
        if (!container) return;
        if (messages.length === 0) return;

        scrollToBottomInstant();

        setAutoScroll(true);
        setShowScrollDown(false);
        setHasNewMessageBelow(false);
        wasNearBottomRef.current = true;
        prevMessagesLengthRef.current = messages.length;

        const mediaEls = container.querySelectorAll("img, video");
        const pendingMedia = Array.from(mediaEls).filter((el) => {
            if (el.tagName === "IMG") return !el.complete;
            if (el.tagName === "VIDEO") return el.readyState < 1;
            return false;
        });

        if (pendingMedia.length === 0) {
            firstLoadRef.current = false;
            setIsReadyToShowMessages(true);
            return;
        }

        let loadedCount = 0;
        let finished = false;

        const finishInitialScroll = () => {
            if (finished) return;
            finished = true;

            scrollToBottomInstant();

            requestAnimationFrame(() => {
                scrollToBottomInstant();

                if (isMobile) {
                    setTimeout(() => {
                        scrollToBottomInstant();
                    }, 60);

                    setTimeout(() => {
                        scrollToBottomInstant();
                    }, 180);
                }

                firstLoadRef.current = false;
                setIsReadyToShowMessages(true);
            });
        };

        const handleMediaDone = () => {
            loadedCount += 1;
            if (loadedCount >= pendingMedia.length) {
                finishInitialScroll();
            }
        };

        pendingMedia.forEach((el) => {
            const readyEvent = el.tagName === "VIDEO" ? "loadedmetadata" : "load";
            el.addEventListener(readyEvent, handleMediaDone, { once: true });
            el.addEventListener("error", handleMediaDone, { once: true });
        });

        const fallbackTimer = setTimeout(() => {
            finishInitialScroll();
        }, 700);

        return () => {
            clearTimeout(fallbackTimer);
            pendingMedia.forEach((el) => {
                const readyEvent = el.tagName === "VIDEO" ? "loadedmetadata" : "load";
                el.removeEventListener(readyEvent, handleMediaDone);
                el.removeEventListener("error", handleMediaDone);
            });
        };
    }, [chatKey, messages.length, isMobile]);

    useEffect(() => {
        if (!messages.length) return;
        if (firstLoadRef.current) return;
        if (isJumpingToReply) return;
        if (loadingOlderRef.current) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        const prevLen = prevMessagesLengthRef.current;
        const currentLen = messages.length;
        const gotNewMessage = currentLen > prevLen;

        prevMessagesLengthRef.current = currentLen;

        if (!gotNewMessage) return;

        const lastMessage = messages[messages.length - 1];
        const senderId =
            typeof lastMessage.sender === "string"
                ? lastMessage.sender
                : lastMessage.sender?._id;

        const isMine = senderId?.toString() === myId?.toString();

        if (isMine || autoScroll || wasNearBottomRef.current) {
            requestAnimationFrame(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth",
                });
                setShowScrollDown(false);
                setHasNewMessageBelow(false);
            });
        } else {
            setHasNewMessageBelow(true);
            setShowScrollDown(true);
        }
    }, [messages, autoScroll, isJumpingToReply, myId]);

    useEffect(() => {
        if (!chatKey) return;
        if (!firstLoadRef.current) return;
        if (messages.length > 0) return;

        const timer = setTimeout(() => {
            firstLoadRef.current = false;
            prevMessagesLengthRef.current = 0;
            wasNearBottomRef.current = true;
            setIsReadyToShowMessages(true);
            setAutoScroll(true);
            setShowScrollDown(false);
            setHasNewMessageBelow(false);

            const container = messagesContainerRef.current;
            if (container) {
                scrollToBottomInstant();

                if (isMobile) {
                    setTimeout(() => scrollToBottomInstant(), 60);
                    setTimeout(() => scrollToBottomInstant(), 180);
                }
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [chatKey, messages.length, isMobile]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedInsideMenu = e.target.closest(".msg-menu");
            const clickedInsideHeaderMenu = e.target.closest(".header-menu");

            if (!clickedInsideMenu) setOpenMenuId(null);
            if (!clickedInsideHeaderMenu) setOpenHeaderMenu(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        };
    }, []);

    useEffect(() => {
        const fetchFollowStatus = async () => {
            if (!other?._id || other._id === myId) {
                setIsFollowing(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/follows/status/${other._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || data.msg || t("chatWindow.errors.failedFollowStatus"));
                }

                setIsFollowing(!!data.isFollowing);
            } catch (error) {
                console.error("Fetch follow status error:", error);
                setIsFollowing(false);
            }
        };

        fetchFollowStatus();
    }, [other?._id, myId, t]);

    useEffect(() => {
        const fetchBlockStatus = async () => {
            if (!other?._id || other._id === myId) {
                setIsBlocked(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/api/blocks/status/${other._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                let data = {};
                try {
                    data = await res.json();
                } catch {
                    data = {};
                }

                if (!res.ok) {
                    throw new Error(data.error || data.msg || t("chatWindow.errors.failedBlockStatus"));
                }

                setIsBlocked(!!data.isBlocked);
            } catch (error) {
                console.error("Fetch block status error:", error);
                setIsBlocked(false);
            }
        };

        fetchBlockStatus();
    }, [other?._id, myId, t]);

    useEffect(() => {
        if (!isBlocked) return;

        setReplyTo(null);
        setEditingMessage(null);
        setText("");
        clearSelectedImages();
        clearSelectedVideo();
    }, [isBlocked]);

    const reportOptions = [
        { value: "spam", label: t("chatWindow.reportReasons.spam") },
        { value: "abuse", label: t("chatWindow.reportReasons.abuse") },
        { value: "harassment", label: t("chatWindow.reportReasons.harassment") },
        { value: "fake", label: t("chatWindow.reportReasons.fake") },
        { value: "other", label: t("chatWindow.reportReasons.other") },
    ];

    const showToastMessage = (message) => {
        setReportToast(message);
        setShowReportToast(true);

        setTimeout(() => {
            setShowReportToast(false);
        }, 2600);
    };

    const handleSubmitReport = async () => {
        if (!other?._id || !reportReason || reportLoading) return;

        try {
            setReportLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/reports`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reportedUserId: other._id,
                    reason: reportReason,
                    details: reportDetails.trim(),
                }),
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedSendReport"));
            }

            setShowReportModal(false);
            setReportReason("");
            setReportDetails("");
            showToastMessage(t("chatWindow.reportSubmitted"));
        } catch (error) {
            console.error("Report error:", error);
            showToastMessage(error.message || t("chatWindow.errors.somethingWentWrong"));
        } finally {
            setReportLoading(false);
        }
    };

    const handleBlockClick = () => {
        if (!other?._id || other._id === myId || blockLoading) return;

        if (isBlocked) setShowUnblockConfirm(true);
        else setShowBlockConfirm(true);

        setOpenHeaderMenu(false);
    };

    const confirmBlockUser = async () => {
        if (!other?._id || blockLoading) return;

        try {
            setBlockLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/blocks/${other._id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedBlockUser"));
            }

            setIsBlocked(!!data.isBlocked);
            setIsFollowing(false);
            setShowBlockConfirm(false);
            showToastMessage(
                t("chatWindow.userBlocked", {
                    name: other?.name || other?.username || t("chatWindow.user"),
                })
            );
        } catch (error) {
            console.error("Block error:", error);
            showToastMessage(error.message || t("chatWindow.errors.somethingWentWrong"));
        } finally {
            setBlockLoading(false);
        }
    };

    const confirmUnblockUser = async () => {
        if (!other?._id || blockLoading) return;

        try {
            setBlockLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/blocks/${other._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedUnblockUser"));
            }

            setIsBlocked(!!data.isBlocked);
            setShowUnblockConfirm(false);
            showToastMessage(
                t("chatWindow.userUnblocked", {
                    name: other?.name || other?.username || t("chatWindow.user"),
                })
            );
        } catch (error) {
            console.error("Unblock error:", error);
            showToastMessage(error.message || t("chatWindow.errors.somethingWentWrong"));
        } finally {
            setBlockLoading(false);
        }
    };

    const closeBlockModals = () => {
        if (blockLoading) return;
        setShowBlockConfirm(false);
        setShowUnblockConfirm(false);
    };

    const handleTyping = (value) => {
        if (isBlocked) return;

        setText(value);

        if (!window.socket || !chat?._id) return;

        window.socket.emit("typing", { chatId: chat._id });

        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        typingTimeout.current = setTimeout(() => {
            window.socket.emit("stop_typing", { chatId: chat._id });
        }, 1000);
    };

    const handleSend = async () => {
        if (isBlocked) return;
        if (!text.trim()) return;

        try {
            if (editingMessage) {
                await onEdit?.(editingMessage._id, text.trim());
                setEditingMessage(null);
                setReplyTo(null);
            } else {
                const tempId =
                    window.crypto?.randomUUID?.() ||
                    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

                onSend({
                    text: text.trim(),
                    replyTo: replyTo?._id || null,
                    tempId,
                });
            }

            if (window.socket && chat?._id) {
                window.socket.emit("stop_typing", { chatId: chat._id });
            }

            setText("");
            setReplyTo(null);
            setOpenMenuId(null);
            setSelectedMessageId(null);
            setFocusedReply(null);
            setAutoScroll(true);
            setHasNewMessageBelow(false);
            setShowScrollDown(false);

            requestAnimationFrame(() => {
                const container = messagesContainerRef.current;
                if (!container) return;

                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: "smooth",
                });
            });
        } catch (error) {
            console.error("handleSend error:", error);
        }
    };

    const handleViewProfile = () => {
        if (!other?._id) return;

        if (other?.accountStatus === "deleted") {
            setOpenHeaderMenu(false);
            return;
        }

        setOpenHeaderMenu(false);
        navigate(`/dashboard/profile/${other._id}`);
    };

    const handleFollowToggle = async () => {
        if (!other?._id) return;
        if (other._id === myId) return;
        if (followLoading) return;

        if (isFollowing) {
            setPendingUnfollowUser(other);
            setShowUnfollowConfirm(true);
            return;
        }

        try {
            setFollowLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/follows/${other._id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedUpdateFollow"));
            }

            setIsFollowing(!!data.isFollowing);
            setOpenHeaderMenu(false);
        } catch (error) {
            console.error("Follow error:", error);
            showToastMessage(error.message || t("chatWindow.errors.somethingWentWrong"));
        } finally {
            setFollowLoading(false);
        }
    };

    const confirmUnfollow = async () => {
        if (!pendingUnfollowUser?._id || followLoading) return;

        try {
            setFollowLoading(true);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_URL}/api/follows/${pendingUnfollowUser._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            let data = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.error || data.msg || t("chatWindow.errors.failedUnfollowUser"));
            }

            setIsFollowing(!!data.isFollowing);
            setShowUnfollowConfirm(false);
            setPendingUnfollowUser(null);
            setOpenHeaderMenu(false);
        } catch (error) {
            console.error("Unfollow error:", error);
            showToastMessage(error.message || t("chatWindow.errors.somethingWentWrong"));
        } finally {
            setFollowLoading(false);
        }
    };

    const closeUnfollowConfirm = () => {
        if (followLoading) return;
        setShowUnfollowConfirm(false);
        setPendingUnfollowUser(null);
    };

    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();

        const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const isYesterday =
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        if (isToday) return t("chatWindow.today");
        if (isYesterday) return t("chatWindow.yesterday");

        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
        });
    };

    const lastReadIndex = messages
        .map((m, i) => {
            const sid =
                typeof m.sender === "string" ? m.sender : m.sender?._id;

            return sid?.toString() === myId?.toString() && m.readAt ? i : null;
        })
        .filter((i) => i !== null)
        .pop();

    const showTyping = typingUsers?.length > 0 && !editingMessage;

    const startLongPress = (msg) => {
        if (!isMobile) return;

        clearTimeout(longPressTimerRef.current);
        longPressTriggeredRef.current = false;

        longPressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            setOpenMenuId(msg._id);
        }, 450);
    };

    const cancelLongPress = () => {
        clearTimeout(longPressTimerRef.current);
    };

    const handleTouchStartMessage = (e, msg) => {
        if (!isMobile) return;

        const touch = e.touches[0];
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
        longPressTriggeredRef.current = false;

        startLongPress(msg);
    };

    const handleTouchMoveMessage = (e, msg, isMine) => {
        if (!isMobile) return;
        if (openMenuId === msg._id) return;
        if (listSwipeReveal > 0) return;
        if (screenSwipeX > 0) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartXRef.current;
        const deltaY = touch.clientY - touchStartYRef.current;

        if (Math.abs(deltaY) > 10) {
            cancelLongPress();
        }

        let allowedOffset = 0;

        if (isMine && deltaX < 0) {
            allowedOffset = Math.max(deltaX, -SWIPE_MAX);
        }

        if (!isMine && deltaX > 0) {
            allowedOffset = Math.min(deltaX, SWIPE_MAX);
        }

        if (Math.abs(allowedOffset) > 8) {
            cancelLongPress();
            setOpenMenuId(null);
            setSelectedMessageId(null);
            setActiveSwipeId(msg._id);
            setSwipeOffsets((prev) => ({
                ...prev,
                [msg._id]: allowedOffset,
            }));
        }
    };

    const handleTouchEndMessage = (msg) => {
        if (!isMobile) return;

        cancelLongPress();

        const currentOffset = swipeOffsets[msg._id] || 0;
        const passedThreshold = Math.abs(currentOffset) >= SWIPE_REPLY_THRESHOLD;

        if (passedThreshold) {
            setReplyTo(msg);
        }

        setSwipeOffsets((prev) => ({
            ...prev,
            [msg._id]: 0,
        }));

        if (activeSwipeId === msg._id) {
            setTimeout(() => {
                setActiveSwipeId(null);
            }, 140);
        }
    };

    const handleMessagesTouchStart = (e) => {
        if (!isMobile) return;

        const touch = e.touches[0];
        listTouchStartXRef.current = touch.clientX;
        listTouchStartYRef.current = touch.clientY;

        const startedOnBubble = !!e.target.closest(".bubble-wrapper");
        listStartedOnBubbleRef.current = startedOnBubble;
    };

    const handleMessagesTouchMove = (e) => {
        if (!isMobile) return;
        if (listStartedOnBubbleRef.current) return;
        if (activeSwipeId) return;
        if (screenSwipeX > 0) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - listTouchStartXRef.current;
        const deltaY = touch.clientY - listTouchStartYRef.current;

        if (Math.abs(deltaY) > 16) return;
        if (deltaX >= 0) return;

        const reveal = Math.min(Math.abs(deltaX), LIST_SWIPE_MAX);
        setListSwipeReveal(reveal);
    };

    const handleMessagesTouchEnd = () => {
        if (!isMobile) return;

        listStartedOnBubbleRef.current = false;
        setListSwipeReveal(0);
    };

    const handleScreenTouchStart = (e) => {
        if (!isMobile || !chat) return;
        if (openMenuId || replyTo || editingMessage) return;

        const touch = e.touches[0];
        screenTouchStartXRef.current = touch.clientX;
        screenTouchStartYRef.current = touch.clientY;

        screenSwipeActiveRef.current = touch.clientX <= EDGE_BACK_START;
    };

    const handleScreenTouchMove = (e) => {
        if (!isMobile) return;
        if (!screenSwipeActiveRef.current) return;
        if (activeSwipeId) return;
        if (listSwipeReveal > 0) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - screenTouchStartXRef.current;
        const deltaY = touch.clientY - screenTouchStartYRef.current;

        if (Math.abs(deltaY) > 20 && Math.abs(deltaY) > Math.abs(deltaX)) {
            screenSwipeActiveRef.current = false;
            setScreenSwipeX(0);
            return;
        }

        if (deltaX <= 0) {
            setScreenSwipeX(0);
            return;
        }

        setScreenSwipeX(Math.min(deltaX, EDGE_BACK_MAX));
    };

    const handleScreenTouchEnd = () => {
        if (!isMobile) return;

        const shouldGoBack = screenSwipeX >= EDGE_BACK_TRIGGER;

        screenSwipeActiveRef.current = false;
        setScreenSwipeX(0);

        if (shouldGoBack) {
            requestAnimationFrame(() => {
                onBack?.();
            });
        }
    };

    const baseMessagesPaddingRight = isMobile ? 10 : 20;
    const dynamicMessagesPaddingRight = baseMessagesPaddingRight + listSwipeReveal;

    return (
        <div
            className={`chat-screen-swipe ${screenSwipeX > 0 ? "swiping" : ""}`}
            style={{
                transform: `translateX(${screenSwipeX}px)`,
                transition: screenSwipeX > 0 ? "none" : "transform 0.22s ease",
                boxShadow:
                    screenSwipeX > 0
                        ? "0 0 0 1px rgba(0,0,0,0.02), -14px 0 34px rgba(15,23,42,0.10)"
                        : "none",
                borderTopLeftRadius: screenSwipeX > 0 ? "18px" : "0px",
                borderBottomLeftRadius: screenSwipeX > 0 ? "18px" : "0px",
            }}
            onTouchStart={handleScreenTouchStart}
            onTouchMove={handleScreenTouchMove}
            onTouchEnd={handleScreenTouchEnd}
            onTouchCancel={handleScreenTouchEnd}
        >
            <div className="chat-area">
                <ChatHeader
                    other={other}
                    myId={myId}
                    isOnline={isOnline}
                    isBlocked={isBlocked}
                    followLoading={followLoading}
                    isFollowing={isFollowing}
                    openHeaderMenu={openHeaderMenu}
                    setOpenHeaderMenu={setOpenHeaderMenu}
                    handleViewProfile={handleViewProfile}
                    handleFollowToggle={handleFollowToggle}
                    handleBlockClick={handleBlockClick}
                    setReportReason={setReportReason}
                    setReportDetails={setReportDetails}
                    setShowReportModal={setShowReportModal}
                />

                <div className="messages-wrap">
                    <div
                        ref={messagesContainerRef}
                        className="messages"
                        style={{
                            visibility:
                                isReadyToShowMessages || messages.length > 0
                                    ? "visible"
                                    : "hidden",
                            paddingRight: `${dynamicMessagesPaddingRight}px`,
                            "--time-reveal-space": `${listSwipeReveal}px`,
                        }}
                        onClick={() => {
                            setFocusedReply(null);
                            setOpenMenuId(null);
                            setSelectedMessageId(null);
                            setOpenHeaderMenu(false);
                        }}
                        onScroll={(e) => {
                            const el = e.target;
                            if (
                                el.scrollTop < 120 &&
                                hasMoreMessages &&
                                !loadingOlderMessages
                            ) {
                                onLoadOlderMessages?.();
                            }
                            const distanceFromBottom =
                                el.scrollHeight - el.scrollTop - el.clientHeight;

                            const isNearBottom = distanceFromBottom < SCROLL_DOWN_THRESHOLD;
                            wasNearBottomRef.current =
                                distanceFromBottom < Math.max(80, SCROLL_DOWN_THRESHOLD - 60);

                            if (isJumpingToReply) return;

                            setShowScrollDown(!isNearBottom);

                            if (isNearBottom) {
                                setAutoScroll(true);
                                setHasNewMessageBelow(false);
                            } else {
                                setAutoScroll(false);
                            }
                        }}
                        onTouchStart={handleMessagesTouchStart}
                        onTouchMove={handleMessagesTouchMove}
                        onTouchEnd={handleMessagesTouchEnd}
                        onTouchCancel={handleMessagesTouchEnd}
                    >
                        {isBlocked && (
                            <div className="chat-blocked-overlay">
                                <div className="chat-blocked-box">
                                    <div className="chat-blocked-title">
                                        {t("chatWindow.messagingUnavailable")}
                                    </div>
                                    <div className="chat-blocked-subtitle">
                                        {t("chatWindow.cantSendInChat")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showChatErrorOverlay && (
                            <div className="chat-send-error-overlay">
                                <div className="chat-send-error-box">
                                    <div className="chat-send-error-title">
                                        {t("chatWindow.messagingUnavailable")}
                                    </div>
                                    <div className="chat-send-error-subtitle">
                                        {chatErrorMessage || t("chatWindow.cantSendInChat")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const senderId =
                                typeof msg.sender === "string"
                                    ? msg.sender
                                    : msg.sender?._id;

                            const isMine = senderId?.toString() === myId?.toString();
                            const isLastMine = index === messages.length - 1;

                            const createdAtMs = new Date(msg.createdAt).getTime();
                            const diffMinutes = (Date.now() - createdAtMs) / 60000;
                            const canUnsend = isMine && diffMinutes <= 15 && !msg.unsent;

                            const msgDate = new Date(msg.createdAt).toDateString();
                            const prevDate =
                                index > 0
                                    ? new Date(messages[index - 1].createdAt).toDateString()
                                    : null;

                            const showDate = msgDate !== prevDate;
                            const swipeOffset = swipeOffsets[msg._id] || 0;
                            const isSwipingThis =
                                activeSwipeId === msg._id && Math.abs(swipeOffset) > 0;

                            const showDesktopTime =
                                !isMobile && selectedMessageId === msg._id;

                            const showListSwipeTime =
                                isMobile && listSwipeReveal > 12;

                            return (
                                <div key={msg._id || msg.tempId || `temp-${index}`}>
                                    {showDate && (
                                        <div className="date-separator-line">
                                            <div className="date-separator">
                                                {formatDateLabel(msg.createdAt)}
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        id={`msg-${msg._id}`}
                                        className={`message-row ${isMine ? "mine" : "theirs"} ${focusedReply === msg._id ? "reply-focus" : ""
                                            } ${deletingMessageId === msg._id ? "disintegrate" : ""} ${msg._id &&
                                                (selectedMessageId === msg._id ||
                                                    openMenuId === msg._id)
                                                ? "menu-visible"
                                                : ""
                                            }`}
                                        style={{
                                            width: "100%",
                                            overflow: "visible",
                                            boxSizing: "border-box",
                                            paddingRight: isMobile
                                                ? `${listSwipeReveal}px`
                                                : "0px",
                                        }}
                                    >
                                        {!isMine && (
                                            <img
                                                src={
                                                    msg.sender?.photo
                                                        ? msg.sender.photo.startsWith("http")
                                                            ? msg.sender.photo
                                                            : `${API_URL}${msg.sender.photo}`
                                                        : "/default-avatar.png"
                                                }
                                                className="msg-avatar"
                                                alt={msg.sender?.username || t("chatWindow.user")}
                                            />
                                        )}

                                        <div
                                            className="bubble-wrapper"
                                            onTouchStart={(e) => handleTouchStartMessage(e, msg)}
                                            onTouchMove={(e) =>
                                                handleTouchMoveMessage(e, msg, isMine)
                                            }
                                            onTouchEnd={() => handleTouchEndMessage(msg)}
                                            onTouchCancel={() => handleTouchEndMessage(msg)}
                                            style={{
                                                transform: `translateX(${swipeOffset}px)`,
                                                transition: isSwipingThis
                                                    ? "none"
                                                    : "transform 0.18s ease",
                                                position: "relative",
                                                overflow: "visible",
                                            }}
                                        >
                                            {msg.replyTo && !msg.unsent && (
                                                <div
                                                    className="reply-bubble clickable-reply"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const targetId = msg.replyTo?._id;
                                                        if (!targetId) return;

                                                        const target = document.getElementById(
                                                            `msg-${targetId}`
                                                        );
                                                        if (!target) return;

                                                        setIsJumpingToReply(true);
                                                        setAutoScroll(false);
                                                        setFocusedReply(targetId);

                                                        target.scrollIntoView({
                                                            behavior: "smooth",
                                                            block: "center",
                                                        });

                                                        requestAnimationFrame(() => {
                                                            target.classList.remove("zoom-effect");
                                                            void target.offsetWidth;
                                                            target.classList.add("zoom-effect");
                                                        });

                                                        setTimeout(() => {
                                                            setIsJumpingToReply(false);
                                                        }, 500);
                                                    }}
                                                >
                                                    <div className="reply-author">
                                                        {msg.replyTo.sender?.name || t("chatWindow.user")}
                                                    </div>
                                                    <div className="reply-snippet">
                                                        {msg.replyTo.type === "image"
                                                            ? Array.isArray(msg.replyTo.fileUrls) &&
                                                                msg.replyTo.fileUrls.length > 1
                                                                ? `${msg.replyTo.fileUrls.length} ${t("chatWindow.photos")}`
                                                                : t("chatWindow.photo")
                                                            : msg.replyTo.type === "video"
                                                                ? Array.isArray(msg.replyTo.fileUrls) &&
                                                                    msg.replyTo.fileUrls.length > 1
                                                                    ? `${msg.replyTo.fileUrls.length} ${t("chatWindow.videos")}`
                                                                    : t("chatWindow.video")
                                                                : msg.replyTo.text}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.unsent ? (
                                                <div
                                                    className={`unsent-line ${isMine ? "mine" : "theirs"}`}
                                                >
                                                    {msg.text ||
                                                        (isMine
                                                            ? t("chatWindow.youUnsentMessage")
                                                            : t("chatWindow.messageRemoved"))}
                                                </div>
                                            ) : (
                                                <div
                                                    className={`message-bubble ${isMine ? "sent" : "received"} ${msg.type === "image" || msg.type === "video"
                                                        ? "image-bubble"
                                                        : ""
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isMobile) return;

                                                        setSelectedMessageId((prev) =>
                                                            prev === msg._id ? null : msg._id
                                                        );
                                                    }}
                                                >
                                                    {msg.type === "image" ? (
                                                        (() => {
                                                            const images =
                                                                Array.isArray(msg.fileUrls) &&
                                                                    msg.fileUrls.length > 0
                                                                    ? msg.fileUrls
                                                                    : msg.fileUrl
                                                                        ? [msg.fileUrl]
                                                                        : [];

                                                            const normalizedImages = images
                                                                .filter(Boolean)
                                                                .map((src) =>
                                                                    getThumbUrl(src)
                                                                );

                                                            if (!normalizedImages.length) return null;

                                                            return (
                                                                <div
                                                                    className={
                                                                        normalizedImages.length >= 3
                                                                            ? "chat-image-stack"
                                                                            : `chat-image-album album-count-${Math.min(
                                                                                normalizedImages.length,
                                                                                2
                                                                            )}`
                                                                    }
                                                                >
                                                                    {normalizedImages.length >= 3 ? (
                                                                        <>
                                                                            {normalizedImages
                                                                                .slice(0, 3)
                                                                                .map((src, idx) => (
                                                                                    <button
                                                                                        key={idx}
                                                                                        type="button"
                                                                                        className={`chat-image-stack-card stack-card-${idx + 1}`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleOpenMediaViewer(
                                                                                                normalizedImages.map((src) => ({
                                                                                                    type: "image",
                                                                                                    src,
                                                                                                })),
                                                                                                idx
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <img
                                                                                            src={src}
                                                                                            alt={`Sent image ${idx + 1}`}
                                                                                            className="chat-message-image"
                                                                                            onLoad={() => {
                                                                                                if (!messagesContainerRef.current) return;
                                                                                                if (!autoScroll) return;

                                                                                                requestAnimationFrame(() => {
                                                                                                    messagesContainerRef.current.scrollTo({
                                                                                                        top: messagesContainerRef.current.scrollHeight,
                                                                                                        behavior: "auto",
                                                                                                    });
                                                                                                });
                                                                                            }}
                                                                                        />

                                                                                        {normalizedImages.length > 3 &&
                                                                                            idx === 0 && (
                                                                                                <div className="chat-image-stack-more">
                                                                                                    +{normalizedImages.length - 3}
                                                                                                </div>
                                                                                            )}
                                                                                    </button>
                                                                                ))}
                                                                        </>
                                                                    ) : (
                                                                        normalizedImages.map((src, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="chat-image-album-item"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleOpenMediaViewer(
                                                                                        normalizedImages.map((src) => ({
                                                                                            type: "image",
                                                                                            src,
                                                                                        })),
                                                                                        idx
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={src}
                                                                                    alt={`Sent image ${idx + 1}`}
                                                                                    className="chat-message-image"
                                                                                    onLoad={() => {
                                                                                        if (!messagesContainerRef.current) return;
                                                                                        if (!autoScroll) return;

                                                                                        requestAnimationFrame(() => {
                                                                                            messagesContainerRef.current.scrollTo({
                                                                                                top: messagesContainerRef.current.scrollHeight,
                                                                                                behavior: "auto",
                                                                                            });
                                                                                        });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            );
                                                        })()
                                                    ) : msg.type === "video" ? (
                                                        (() => {
                                                            const videos =
                                                                Array.isArray(msg.fileUrls) &&
                                                                    msg.fileUrls.length > 0
                                                                    ? msg.fileUrls
                                                                    : [];

                                                            const normalizedVideos = videos
                                                                .filter(Boolean)
                                                                .map((src) =>
                                                                    src.startsWith("http")
                                                                        ? src
                                                                        : `${API_URL}${src}`
                                                                );

                                                            if (!normalizedVideos.length) return null;

                                                            const viewerVideoItems =
                                                                normalizedVideos.map((src) => ({
                                                                    type: "video",
                                                                    src,
                                                                }));

                                                            return (
                                                                <div
                                                                    className={
                                                                        normalizedVideos.length >= 3
                                                                            ? "chat-video-stack"
                                                                            : "chat-video-bubble"
                                                                    }
                                                                >
                                                                    {normalizedVideos.length >= 2 ? (
                                                                        normalizedVideos
                                                                            .slice(0, 3)
                                                                            .map((src, idx) => (
                                                                                <button
                                                                                    key={idx}
                                                                                    type="button"
                                                                                    className={`chat-video-stack-card stack-card-${idx + 1}`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOpenMediaViewer(
                                                                                            viewerVideoItems,
                                                                                            idx
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <video
                                                                                        src={src}
                                                                                        className="chat-message-video"
                                                                                        controls={idx === 0}
                                                                                        playsInline
                                                                                        preload="metadata"
                                                                                        muted={idx !== 0}
                                                                                        onLoadedMetadata={() => {
                                                                                            if (!messagesContainerRef.current) return;
                                                                                            if (!autoScroll) return;

                                                                                            requestAnimationFrame(() => {
                                                                                                messagesContainerRef.current.scrollTo({
                                                                                                    top: messagesContainerRef.current.scrollHeight,
                                                                                                    behavior: "auto",
                                                                                                });
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                    {normalizedVideos.length > 3 &&
                                                                                        idx === 0 && (
                                                                                            <div className="chat-video-stack-more">
                                                                                                +{normalizedVideos.length - 3}
                                                                                            </div>
                                                                                        )}
                                                                                </button>
                                                                            ))
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            className="chat-video-single-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOpenMediaViewer(
                                                                                    viewerVideoItems,
                                                                                    0
                                                                                );
                                                                            }}
                                                                        >
                                                                            <video
                                                                                src={normalizedVideos[0]}
                                                                                className="chat-message-video"
                                                                                controls
                                                                                playsInline
                                                                                preload="metadata"
                                                                                onLoadedMetadata={() => {
                                                                                    if (!messagesContainerRef.current) return;
                                                                                    if (!autoScroll) return;

                                                                                    requestAnimationFrame(() => {
                                                                                        messagesContainerRef.current.scrollTo({
                                                                                            top: messagesContainerRef.current.scrollHeight,
                                                                                            behavior: "auto",
                                                                                        });
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <>
                                                            {msg.text}
                                                            {msg.edited && (
                                                                <span className="edited-label">
                                                                    {" "}
                                                                    ({t("chatWindow.edited")})
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {showDesktopTime && (
                                                <div className="msg-time">
                                                    {dayjs(msg.createdAt).format("h:mm A")}
                                                </div>
                                            )}

                                            {isMine && (
                                                <div className="msg-status">
                                                    {msg.readAt && index === lastReadIndex
                                                        ? `${t("chatWindow.read")} · ${dayjs(msg.readAt).format("h:mm A")}`
                                                        : isLastMine
                                                            ? t("chatWindow.delivered")
                                                            : ""}
                                                </div>
                                            )}

                                            {isMobile && Math.abs(swipeOffset) > 24 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        [isMine ? "right" : "left"]: "-28px",
                                                        fontSize: "16px",
                                                        color: "#6d4cff",
                                                        opacity: Math.min(
                                                            Math.abs(swipeOffset) / 60,
                                                            1
                                                        ),
                                                        pointerEvents: "none",
                                                        transition: "opacity 0.15s ease",
                                                    }}
                                                >
                                                    {isMine ? "↩" : "↪"}
                                                </div>
                                            )}
                                        </div>

                                        {showListSwipeTime && (
                                            <div
                                                className="msg-time list-swipe-time"
                                                style={{
                                                    opacity: Math.min(listSwipeReveal / 40, 1),
                                                }}
                                            >
                                                {dayjs(msg.createdAt).format("h:mm A")}
                                            </div>
                                        )}

                                        {!msg.unsent && (
                                            <div
                                                className={`msg-menu ${msg._id && openMenuId === msg._id ? "open" : ""}`}
                                            >
                                                {!isMobile && (
                                                    <button
                                                        className="menu-btn"
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(
                                                                openMenuId === msg._id
                                                                    ? null
                                                                    : msg._id
                                                            );
                                                        }}
                                                    >
                                                        ⋮
                                                    </button>
                                                )}

                                                {openMenuId === msg._id && (
                                                    <div className="menu-popup">
                                                        <div
                                                            className="menu-item"
                                                            onClick={() => {
                                                                setReplyTo(msg);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            {t("chatWindow.reply")}
                                                        </div>

                                                        {msg.type === "text" && (
                                                            <>
                                                                <div
                                                                    className="menu-item"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(msg.text);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                >
                                                                    {t("chatWindow.copy")}
                                                                </div>

                                                                {isMine && (
                                                                    <div
                                                                        className="menu-item"
                                                                        onClick={() => {
                                                                            setEditingMessage(msg);
                                                                            setText(msg.text);
                                                                            setReplyTo(null);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                    >
                                                                        {t("chatWindow.edit")}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {isMine && canUnsend && (
                                                            <div
                                                                className="menu-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    setDeletingMessageId(msg._id);

                                                                    setTimeout(() => {
                                                                        onUnsend?.(msg._id);
                                                                        setDeletingMessageId(null);
                                                                    }, 700);
                                                                }}
                                                            >
                                                                {t("chatWindow.unsend")}
                                                            </div>
                                                        )}

                                                        {!isMine && (
                                                            <div
                                                                className="menu-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    onDeleteForMe?.(msg._id);
                                                                }}
                                                            >
                                                                {t("chatWindow.deleteJustForMe")}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={messagesEndRef}></div>
                    </div>

                    {(showScrollDown || hasNewMessageBelow) && (
                        <button
                            className={`scroll-floating-btn ${hasNewMessageBelow ? "new-message" : ""}`}
                            type="button"
                            aria-label={t("chatWindow.scrollToBottom")}
                            onClick={() => {
                                const container = messagesContainerRef.current;
                                if (!container) return;

                                container.scrollTo({
                                    top: container.scrollHeight,
                                    behavior: "smooth",
                                });

                                wasNearBottomRef.current = true;
                                setHasNewMessageBelow(false);
                                setShowScrollDown(false);
                                setAutoScroll(true);
                            }}
                        >
                            <ChevronDown size={16} />
                        </button>
                    )}
                </div>

                {showTyping && (
                    <div className="typing-row">
                        <img
                            src={
                                other?.photo
                                    ? other.photo.startsWith("http")
                                        ? other.photo
                                        : `${API_URL}${other.photo}`
                                    : "/default-avatar.png"
                            }
                            className="msg-avatar"
                            alt={other?.username || t("chatWindow.user")}
                        />

                        <div className="typing-bubble">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                {replyTo && (
                    <div className="reply-preview">
                        <div className="reply-title">
                            {t("chatWindow.replyingTo", {
                                name: replyTo.sender?.name || t("chatWindow.user"),
                            })}
                        </div>
                        <div className="reply-text">
                            {replyTo.type === "image"
                                ? Array.isArray(replyTo.fileUrls) &&
                                    replyTo.fileUrls.length > 1
                                    ? `${replyTo.fileUrls.length} ${t("chatWindow.photos")}`
                                    : t("chatWindow.photo")
                                : replyTo.type === "video"
                                    ? Array.isArray(replyTo.fileUrls) &&
                                        replyTo.fileUrls.length > 1
                                        ? `${replyTo.fileUrls.length} ${t("chatWindow.videos")}`
                                        : t("chatWindow.video")
                                    : replyTo.text}
                        </div>
                        <button
                            className="reply-cancel"
                            type="button"
                            onClick={() => setReplyTo(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {editingMessage && (
                    <div className="reply-preview">
                        <div className="reply-title">{t("chatWindow.editingMessage")}</div>
                        <div className="reply-text">{editingMessage.text}</div>
                        <button
                            className="reply-cancel"
                            type="button"
                            onClick={() => {
                                setEditingMessage(null);
                                setText("");
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {selectedVideos.length > 0 && (
                    <div className="video-preview-box">
                        <div className="chat-video-preview-header">
                            <div className="chat-video-preview-title">
                                {uploadingVideo
                                    ? t("chatWindow.uploadingVideos", {
                                        count: selectedVideos.length,
                                    })
                                    : t("chatWindow.videosSelected", {
                                        count: selectedVideos.length,
                                    })}
                            </div>

                            <div className="chat-video-preview-actions">
                                <button
                                    type="button"
                                    className="chat-action-btn secondary"
                                    onClick={clearSelectedVideo}
                                    disabled={uploadingVideo}
                                    aria-label={t("chatWindow.removeAllVideos")}
                                >
                                    <X size={18} />
                                </button>

                                <button
                                    type="button"
                                    className="chat-action-btn primary send-btn"
                                    onClick={handleSendVideo}
                                    disabled={uploadingVideo}
                                    aria-label={t("chatWindow.sendVideos")}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="chat-video-preview-strip">
                            {videoPreviews.map((src, index) => (
                                <div className="chat-video-preview-item" key={src + index}>
                                    <video
                                        src={src}
                                        className="chat-video-preview-thumb"
                                        playsInline
                                        muted
                                    />
                                    <button
                                        type="button"
                                        className="chat-video-preview-remove"
                                        onClick={() => removeSelectedVideoAt(index)}
                                        disabled={uploadingVideo}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedImages.length > 0 && (
                    <div className="image-preview-box">
                        <div className="chat-image-preview-header">
                            <div className="chat-image-preview-title">
                                {uploadingImages
                                    ? t("chatWindow.uploadingImages", {
                                        count: selectedImages.length,
                                    })
                                    : t("chatWindow.imagesSelected", {
                                        count: selectedImages.length,
                                    })}
                            </div>

                            <div className="chat-image-preview-actions">
                                <button
                                    type="button"
                                    className="chat-action-btn secondary"
                                    onClick={clearSelectedImages}
                                    disabled={uploadingImages}
                                    aria-label={t("chatWindow.removeAllImages")}
                                >
                                    <X size={18} />
                                </button>

                                <button
                                    type="button"
                                    className="chat-action-btn primary send-btn"
                                    onClick={handleSendImages}
                                    disabled={uploadingImages}
                                    aria-label={t("chatWindow.sendImages")}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="chat-image-preview-strip">
                            {imagePreviews.map((src, index) => (
                                <div className="chat-image-preview-item" key={src + index}>
                                    <img
                                        src={src}
                                        alt={`Preview ${index + 1}`}
                                        className="chat-image-preview-thumb"
                                    />
                                    <button
                                        type="button"
                                        className="chat-image-preview-remove"
                                        onClick={() => removeSelectedImageAt(index)}
                                        disabled={uploadingImages}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isBlocked && (
                    <div className="chat-blocked-inline">
                        <div className="chat-blocked-inline-icon">
                            <Ban size={16} />
                        </div>
                        <div className="chat-blocked-inline-content">
                            <div className="chat-blocked-inline-title">
                                {t("chatWindow.conversationPaused")}
                            </div>
                            <div className="chat-blocked-inline-subtitle">
                                {t("chatWindow.blockedUserMessage", {
                                    name: other?.name || other?.username || t("chatWindow.thisUser"),
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <ChatInputBar
                    text={text}
                    chat={chat}
                    isBlocked={isBlocked}
                    editingMessage={editingMessage}
                    handleTyping={handleTyping}
                    handleSend={handleSend}
                    setEditingMessage={setEditingMessage}
                    setText={setText}
                    onPickMedia={() => mediaInputRef.current?.click()}
                    onPickCamera={() => cameraInputRef.current?.click()}
                    mediaInputRef={mediaInputRef}
                    handlePickMedia={handlePickMedia}
                    cameraInputRef={cameraInputRef}
                    handlePickCamera={handlePickCamera}
                    uploadingImages={uploadingImages}
                    uploadingVideo={uploadingVideo}
                    isMobileView={isMobileView}
                />
            </div>

            {openMediaViewer && (
                <div
                    className="media-viewer-overlay"
                    onClick={handleCloseMediaViewer}
                    onTouchStart={handleViewerTouchStart}
                    onTouchEnd={handleViewerTouchEnd}
                >
                    <button
                        type="button"
                        className="media-viewer-close"
                        onClick={handleCloseMediaViewer}
                    >
                        <X size={22} />
                    </button>

                    <div
                        className="media-viewer-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {viewerItems[viewerIndex]?.type === "video" ? (
                            <video
                                src={viewerItems[viewerIndex]?.src}
                                className="media-viewer-video"
                                controls
                                autoPlay
                                playsInline
                            />
                        ) : (
                            <img
                                src={viewerItems[viewerIndex]?.src}
                                alt={t("chatWindow.preview")}
                                className="media-viewer-image"
                                style={{ transform: `scale(${viewerZoom})` }}
                                onClick={handleViewerImageClick}
                            />
                        )}

                        {viewerItems.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className="media-viewer-nav prev"
                                    onClick={handlePrevViewerItem}
                                    disabled={viewerIndex === 0}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="media-viewer-nav next"
                                    onClick={handleNextViewerItem}
                                    disabled={viewerIndex === viewerItems.length - 1}
                                >
                                    ›
                                </button>
                            </>
                        )}

                        {viewerItems.length > 1 && viewerShowStrip && (
                            <div className="media-viewer-strip">
                                {viewerItems.map((item, idx) => (
                                    <button
                                        key={`${item.src}-${idx}`}
                                        type="button"
                                        className={`media-viewer-strip-item ${idx === viewerIndex ? "active" : ""}`}
                                        onClick={() => {
                                            setViewerIndex(idx);
                                            setViewerZoom(1);
                                        }}
                                    >
                                        {item.type === "video" ? (
                                            <video src={item.src} muted playsInline />
                                        ) : (
                                            <img src={item.src} alt={`Thumb ${idx + 1}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {viewerItems.length > 1 && (
                            <button
                                type="button"
                                className="media-viewer-strip-toggle"
                                onClick={toggleViewerStrip}
                            >
                                {viewerShowStrip ? t("chatWindow.hide") : t("chatWindow.show")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showUnfollowConfirm && (
                <div className="confirm-modal-overlay" onClick={closeUnfollowConfirm}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-avatar">
                            <img
                                src={
                                    pendingUnfollowUser?.photo
                                        ? pendingUnfollowUser.photo.startsWith("http")
                                            ? pendingUnfollowUser.photo
                                            : `${API_URL}${pendingUnfollowUser.photo}`
                                        : "/default-avatar.png"
                                }
                                alt={pendingUnfollowUser?.username || t("chatWindow.user")}
                            />
                        </div>

                        <h3>
                            {t("chatWindow.unfollowQuestion", {
                                name:
                                    pendingUnfollowUser?.name ||
                                    pendingUnfollowUser?.username ||
                                    t("chatWindow.thisUser"),
                            })}
                        </h3>

                        <p>{t("chatWindow.unfollowDescription")}</p>

                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-btn danger"
                                onClick={confirmUnfollow}
                                disabled={followLoading}
                            >
                                {followLoading
                                    ? t("chatWindow.unfollowing")
                                    : t("chatWindow.unfollow")}
                            </button>

                            <button
                                type="button"
                                className="confirm-btn"
                                onClick={closeUnfollowConfirm}
                                disabled={followLoading}
                            >
                                {t("chatWindow.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div
                    className="report-modal-overlay"
                    onClick={() => {
                        if (reportLoading) return;
                        setShowReportModal(false);
                    }}
                >
                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="report-modal-top">
                            <h3>
                                {t("chatWindow.reportUser", {
                                    name: other?.name || other?.username || t("chatWindow.user"),
                                })}
                            </h3>
                            <p>{t("chatWindow.reportDescription")}</p>
                        </div>

                        <div className="report-reasons">
                            {reportOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`report-reason-btn ${reportReason === option.value ? "active" : ""}`}
                                    onClick={() => setReportReason(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="report-textarea"
                            placeholder={t("chatWindow.additionalDetails")}
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            maxLength={300}
                        />

                        <div className="report-char-count">
                            {reportDetails.length}/300
                        </div>

                        <div className="report-modal-actions">
                            <button
                                type="button"
                                className="report-submit-btn"
                                onClick={handleSubmitReport}
                                disabled={!reportReason || reportLoading}
                            >
                                {reportLoading
                                    ? t("chatWindow.sending")
                                    : t("chatWindow.submitReport")}
                            </button>

                            <button
                                type="button"
                                className="report-cancel-btn"
                                onClick={() => {
                                    if (reportLoading) return;
                                    setShowReportModal(false);
                                }}
                            >
                                {t("chatWindow.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportToast && <div className="report-toast">{reportToast}</div>}

            {showBlockConfirm && (
                <div className="confirm-modal-overlay" onClick={closeBlockModals}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-avatar">
                            <img
                                src={
                                    other?.photo
                                        ? other.photo.startsWith("http")
                                            ? other.photo
                                            : `${API_URL}${other.photo}`
                                        : "/default-avatar.png"
                                }
                                alt={other?.username || t("chatWindow.user")}
                            />
                        </div>

                        <h3>
                            {t("chatWindow.blockQuestion", {
                                name: other?.name || other?.username || t("chatWindow.user"),
                            })}
                        </h3>

                        <p>{t("chatWindow.blockDescription")}</p>

                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-btn danger"
                                onClick={confirmBlockUser}
                                disabled={blockLoading}
                            >
                                {blockLoading
                                    ? t("chatWindow.blocking")
                                    : t("chatWindow.block")}
                            </button>

                            <button
                                type="button"
                                className="confirm-btn"
                                onClick={closeBlockModals}
                                disabled={blockLoading}
                            >
                                {t("chatWindow.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUnblockConfirm && (
                <div className="confirm-modal-overlay" onClick={closeBlockModals}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-avatar">
                            <img
                                src={
                                    other?.photo
                                        ? other.photo.startsWith("http")
                                            ? other.photo
                                            : `${API_URL}${other.photo}`
                                        : "/default-avatar.png"
                                }
                                alt={other?.username || t("chatWindow.user")}
                            />
                        </div>

                        <h3>
                            {t("chatWindow.unblockQuestion", {
                                name: other?.name || other?.username || t("chatWindow.user"),
                            })}
                        </h3>

                        <p>{t("chatWindow.unblockDescription")}</p>

                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-btn danger"
                                onClick={confirmUnblockUser}
                                disabled={blockLoading}
                            >
                                {blockLoading
                                    ? t("chatWindow.unblocking")
                                    : t("chatWindow.unblock")}
                            </button>

                            <button
                                type="button"
                                className="confirm-btn"
                                onClick={closeBlockModals}
                                disabled={blockLoading}
                            >
                                {t("chatWindow.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}