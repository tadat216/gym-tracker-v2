import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

function FormField({
  id, label, value, onChange, type = "text", placeholder, error, className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">
        {label}
      </label>
      <Input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} aria-invalid={!!error}
        className={cn("h-auto rounded-[10px] bg-white/3 px-3.5 py-3 text-[15px] font-medium", error && "border-destructive")}
      />
      {error ? <p role="alert" className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
