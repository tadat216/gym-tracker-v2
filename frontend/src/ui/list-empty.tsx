import type { LucideIcon } from "lucide-react";

interface ListEmptyProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function ListEmpty({ icon: Icon, title, description }: ListEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-[20px] border border-primary/10 bg-gradient-to-br from-muted to-muted/60">
        <Icon className="size-7 text-muted-foreground/40" />
      </div>
      <p className="text-base font-bold text-muted-foreground">{title}</p>
      <p className="mt-1.5 text-[13px] text-muted-foreground/50">{description}</p>
    </div>
  );
}

export { ListEmpty };
export type { ListEmptyProps };
