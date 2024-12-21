import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { ReactMic } from "react-mic";
import { FaMicrophone, FaPaperPlane, FaSearchPlus, FaSearchMinus } from "react-icons/fa";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();

  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) return ".";
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);

  useEffect(() => {
    if (message) {
      setMessages((prev) => [...prev, { from: "avatar", text: message.text }]);
    }
  }, [message]);

  const sendMessage = () => {
    const text = input.current.value || "...";
    if (!loading) {
      setMessages((prev) => [...prev, { from: "user", text }]);
      chat(text);
      input.current.value = "";
    }
  };

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => setIsRecording(false);

  const onStop = async (recordedData) => {
    sendAudioToBackend(recordedData.blob);
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice-input.mp3");

    try {
      const response = await fetch("http://localhost:3000/stt", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setMessages((prev) => [...prev, { from: "user", text: result.text }]);
      chat(result.text);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'audio :", error);
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* Header */}
      <div className="fixed top-4 left-4 backdrop-blur-md bg-white bg-opacity-60 p-4 rounded-lg shadow-lg z-10">
        <h1 className="font-extrabold text-xl text-gray-800">Virtual Assistant</h1>
        <p className="text-sm text-gray-600">Your reliable companion for assistance.</p>
      </div>

      {/* Zoom Buttons */}
      <div className="fixed bottom-8 left-8 flex flex-col items-center gap-4 pointer-events-auto z-10">
        <button
          onClick={() => setCameraZoomed(true)}
          className="p-4 rounded-full shadow-md bg-green-500 text-white hover:bg-green-600 transition-all"
          title="Zoom In"
        >
          <FaSearchPlus size={20} />
        </button>
        <button
          onClick={() => setCameraZoomed(false)}
          className="p-4 rounded-full shadow-md bg-blue-500 text-white hover:bg-blue-600 transition-all"
          title="Zoom Out"
        >
          <FaSearchMinus size={20} />
        </button>
      </div>

      {/* Conversation Section */}
      <div
        className="fixed bottom-[100px] right-4 w-[400px] h-[250px] bg-white shadow-lg rounded-lg overflow-y-auto p-4 space-y-2 pointer-events-auto conversation-container"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`text-sm p-2 rounded-lg ${
              msg.from === "user" ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 italic text-sm text-left">
            Typing{loadingText}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="fixed bottom-4 right-4 w-[400px] flex flex-col gap-4 pointer-events-auto">
        <div className="relative w-full">
          <input
            className="w-full placeholder:text-gray-600 placeholder:italic p-3 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message..."
            ref={input}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {/* Microphone Button */}
            <button
              className={`p-2 rounded-full shadow-md transition-all ${
                isRecording
                  ? "bg-green-500 text-white animate-pulse"
                  : "bg-gray-300 text-green-500 hover:bg-green-500 hover:text-white"
              }`}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <FaMicrophone size={20} />
            </button>

            {/* Animated Wave */}
            {isRecording && (
              <div className="wave-animation flex items-center gap-1">
                <span className="wave bg-green-500 h-3 w-3 rounded-full animate-ping"></span>
                <span className="wave bg-green-500 h-3 w-3 rounded-full animate-ping delay-150"></span>
                <span className="wave bg-green-500 h-3 w-3 rounded-full animate-ping delay-300"></span>
              </div>
            )}

            {/* ReactMic */}
            <ReactMic
              record={isRecording}
              className="hidden"
              onStop={onStop}
              mimeType="audio/mp3"
            />

            {/* Send Button */}
            <button
              disabled={loading || message}
              onClick={sendMessage}
              className={`p-3 rounded-full shadow-md transition-all ${
                loading || message
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              title="Send"
            >
              <FaPaperPlane size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
