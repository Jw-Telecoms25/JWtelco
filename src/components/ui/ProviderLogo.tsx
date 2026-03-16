interface ProviderLogoProps {
  id: string;
  name: string;
  color: string;
  size?: "sm" | "md";
}

const logoLetters: Record<string, string> = {
  mtn: "M",
  airtel: "A",
  glo: "G",
  "9mobile": "9",
  dstv: "DS",
  gotv: "GO",
  startimes: "ST",
  waec: "W",
  neco: "N",
  nabteb: "NB",
};

export function ProviderLogo({ id, name, color, size = "sm" }: ProviderLogoProps) {
  const letters = logoLetters[id] ?? name.charAt(0);
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg font-bold text-white shrink-0 ${dim}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {letters}
    </span>
  );
}
