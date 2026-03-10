import type { ChatEntry } from "../types";
import ImageGallery from "./ImageGallery";

interface ChatHistoryProps {
  entries: ChatEntry[];
  onSelect: (entry: ChatEntry) => void;
  selectedId: string | null;
}

export default function ChatHistory({
  entries,
  onSelect,
  selectedId,
}: ChatHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
        <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm text-center">No generations yet.<br />Upload a floor plan to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onSelect(entry)}
          className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
            selectedId === entry.id
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <p className="font-medium truncate">{entry.prompt}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {entry.results.length} room{entry.results.length !== 1 ? "s" : ""} ·{" "}
            {new Date(entry.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </button>
      ))}
    </div>
  );
}

interface ChatDetailProps {
  entry: ChatEntry;
}

export function ChatDetail({ entry }: ChatDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">{entry.prompt}</p>
          {entry.originalImage && (
            <img
              src={entry.originalImage}
              alt="Floor plan"
              className="mt-2 max-h-40 rounded-lg border border-gray-200 object-contain"
            />
          )}
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <ImageGallery images={entry.results} />
        </div>
      </div>
    </div>
  );
}
