import { TIMING_COLORS } from "./constants";

interface AbilityTextProps {
  text: string;
  showHeading?: boolean;
}

export function AbilityText({ text, showHeading = true }: AbilityTextProps) {
  const segments = text
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5">
      {showHeading ? (
        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
          Abilities
        </span>
      ) : null}
      {segments.map((segment, index) => {
        const colonIndex = segment.indexOf(":");

        if (colonIndex === -1) {
          return (
            <p key={index} className="text-sm leading-relaxed text-foreground/80">
              {segment}
            </p>
          );
        }

        const beforeColon = segment.slice(0, colonIndex);
        const afterColon = segment.slice(colonIndex + 1).trim();
        const abilityMatch = beforeColon.match(/^(.*?)(enhance|response|blitz|form)/i);

        if (!abilityMatch) {
          return (
            <p key={index} className="text-sm leading-relaxed text-foreground/80">
              {segment}
            </p>
          );
        }

        const prefix = abilityMatch[1];
        const abilityKeyword = abilityMatch[2];
        const abilityColor = TIMING_COLORS[abilityKeyword.toLowerCase()];
        const highlightedPart = (prefix + abilityKeyword).trim();
        const remainingBeforeColon = beforeColon.slice((prefix + abilityKeyword).length).trim();

        return (
          <p key={index} className="text-sm leading-relaxed text-foreground/90">
            <span
              className="mr-0.5 inline-flex items-center rounded-sm px-1.5 py-px text-[10px] font-bold font-mono uppercase tracking-[0.1em] align-middle"
              style={{
                backgroundColor: abilityColor,
                color: "#fff",
                boxShadow: `0 0 10px ${abilityColor}40`,
              }}
            >
              {highlightedPart}
            </span>
            {remainingBeforeColon}
            {afterColon ? `: ${afterColon}` : remainingBeforeColon ? ":" : null}
          </p>
        );
      })}
    </div>
  );
}
