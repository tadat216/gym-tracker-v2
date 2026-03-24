import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-3 flex items-center justify-between rounded-[10px] border border-border/40 bg-white/2 px-4 py-3">
      <span className="text-[13px] font-semibold text-muted-foreground">
        Theme
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Light theme"
          onClick={() => setTheme("light")}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-muted-foreground/60",
            theme === "light" &&
              "border border-primary/15 bg-primary/10 text-primary",
          )}
        >
          <Sun className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Dark theme"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-muted-foreground/60",
            theme === "dark" &&
              "border border-primary/15 bg-primary/10 text-primary",
          )}
        >
          <Moon className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="System theme"
          onClick={() => setTheme("system")}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-muted-foreground/60",
            theme === "system" &&
              "border border-primary/15 bg-primary/10 text-primary",
          )}
        >
          <Monitor className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
