import { cn } from "@/lib/utils";

interface SegmentedToggleProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={cn(
        "flex rounded-[10px] border border-input bg-white/3",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-[9px] px-3 py-2.5 text-[13px] font-medium transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground font-bold"
              : "text-muted-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedToggle };
export type { SegmentedToggleProps };
