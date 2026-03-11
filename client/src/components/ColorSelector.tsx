interface ColorSelectorProps {
  selectedColors: string[];
  onChange: (colors: string[]) => void;
}

const PRESET_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Cream", value: "#FFFDD0" },
  { name: "Beige", value: "#F5F5DC" },
  { name: "Light Gray", value: "#D3D3D3" },
  { name: "Warm Gray", value: "#A89F91" },
  { name: "Charcoal", value: "#36454F" },
  { name: "Navy", value: "#001F3F" },
  { name: "Sky Blue", value: "#87CEEB" },
  { name: "Sage Green", value: "#B2AC88" },
  { name: "Olive", value: "#808000" },
  { name: "Terracotta", value: "#E2725B" },
  { name: "Burgundy", value: "#800020" },
  { name: "Blush Pink", value: "#DE6FA1" },
  { name: "Mustard", value: "#FFDB58" },
  { name: "Walnut", value: "#5D432C" },
  { name: "Black", value: "#000000" },
];

export default function ColorSelector({
  selectedColors,
  onChange,
}: ColorSelectorProps) {
  const toggle = (color: string) => {
    if (selectedColors.includes(color)) {
      onChange(selectedColors.filter((c) => c !== color));
    } else {
      onChange([...selectedColors, color]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Color Palette
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => {
          const isSelected = selectedColors.includes(c.value);
          const isLight =
            c.value === "#FFFFFF" ||
            c.value === "#FFFDD0" ||
            c.value === "#F5F5DC" ||
            c.value === "#FFDB58";
          return (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => toggle(c.value)}
              className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-200 scale-110"
                  : isLight
                  ? "border-gray-300 hover:scale-105"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
            >
              {isSelected && (
                <svg
                  className={`w-3.5 h-3.5 ${
                    isLight ? "text-gray-700" : "text-white"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {selectedColors.length > 0 && (
        <p className="text-xs text-gray-400">
          {selectedColors.length} color{selectedColors.length > 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
}
