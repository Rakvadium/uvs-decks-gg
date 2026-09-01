import { TIMING_COLORS } from "./constants";
import { InlineSymbolText } from "./inline-symbol-text";

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
        <span className="chrome-label-case text-xs font-bold text-muted-foreground/60">
          Abilities
        </span>
      ) : null}
      {segments.map((segment, index) => {
        const colonIndex = segment.indexOf(":");

        if (colonIndex === -1) {
          return (
            <p key={index} className="text-base leading-relaxed text-foreground/80">
              <InlineSymbolText text={segment} />
            </p>
          );
        }

        const beforeColon = segment.slice(0, colonIndex);
        const afterColon = segment.slice(colonIndex + 1).trim();
        const abilityMatch = beforeColon.match(/^(.*?)(enhance|response|blitz|form)/i);

        if (!abilityMatch) {
          return (
            <p key={index} className="text-base leading-relaxed text-foreground/80">
              <InlineSymbolText text={segment} />
            </p>
          );
        }

        const prefix = abilityMatch[1];
        const abilityKeyword = abilityMatch[2];
        const abilityColor = TIMING_COLORS[abilityKeyword.toLowerCase()];
        const highlightedPart = (prefix + abilityKeyword).trim();
        const remainingBeforeColon = beforeColon.slice((prefix + abilityKeyword).length).trim();

        return (
          <p key={index} className="text-base leading-relaxed text-foreground/90">
            <span
              className="chrome-label-case mr-0.5 inline-flex items-center rounded-sm px-1.5 py-px text-xs font-bold align-middle"
              style={{
                backgroundColor: abilityColor,
                color: "#fff",
                boxShadow: `0 0 10px ${abilityColor}40`,
              }}
            >
              <InlineSymbolText text={highlightedPart} />
            </span>
            <InlineSymbolText text={remainingBeforeColon} />
            {afterColon ? (
              <>
                {": "}
                <InlineSymbolText text={afterColon} />
              </>
            ) : remainingBeforeColon ? (
              ":"
            ) : null}
          </p>
        );
      })}
    </div>
  );
}
