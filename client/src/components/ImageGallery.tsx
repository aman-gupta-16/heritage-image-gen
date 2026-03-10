import type { RoomImage } from "../types";

interface ImageGalleryProps {
  images: RoomImage[];
}

function downloadImage(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((img, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden group"
        >
          <div className="relative">
            <img
              src={img.imageUrl}
              alt={img.roomName}
              className="w-full h-48 object-cover"
            />
            <button
              onClick={() => downloadImage(img.imageUrl, img.roomName)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label={`Download ${img.roomName}`}
            >
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{img.roomName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
