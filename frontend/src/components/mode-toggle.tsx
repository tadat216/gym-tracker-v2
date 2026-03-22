import { Moon, Sun } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { buttonVariants } from "@/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Toggle theme"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute right-0 z-50 min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
          )}
        >
          <button
            role="menuitem"
            type="button"
            className="relative flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground"
            onClick={() => {
              setTheme("light");
              setOpen(false);
            }}
          >
            Light
          </button>
          <button
            role="menuitem"
            type="button"
            className="relative flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground"
            onClick={() => {
              setTheme("dark");
              setOpen(false);
            }}
          >
            Dark
          </button>
          <button
            role="menuitem"
            type="button"
            className="relative flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground"
            onClick={() => {
              setTheme("system");
              setOpen(false);
            }}
          >
            System
          </button>
        </div>
      )}
    </div>
  );
}
