import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", className, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between text-left focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <span className="truncate mr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-[100] mt-1 w-full min-w-max bg-white border border-[#E2E8F0] shadow-xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-[#F8FAFC] transition-colors flex items-center justify-between group",
                  value === opt.value ? "bg-[#F1F5F9] text-[#0A1628] font-medium" : "text-[#475569]"
                )}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check className="w-3.5 h-3.5 text-[#C9A84C]" />}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-[#94A3B8]">No options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
