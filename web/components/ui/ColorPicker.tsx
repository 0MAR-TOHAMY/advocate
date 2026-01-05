"use client";
import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  className?: string;
};

function clamp(n: number, min = 0, max = 1) { return Math.min(max, Math.max(min, n)); }
function hsvToHex(h: number, s: number, v: number): string {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const to255 = (x: number) => Math.round(clamp(x) * 255);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(to255(r))}${hex(to255(g))}${hex(to255(b))}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (max === min) h = 0; else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [clamp(h), clamp(s), clamp(v)];
}

export default function ColorPicker({ value, onChange, label, className }: Props) {
  const [hex, setHex] = useState<string>(value || "#1e40af");
  const [hsv, setHsv] = useState<[number, number, number]>(hexToHsv(hex));

  useEffect(() => {
    setHex(value);
    setHsv(hexToHsv(value));
  }, [value]);

  const gradientStyle = useMemo(() => ({
    background: `linear-gradient(to right, #fff, ${hsvToHex(hsv[0], 1, 1)})`,
  }), [hsv]);

  return (
    <div className={className || "space-y-2"}>
      {label ? <label className="block text-sm font-medium text-gray-700">{label}</label> : null}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] border" style={{ background: hex }} />
        <input
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              setHex(v); setHsv(hexToHsv(v)); onChange(v);
            } else { setHex(v); }
          }}
          placeholder="#000000"
          className="w-[120px] rounded-md border px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-3">
        <div className="h-6 rounded-md border overflow-hidden" style={gradientStyle}>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(hsv[1] * 100)}
            onChange={(e) => { const s = Number(e.target.value)/100; const h = hsv[0]; const v = hsv[2]; const nx = hsvToHex(h, s, v); setHsv([h, s, v]); setHex(nx); onChange(nx); }}
            className="w-full h-full appearance-none bg-transparent cursor-pointer"
          />
        </div>
        <div className="h-6 rounded-md border overflow-hidden" style={{ background: `linear-gradient(to right, #000, ${hsvToHex(hsv[0], hsv[1], 1)})` }}>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(hsv[2] * 100)}
            onChange={(e) => { const v = Number(e.target.value)/100; const h = hsv[0]; const s = hsv[1]; const nx = hsvToHex(h, s, v); setHsv([h, s, v]); setHex(nx); onChange(nx); }}
            className="w-full h-full appearance-none bg-transparent cursor-pointer"
          />
        </div>
        <div className="h-2 rounded-md bg-linear-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 border">
          <input
            type="range"
            min={0}
            max={360}
            value={Math.round(hsv[0] * 360)}
            onChange={(e) => { const h = Number(e.target.value)/360; const s = hsv[1]; const v = hsv[2]; const nx = hsvToHex(h, s, v); setHsv([h, s, v]); setHex(nx); onChange(nx); }}
            className="w-full h-2 appearance-none bg-transparent cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
