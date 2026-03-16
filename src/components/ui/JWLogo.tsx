interface JWLogoProps {
  size?: number;
  className?: string;
}

/** SVG recreation of the JW Telecoms globe mark — blue sphere with green orbital rings */
export function JWGlobe({ size = 36, className = "" }: JWLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-label="JW Telecoms globe"
    >
      <defs>
        <radialGradient id="jwSphere" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </radialGradient>
      </defs>

      {/* Back orbit ring (behind sphere) */}
      <ellipse
        cx="22"
        cy="28"
        rx="18"
        ry="6"
        stroke="#15803D"
        strokeWidth="2.5"
        fill="none"
        opacity="0.55"
        transform="rotate(-30 22 22)"
      />

      {/* Globe sphere */}
      <circle cx="22" cy="22" r="14" fill="url(#jwSphere)" />

      {/* Middle orbit ring */}
      <ellipse
        cx="22"
        cy="22"
        rx="19"
        ry="6.5"
        stroke="#22C55E"
        strokeWidth="2.5"
        fill="none"
        transform="rotate(10 22 22)"
      />

      {/* Front orbit ring */}
      <ellipse
        cx="22"
        cy="17"
        rx="16"
        ry="5"
        stroke="#4ADE80"
        strokeWidth="2"
        fill="none"
        opacity="0.9"
        transform="rotate(-15 22 22)"
      />
    </svg>
  );
}

/** Full JW Telecoms wordmark: globe + "JW Telecoms" text */
export function JWLogoFull({
  size = 36,
  dark = false,
  className = "",
}: JWLogoProps & { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <JWGlobe size={size} />
      <span
        className={`font-bold text-lg tracking-tight ${
          dark ? "text-white" : "text-navy"
        }`}
      >
        JW<span className="text-accent">Telecoms</span>
      </span>
    </span>
  );
}
