// src/components/filters/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-bar"
        placeholder="Search decisions, action items, or topics..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}