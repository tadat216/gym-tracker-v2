import { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string; // hex e.g. "#ef4444"
  onChange: (hex: string) => void;
  previewLabel?: string; // shown on the preview chip
  className?: string;
}

// --- HSB ↔ Hex conversion helpers ---

function hsbToHex(h: number, s: number, b: number): string {
  const c = b * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = b - c;
  let r = 0, g = 0, bl = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; bl = x; }
  else if (h < 240) { g = x; bl = c; }
  else if (h < 300) { r = x; bl = c; }
  else { r = c; bl = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

function hexToHsb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

// --- Drag hook ---

function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);

  const getPos = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onMove(x, y);
    },
    [onMove],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      getPos(e.clientX, e.clientY);
    },
    [getPos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 0) return;
      getPos(e.clientX, e.clientY);
    },
    [getPos],
  );

  return { ref, handlePointerDown, handlePointerMove };
}

// --- Main component ---

function ColorPicker({ value, onChange, previewLabel, className }: ColorPickerProps) {
  const [hsb, setHsb] = useState<[number, number, number]>(() => hexToHsb(value));

  // Use ref so drag callbacks always read latest hsb without recreating (rerender-dependencies)
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;

  // Sync external value changes
  useEffect(() => {
    const newHsb = hexToHsb(value);
    setHsb(newHsb);
  }, [value]);

  const updateColor = useCallback(
    (h: number, s: number, b: number) => {
      setHsb([h, s, b]);
      onChange(hsbToHex(h, s, b));
    },
    [onChange],
  );

  // Stable callbacks — read hsbRef.current instead of hsb to avoid recreating on every drag
  const sbArea = useDrag(
    useCallback((x: number, y: number) => updateColor(hsbRef.current[0], x, 1 - y), [updateColor]),
  );

  const hueSlider = useDrag(
    useCallback((x: number) => updateColor(x * 360, hsbRef.current[1], hsbRef.current[2]), [updateColor]),
  );

  const hex = hsbToHex(hsb[0], hsb[1], hsb[2]);
  const hueHex = hsbToHex(hsb[0], 1, 1);

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Saturation/Brightness area */}
      <div
        ref={sbArea.ref}
        onPointerDown={sbArea.handlePointerDown}
        onPointerMove={sbArea.handlePointerMove}
        className="relative h-[100px] cursor-crosshair rounded-[10px] border border-border touch-none"
        style={{ background: `linear-gradient(to right, #fff, ${hueHex})` }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[10px]"
          style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
        />
        <div
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${hsb[1] * 100}%`, top: `${(1 - hsb[2]) * 100}%` }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueSlider.ref}
        onPointerDown={hueSlider.handlePointerDown}
        onPointerMove={hueSlider.handlePointerMove}
        className="relative h-4 cursor-pointer rounded-full border border-border touch-none"
        style={{
          background:
            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
      >
        <div
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{ left: `${(hsb[0] / 360) * 100}%`, background: hueHex }}
        />
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-muted-foreground">Preview</span>
        <span
          className="rounded-full px-3.5 py-1 text-xs font-semibold text-white"
          style={{ background: hex }}
        >
          {previewLabel || "Sample"}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{hex}</span>
      </div>
    </div>
  );
}

export { ColorPicker };
export type { ColorPickerProps };
