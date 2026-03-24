import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/ui/sheet";

interface FormSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function FormSheet({ open, title, onClose, children }: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[20px] border-t border-primary/10 bg-gradient-to-b from-card to-card/80">
        <div className="mx-auto mt-2 mb-4 h-1 w-9 rounded-full bg-muted" />
        <SheetHeader>
          <SheetTitle className="text-[22px] font-extrabold">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export { FormSheet };
export type { FormSheetProps };
