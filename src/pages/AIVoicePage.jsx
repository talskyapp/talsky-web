import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Captions,
    Mic,
    PhoneOff,
    Settings2,
    Sparkles,
    Volume2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { API_URL } from "../lib/config";
import "../styles/AIVoicePage.css";

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

export default function AIVoicePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const peerConnectionRef = useRef(null);
    const dataChannelRef = useRef(null);
    const microphoneStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const [voiceStatus, setVoiceStatus] = useState("idle");
    const [voiceError, setVoiceError] = useState("");
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [userTranscript, setUserTranscript] = useState("");
    const [assistantTranscript, setAssistantTranscript] = useState("");

    const currentUser = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const targetLanguage =
        searchParams.get("language") ||
        currentUser?.languageToLearn?.[0] ||
        currentUser?.activeLearningLanguage ||
        "Japanese";

    const targetLanguageCode =
        searchParams.get("languageCode") ||
        currentUser?.languageToLearnCode ||
        "";

    const targetLanguageVariant =
        searchParams.get("languageVariant") ||
        currentUser?.languageVariant ||
        "";

    const userLevel =
        searchParams.get("level") ||
        currentUser?.activeLevel ||
        "Beginner";

    const supportLanguage =
        currentUser?.nativeLanguage ||
        currentUser?.appLanguage ||
        "English";

    const isConnecting =
        voiceStatus === "requesting" ||
        voiceStatus === "connecting";

    const activeVoiceStatuses = [
        "connected",
        "listening",
        "user-speaking",
        "thinking",
        "speaking",
    ];

    const isConnected = activeVoiceStatuses.includes(voiceStatus);

    const closeRealtimeConnection = () => {
        dataChannelRef.current?.close();
        dataChannelRef.current = null;

        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        microphoneStreamRef.current?.getTracks().forEach((track) => {
            track.stop();
        });

        microphoneStreamRef.current = null;

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    };

    const stopConversation = () => {
        closeRealtimeConnection();
        setVoiceError("");
        setVoiceStatus("idle");
    };

    const handleStartConversation = async () => {
        if (isConnecting || isConnected) return;

        try {
            setVoiceError("");
            setVoiceStatus("requesting");

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Your browser does not support microphone access."
                );
            }

            if (!window.RTCPeerConnection) {
                throw new Error(
                    "Your browser does not support real-time voice connections."
                );
            }

            const microphoneStream =
                await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

            microphoneStreamRef.current = microphoneStream;
            setVoiceStatus("connecting");

            const peerConnection = new RTCPeerConnection();

            peerConnectionRef.current = peerConnection;

            peerConnection.ontrack = async (event) => {
                const [remoteStream] = event.streams;

                if (!remoteAudioRef.current || !remoteStream) return;

                remoteAudioRef.current.srcObject = remoteStream;

                try {
                    await remoteAudioRef.current.play();
                } catch (audioError) {
                    console.error(
                        "Remote audio playback failed:",
                        audioError
                    );
                }
            };

            peerConnection.onconnectionstatechange = () => {
                const connectionState = peerConnection.connectionState;

                if (connectionState === "connected") {
                    setVoiceStatus("listening");
                    return;
                }

                if (connectionState === "failed") {
                    closeRealtimeConnection();
                    setVoiceStatus("error");
                    setVoiceError(
                        "The real-time voice connection failed."
                    );
                }
            };

            microphoneStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, microphoneStream);
            });

            const dataChannel =
                peerConnection.createDataChannel("oai-events");

            dataChannelRef.current = dataChannel;

            dataChannel.onopen = () => {
                setVoiceStatus("listening");
            };

            dataChannel.onerror = (event) => {
                console.error("Realtime data channel error:", event);
            };

            dataChannel.onmessage = (messageEvent) => {
                try {
                    const event = JSON.parse(messageEvent.data);

                    switch (event.type) {
                        case "session.created":
                        case "session.updated":
                            setVoiceStatus("listening");
                            break;

                        case "input_audio_buffer.speech_started":
                            setVoiceStatus("user-speaking");
                            setUserTranscript("");
                            break;

                        case "input_audio_buffer.speech_stopped":
                            setVoiceStatus("thinking");
                            break;

                        case "response.created":
                            setVoiceStatus("thinking");
                            setAssistantTranscript("");
                            break;

                        case "conversation.item.input_audio_transcription.delta":
                            setUserTranscript((previousText) =>
                                `${previousText}${event.delta || ""}`
                            );
                            break;

                        case "conversation.item.input_audio_transcription.completed":
                            setUserTranscript(event.transcript || "");
                            break;

                        case "response.output_audio_transcript.delta":
                            setVoiceStatus("speaking");

                            setAssistantTranscript((previousText) =>
                                `${previousText}${event.delta || ""}`
                            );
                            break;

                        case "response.output_audio_transcript.done":
                            setAssistantTranscript((previousText) =>
                                event.transcript || previousText
                            );
                            break;

                        case "response.output_audio.delta":
                        case "response.audio.delta":
                            setVoiceStatus("speaking");
                            break;

                        case "response.output_audio.done":
                        case "response.audio.done":
                        case "response.done":
                        case "response.cancelled":
                            setVoiceStatus("listening");
                            break;

                        case "error":
                            console.error("OpenAI Realtime error:", event.error);

                            setVoiceError(
                                event?.error?.message ||
                                "A real-time voice error occurred."
                            );
                            break;

                        default:
                            break;
                    }
                } catch (error) {
                    console.error(
                        "Could not read realtime event:",
                        error
                    );
                }
            };

            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(offer);

            const token = getAuthToken();

            if (!token) {
                throw new Error(
                    "Your session expired. Please sign in again."
                );
            }

            const query = new URLSearchParams({
                language: targetLanguage,
                languageCode: targetLanguageCode,
                languageVariant: targetLanguageVariant,
                supportLanguage,
                level: userLevel,
            });

            const response = await fetch(
                `${API_URL}/api/ai-tutor/realtime/session?${query.toString()}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/sdp",
                    },
                    credentials: "include",
                    body: peerConnection.localDescription?.sdp || offer.sdp,
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.error ||
                    "The realtime session could not be created."
                );
            }

            const answerSdp = await response.text();

            await peerConnection.setRemoteDescription({
                type: "answer",
                sdp: answerSdp,
            });
        } catch (error) {
            console.error("Start realtime conversation error:", error);

            closeRealtimeConnection();
            setVoiceStatus("error");

            if (error?.name === "NotAllowedError") {
                setVoiceError(
                    "Microphone permission was denied. Please allow access in your browser settings."
                );
                return;
            }

            if (error?.name === "NotFoundError") {
                setVoiceError(
                    "No microphone was found on this device."
                );
                return;
            }

            setVoiceError(
                error?.message ||
                "The real-time conversation could not be started."
            );
        }
    };

    useEffect(() => {
        return () => {
            dataChannelRef.current?.close();
            peerConnectionRef.current?.close();

            microphoneStreamRef.current
                ?.getTracks()
                .forEach((track) => {
                    track.stop();
                });
        };
    }, []);

    const statusText = {
        idle: "Ready to practice",
        requesting: "Requesting microphone...",
        connecting: "Connecting to TalSky AI...",
        connected: "Connected",
        listening: "Listening...",
        "user-speaking": "Listening to you...",
        thinking: "TalSky AI is thinking...",
        speaking: "TalSky AI is speaking...",
        error: "Connection unavailable",
    };

    return (
        <div className="ai-voice-page">
            <div className="ai-voice-shell">
                <audio ref={remoteAudioRef} autoPlay />

                <header className="ai-voice-header">
                    <button
                        type="button"
                        className="ai-voice-back"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="ai-voice-heading">
                        <div className="ai-voice-heading-icon">
                            <Sparkles size={18} />
                        </div>

                        <div>
                            <h1>Speak with AI</h1>
                            <p>Real-time conversation practice</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="ai-voice-settings"
                        aria-label="Voice settings"
                    >
                        <Settings2 size={20} />
                    </button>
                </header>

                <main className="ai-voice-stage">
                    <div className="ai-voice-language">
                        <span>{targetLanguage}</span>
                        <span className="ai-voice-language-dot" />
                        <span>{userLevel}</span>
                    </div>

                    <div
                        className={`ai-voice-avatar-area ${isConnected ? "active" : ""
                            }`}
                    >
                        <div className="ai-voice-orbit orbit-one" />
                        <div className="ai-voice-orbit orbit-two" />

                        <div className="ai-voice-avatar">
                            <img
                                src="/talsky-ai-logo.png"
                                alt="TalSky AI"
                            />
                        </div>
                    </div>

                    <div className={`ai-voice-status ${voiceStatus}`}>
                        <span className="ai-voice-status-dot" />
                        {statusText[voiceStatus]}
                    </div>

                    <h2>
                        {voiceStatus === "speaking"
                            ? "TalSky AI is responding"
                            : voiceStatus === "thinking"
                                ? "Preparing a response"
                                : isConnected
                                    ? "Conversation in progress"
                                    : "Start a conversation"}
                    </h2>

                    <p className="ai-voice-description">
                        {isConnected
                            ? `Speak naturally in ${targetLanguage}. TalSky AI is listening.`
                            : "Speak naturally and TalSky AI will listen, respond, and help you practice in real time."}
                    </p>

                    {captionsEnabled ? (
                        <div className="ai-voice-captions">
                            {userTranscript ? (
                                <div className="ai-voice-caption user">
                                    <span>You</span>
                                    <p>{userTranscript}</p>
                                </div>
                            ) : null}

                            <div className="ai-voice-caption assistant">
                                <Volume2 size={17} />

                                <div>
                                    <span>TalSky AI</span>

                                    <p>
                                        {assistantTranscript ||
                                            (voiceStatus === "user-speaking"
                                                ? "I’m listening to you..."
                                                : voiceStatus === "thinking"
                                                    ? "Preparing a helpful response..."
                                                    : isConnected
                                                        ? `Say something in ${targetLanguage} to begin.`
                                                        : "Your live conversation will appear here.")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="ai-voice-captions-off">
                            Captions are off
                        </div>
                    )}
                </main>

                <footer className="ai-voice-footer">
                    <button
                        type="button"
                        className={`ai-voice-control secondary ${captionsEnabled ? "active" : ""
                            }`}
                        aria-label={
                            captionsEnabled
                                ? "Turn captions off"
                                : "Turn captions on"
                        }
                        aria-pressed={captionsEnabled}
                        onClick={() =>
                            setCaptionsEnabled((currentValue) => !currentValue)
                        }
                    >
                        <Captions size={21} />
                    </button>

                    <button
                        type="button"
                        className="ai-voice-start"
                        onClick={handleStartConversation}
                        disabled={isConnecting || isConnected}
                    >
                        <Mic size={22} />

                        <span>
                            {voiceStatus === "requesting"
                                ? "Requesting microphone..."
                                : voiceStatus === "connecting"
                                    ? "Connecting..."
                                    : isConnected
                                        ? "Conversation active"
                                        : "Start conversation"}
                        </span>
                    </button>

                    <button
                        type="button"
                        className="ai-voice-control end"
                        aria-label="End conversation"
                        onClick={stopConversation}
                        disabled={!isConnecting && !isConnected}
                    >
                        <PhoneOff size={21} />
                    </button>
                </footer>

                {voiceError ? (
                    <p className="ai-voice-error">
                        {voiceError}
                    </p>
                ) : null}

                <p className="ai-voice-privacy">
                    Your microphone activates only after you start.
                </p>
            </div>
        </div>
    );
}