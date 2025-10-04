"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Send, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function startRecording() {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const mime = mediaRecorderRef.current?.mimeType;
        const blob = new Blob(chunksRef.current, mime ? { type: mime } : undefined);
        try {
          await sendAudioToBackend(blob);
        } catch (e) {
          console.error("sendAudioToBackend error", e);
          setErrorMessage(e instanceof Error ? e.message : "Failed to send audio to backend");
        }
        chunksRef.current = [];
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMessage("Microphone permission denied or unavailable.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  async function sendToN8n(text: string) {
    setIsLoading(true);
    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: text,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Send to n8n workflow (test webhook expects { message })
      const n8nRes = await fetch("/api/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!n8nRes.ok) {
        throw new Error(`n8n workflow failed (${n8nRes.status})`);
      }
      // Be permissive about response shape
      const raw = await n8nRes.text();
      let n8nData: { response: string } = { response: "" };
      try {
        const parsed = JSON.parse(raw);
        // Accept { response } or { output } or plain string
        if (typeof parsed === 'string') n8nData.response = parsed;
        else n8nData.response = parsed.response ?? parsed.output ?? "";
      } catch {
        n8nData.response = raw || "";
      }

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: n8nData.response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Fire TTS with n8n response
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: n8nData.response }),
      });
      if (!ttsRes.ok) {
        const errText = await ttsRes.text().catch(() => "");
        throw new Error(`TTS request failed (${ttsRes.status}): ${errText}`);
      }
      const audioBuffer = await ttsRes.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("sendToN8n error", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to process message");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendAudioToBackend(blob: Blob) {
    const form = new FormData();
    form.append("file", blob, "audio.webm");
    const res = await fetch("/api/stt", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`STT request failed (${res.status}): ${errText}`);
    }
    const data = (await res.json()) as { text: string };
    if (data?.text) {
      setLastTranscript(data.text);
      await sendToN8n(data.text);
    }
  }

  async function handleTextSubmit() {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    await sendToN8n(text);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-2rem)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Voice Agent
            </h1>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation by typing a message or using voice input</p>
              </div>
            )}
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {/* Voice Input Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center justify-center h-12 w-12 rounded-full border transition-colors ${isRecording
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                disabled={isLoading}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleTextSubmit}
                disabled={!inputText.trim() || isLoading}
                className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {/* Status Messages */}
            {isRecording && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                Recording... Click the square to stop
              </p>
            )}
            {lastTranscript && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                Last transcript: "{lastTranscript}"
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
