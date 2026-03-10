interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      rows={2}
      placeholder="Convert this floor plan into empty room interior images..."
      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none disabled:opacity-50 transition"
    />
  );
}
