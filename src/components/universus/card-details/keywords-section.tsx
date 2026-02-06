import { useCardDetailsContent } from "./content-context";
import { KeywordBadge } from "./keyword-badge";

export function CardDetailsKeywordsSection() {
  const { keywordAbilities, otherKeywords } = useCardDetailsContent();

  if (keywordAbilities.length === 0 && otherKeywords.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Keywords</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {keywordAbilities.map((keyword, index) => (
          <KeywordBadge key={`ability-${index}`} keyword={keyword} />
        ))}

        {keywordAbilities.length > 0 && otherKeywords.length > 0 ? (
          <span className="mx-1 font-mono text-muted-foreground/50">/</span>
        ) : null}

        {otherKeywords.map((keyword, index) => (
          <KeywordBadge key={`other-${index}`} keyword={keyword} />
        ))}
      </div>
    </div>
  );
}
