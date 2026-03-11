import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedFile: File, croppedPreview: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageSrc,
  onCropDone,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const { file, dataUrl } = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropDone(file, dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#111" },
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-900">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs text-gray-400 whitespace-nowrap">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function getCroppedImg(
  imageSrc: string,
  crop: Area
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );
      const dataUrl = canvas.toDataURL("image/png");
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Blob creation failed"));
          return;
        }
        const file = new File([blob], "cropped-floorplan.png", {
          type: "image/png",
        });
        resolve({ file, dataUrl });
      }, "image/png");
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}
