import { TIMING_COLORS } from "./constants";

interface AbilityTextProps {
  text: string;
}

export function AbilityText({ text }: AbilityTextProps) {
  const segments = text
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => {
        const colonIndex = segment.indexOf(":");

        if (colonIndex === -1) {
          return (
            <p key={index} className="text-sm leading-relaxed">
              {segment}
            </p>
          );
        }

        const beforeColon = segment.slice(0, colonIndex);
        const afterColon = segment.slice(colonIndex);
        const abilityMatch = beforeColon.match(/^(.*?)(enhance|response|blitz|form)/i);

        if (!abilityMatch) {
          return (
            <p key={index} className="text-sm leading-relaxed">
              {segment}
            </p>
          );
        }

        const prefix = abilityMatch[1];
        const abilityKeyword = abilityMatch[2];
        const abilityColor = TIMING_COLORS[abilityKeyword.toLowerCase()];
        const highlightedPart = prefix + abilityKeyword;
        const remainingBeforeColon = beforeColon.slice(highlightedPart.length);

        return (
          <p key={index} className="text-sm leading-relaxed">
            <span
              className="inline-block px-2.5 py-0.5 text-xs font-semibold font-mono uppercase tracking-widest"
              style={{
                borderLeft: `2px solid ${abilityColor}`,
                borderTop: `1px solid color-mix(in srgb, ${abilityColor} 30%, transparent)`,
                borderBottom: `1px solid color-mix(in srgb, ${abilityColor} 30%, transparent)`,
                background: `linear-gradient(to right, ${abilityColor}35, ${abilityColor}10)`,
                color: abilityColor,
              }}
            >
              {highlightedPart}
            </span>
            {remainingBeforeColon}
            {afterColon}
          </p>
        );
      })}
    </div>
  );
}
