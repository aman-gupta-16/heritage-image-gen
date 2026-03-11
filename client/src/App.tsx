import { useCallback, useEffect, useState } from "react";
import "./App.css";
import type { ChatEntry, RoomImage } from "./types";
import FloorPlanUploader from "./components/FloorPlanUploader";
import PromptInput from "./components/PromptInput";
import GenerateButton from "./components/GenerateButton";
import ImageGallery from "./components/ImageGallery";
import ChatHistory, { ChatDetail } from "./components/ChatHistory";
import ColorSelector from "./components/ColorSelector";
import ImageCropper from "./components/ImageCropper";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RoomImage[]>([]);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showCropper, setShowCropper] = useState(false);

  // Load history from API on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/ai/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        const entries: ChatEntry[] = data.map((d) => ({
          id: d.id,
          prompt: d.prompt,
          originalImage: d.originalImage,
          results: d.rooms,
          timestamp: new Date(d.createdAt),
        }));
        setHistory(entries);
      })
      .catch(console.error);
  }, []);

  const selectedEntry = history.find((e) => e.id === selectedId) ?? null;

  const handleFileSelect = useCallback((f: File, dataUrl: string) => {
    setFile(f);
    setPreview(dataUrl);
    setResults([]);
    setSelectedId(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResults([]);
  }, []);

  const handleCropDone = useCallback((croppedFile: File, croppedPreview: string) => {
    setFile(croppedFile);
    setPreview(croppedPreview);
    setShowCropper(false);
  }, []);

  const handleGenerate = async () => {
    if (!file || !prompt.trim()) return;
    setLoading(true);
    setResults([]);
    setSelectedId(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("image", file);
      if (selectedColors.length > 0) {
        formData.append("colors", JSON.stringify(selectedColors));
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/ai/generate-rooms", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const rooms: RoomImage[] = data.rooms ?? [];

      setResults(rooms);

      const entry: ChatEntry = {
        id: data.generationId,
        prompt: prompt.trim(),
        originalImage: data.originalImage,
        results: rooms,
        timestamp: new Date(data.createdAt),
      };
      setHistory((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = (entry: ChatEntry) => {
    setSelectedId(entry.id);
    setResults([]);
  };

  const handleNewChat = () => {
    setFile(null);
    setPreview(null);
    setPrompt("");
    setResults([]);
    setSelectedId(null);
    setSelectedColors([]);
  };

  const showInputArea = !selectedEntry;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } shrink-0 border-r border-gray-200 bg-white flex flex-col transition-all duration-200 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 whitespace-nowrap">History</h2>
          <button
            onClick={handleNewChat}
            className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatHistory
            entries={history}
            onSelect={handleSelectEntry}
            selectedId={selectedId}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold">RoomGen AI</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedEntry ? (
            /* Viewing a past generation */
            <div className="max-w-4xl mx-auto px-4 py-8">
              <ChatDetail entry={selectedEntry} />
            </div>
          ) : (
            /* New generation flow */
            <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6 h-full">
              {!preview && results.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Generate Room Interiors</h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                      Upload an architectural floor plan, describe what you'd like, and AI will
                      generate beautiful room interior images.
                    </p>
                  </div>
                </div>
              )}

              {(preview || results.length > 0) && (
                <div className="flex-1 flex flex-col gap-6">
                  {preview && <FloorPlanUploader file={file} preview={preview} onFileSelect={handleFileSelect} onClear={handleClearFile} onEdit={() => setShowCropper(true)} />}
                  {results.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700">Generated Rooms</h3>
                      <ImageGallery images={results} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom input bar */}
        {showInputArea && (
          <div className="border-t border-gray-200 bg-white px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-3">
              {!preview && (
                <FloorPlanUploader
                  file={file}
                  preview={preview}
                  onFileSelect={handleFileSelect}
                  onClear={handleClearFile}
                  onEdit={() => setShowCropper(true)}
                />
              )}
              <ColorSelector
                selectedColors={selectedColors}
                onChange={setSelectedColors}
              />
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    onSubmit={handleGenerate}
                    disabled={loading}
                  />
                </div>
                <GenerateButton
                  onClick={handleGenerate}
                  disabled={!file || !prompt.trim() || loading}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Image Cropper Modal */}
      {showCropper && preview && (
        <ImageCropper
          imageSrc={preview}
          onCropDone={handleCropDone}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>
  );
}

export default App;
