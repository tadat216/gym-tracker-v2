import { cn } from "@/lib/utils";

interface FieldLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldLabel({ htmlFor, children, className }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </label>
  );
}

export { FieldLabel };
export type { FieldLabelProps };
