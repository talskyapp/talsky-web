import {
    Ban,
    Send,
    Smile,
    X,
    Image as MediaIcon,
    Camera,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function ChatInputBar({
    text,
    chat,
    isBlocked,
    editingMessage,
    handleTyping,
    handleSend,
    setEditingMessage,
    setText,
    onPickMedia,
    onPickCamera,
    mediaInputRef,
    handlePickMedia,
    cameraInputRef,
    handlePickCamera,
    uploadingImages,
    uploadingVideo,
    isMobileView,
}) {
    const { t } = useTranslation();

    return (
        <div className="chat-input">
            <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
                onChange={handlePickMedia}
            />

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handlePickCamera}
            />

            {!editingMessage && isMobileView && !isBlocked && (
                <button
                    type="button"
                    className="chat-action-btn secondary camera-btn"
                    aria-label={t("chatInput.openCamera")}
                    onClick={onPickCamera}
                    disabled={uploadingImages || uploadingVideo}
                >
                    <Camera size={18} />
                </button>
            )}

            <input
                value={text}
                disabled={isBlocked}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                    if (isBlocked) return;

                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }

                    if (e.key === "Escape" && editingMessage) {
                        setEditingMessage(null);
                        setText("");

                        if (window.socket && chat?._id) {
                            window.socket.emit("stop_typing", {
                                chatId: chat._id,
                            });
                        }
                    }
                }}
                placeholder={
                    isBlocked
                        ? t("chatInput.messagingUnavailable")
                        : editingMessage
                            ? t("chatInput.editMessage")
                            : t("chatInput.typeMessage")
                }
            />

            <div className="chat-input-actions">
                {isBlocked ? (
                    <button
                        type="button"
                        className="chat-action-btn primary send-btn disabled-btn"
                        disabled
                        aria-label={t("chatInput.blocked")}
                    >
                        <Ban size={18} />
                    </button>
                ) : editingMessage ? (
                    <>
                        <button
                            type="button"
                            className="chat-action-btn secondary"
                            onClick={() => {
                                setEditingMessage(null);
                                setText("");
                            }}
                            aria-label={t("chatInput.cancelEditing")}
                        >
                            <X size={18} />
                        </button>

                        <button
                            type="button"
                            className="chat-action-btn primary send-btn"
                            onClick={handleSend}
                            disabled={!text.trim()}
                            aria-label={t("chatInput.saveMessage")}
                        >
                            <Send size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className="chat-action-btn secondary"
                            aria-label={t("chatInput.emoji")}
                        >
                            <Smile size={18} />
                        </button>

                        <button
                            type="button"
                            className="chat-action-btn secondary"
                            aria-label={t("chatInput.chooseMedia")}
                            onClick={onPickMedia}
                            disabled={uploadingImages || uploadingVideo}
                        >
                            <MediaIcon size={18} />
                        </button>

                        <button
                            type="button"
                            className={`chat-action-btn primary send-btn ${!text.trim() ? "disabled-btn" : ""
                                }`}
                            onClick={handleSend}
                            disabled={!text.trim()}
                            aria-label={t("chatInput.sendMessage")}
                        >
                            <Send size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}