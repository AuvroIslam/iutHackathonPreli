/**
 * Hand-drawn inline SVG glyphs. Deliberately not an icon font or emoji — thin
 * 1.6px strokes to match the line weight of the fan / lightbulb art assets.
 * Each inherits `currentColor` so panels tint them.
 */
type GlyphProps = { size?: number; className?: string };

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
}

export function BoltGlyph({ size = 24, className }: GlyphProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockGlyph({ size = 24, className }: GlyphProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function WarningGlyph({ size = 24, className }: GlyphProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckGlyph({ size = 24, className }: GlyphProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

export function ChevronGlyph({ size = 24, className }: GlyphProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
