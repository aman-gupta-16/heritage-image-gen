import { useCallback, useRef, useState } from "react";

interface FloorPlanUploaderProps {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File, preview: string) => void;
  onClear: () => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export default function FloorPlanUploader({
  file,
  preview,
  onFileSelect,
  onClear,
}: FloorPlanUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (f: File) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return;
      const reader = new FileReader();
      reader.onload = () => {
        onFileSelect(f, reader.result as string);
      };
      reader.readAsDataURL(f);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <img
          src={preview}
          alt="Floor plan preview"
          className="w-full max-h-64 object-contain bg-gray-50"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <span className="bg-white/90 text-xs text-gray-600 px-2 py-1 rounded-md shadow-sm">
            {file?.name}
          </span>
          <button
            onClick={onClear}
            className="bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 p-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
            aria-label="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragActive
          ? "border-indigo-400 bg-indigo-50"
          : "border-gray-300 hover:border-gray-400 bg-gray-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleChange}
        className="hidden"
      />
      <svg
        className="mx-auto h-10 w-10 text-gray-400 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm text-gray-600 font-medium">
        Drop your floor plan here or{" "}
        <span className="text-indigo-600">browse</span>
      </p>
      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
    </div>
  );
}
