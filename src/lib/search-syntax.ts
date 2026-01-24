import { Doc } from "../../convex/_generated/dataModel";
import { UniversusCardMetadata } from "@/config/universus";

type Card<T = unknown> = Doc<"cards"> & { metadata?: T };

export type SyntaxOperator = ":" | "=" | "!=" | ">" | "<" | ">=" | "<=";

export interface SyntaxToken {
  key: string;
  operator: SyntaxOperator;
  value: string;
  raw: string;
}

export interface ParsedSearch {
  textQuery: string;
  tokens: SyntaxToken[];
}

export type SyntaxMatcher = (
  card: Card<UniversusCardMetadata>,
  operator: SyntaxOperator,
  value: string
) => boolean;

export interface SyntaxDefinition {
  key: string;
  aliases?: string[];
  description: string;
  examples: string[];
  operators: SyntaxOperator[];
  matcher: SyntaxMatcher;
}

const OPERATOR_PATTERN = /^(>=|<=|!=|[:=><])/;

function parseNumericComparison(
  cardValue: number,
  operator: SyntaxOperator,
  queryValue: string
): boolean {
  const numValue = parseInt(queryValue, 10);
  if (isNaN(numValue)) return false;

  switch (operator) {
    case ":":
    case "=":
      return cardValue === numValue;
    case "!=":
      return cardValue !== numValue;
    case ">":
      return cardValue > numValue;
    case "<":
      return cardValue < numValue;
    case ">=":
      return cardValue >= numValue;
    case "<=":
      return cardValue <= numValue;
    default:
      return false;
  }
}

function createTextMatcher(
  patterns: string[] | ((value: string) => string[]),
  field: "text" | "all"
): SyntaxMatcher {
  return (card, operator, value) => {
    const searchPatterns = typeof patterns === "function" ? patterns(value) : patterns;
    const cardText = field === "all" 
      ? (card.searchAll ?? card.text ?? "").toLowerCase()
      : (card.text ?? "").toLowerCase();

    if (operator === ":") {
      return searchPatterns.some(pattern => cardText.includes(pattern.toLowerCase()));
    }
    if (operator === "!=") {
      return !searchPatterns.some(pattern => cardText.includes(pattern.toLowerCase()));
    }
    return false;
  };
}

function createNumericMatcher(
  getter: (card: Card<UniversusCardMetadata>) => number | undefined
): SyntaxMatcher {
  return (card, operator, value) => {
    const cardValue = getter(card);
    if (cardValue === undefined) return false;
    return parseNumericComparison(cardValue, operator, value);
  };
}

function createArrayMatcher(
  getter: (card: Card<UniversusCardMetadata>) => string[] | undefined
): SyntaxMatcher {
  return (card, operator, value) => {
    const cardValues = getter(card) ?? [];
    const searchValue = value.toLowerCase();

    if (operator === ":") {
      return cardValues.some(v => v.toLowerCase().includes(searchValue));
    }
    if (operator === "=") {
      return cardValues.some(v => v.toLowerCase() === searchValue);
    }
    if (operator === "!=") {
      return !cardValues.some(v => v.toLowerCase() === searchValue);
    }
    return false;
  };
}

function createStringMatcher(
  getter: (card: Card<UniversusCardMetadata>) => string | undefined
): SyntaxMatcher {
  return (card, operator, value) => {
    const cardValue = (getter(card) ?? "").toLowerCase();
    const searchValue = value.toLowerCase();

    if (operator === ":") {
      return cardValue.includes(searchValue);
    }
    if (operator === "=") {
      return cardValue === searchValue;
    }
    if (operator === "!=") {
      return cardValue !== searchValue;
    }
    return false;
  };
}

export const UNIVERSUS_SYNTAX_DEFINITIONS: SyntaxDefinition[] = [
  {
    key: "dr",
    aliases: ["damage-reduction", "damagereduction"],
    description: "Find cards that reduce damage",
    examples: ["dr:all", "dr:any"],
    operators: [":", "!="],
    matcher: createTextMatcher([
      "gets -",
      "get -",
      "-1 damage",
      "-2 damage",
      "-3 damage",
      "-4 damage",
      "-5 damage",
      "-6 damage",
      "reduce damage",
      "reduces damage",
      "damage reduced",
      "damage reduction",
      "less damage",
      "prevent damage",
      "prevents damage",
    ], "all"),
  },
  {
    key: "draw",
    description: "Find cards that draw cards",
    examples: ["draw:all", "draw:any"],
    operators: [":", "!="],
    matcher: createTextMatcher([
      "draw a card",
      "draw 1 card",
      "draw 2 card",
      "draw 3 card",
      "draws a card",
      "draws 1 card",
      "draws 2 card",
      "draw cards",
      "draws cards",
    ], "all"),
  },
  {
    key: "commit",
    description: "Find cards that commit cards",
    examples: ["commit:all", "commit:rival"],
    operators: [":", "!="],
    matcher: (card, operator, value) => {
      const cardText = (card.searchAll ?? card.text ?? "").toLowerCase();
      const patterns = value.toLowerCase() === "rival" 
        ? ["rival commits", "your rival commits", "rival's commit"]
        : ["commit"];
      
      if (operator === ":") {
        return patterns.some(p => cardText.includes(p));
      }
      if (operator === "!=") {
        return !patterns.some(p => cardText.includes(p));
      }
      return false;
    },
  },
  {
    key: "ready",
    description: "Find cards that ready cards",
    examples: ["ready:all", "ready:foundation"],
    operators: [":", "!="],
    matcher: createTextMatcher([
      "ready",
      "readies",
    ], "all"),
  },
  {
    key: "destroy",
    description: "Find cards that destroy cards",
    examples: ["destroy:all", "destroy:foundation"],
    operators: [":", "!="],
    matcher: createTextMatcher([
      "destroy",
      "destroys",
    ], "all"),
  },
  {
    key: "discard",
    description: "Find cards that cause discarding",
    examples: ["discard:all", "discard:rival"],
    operators: [":", "!="],
    matcher: (card, operator, value) => {
      const cardText = (card.searchAll ?? card.text ?? "").toLowerCase();
      const patterns = value.toLowerCase() === "rival" 
        ? ["rival discards", "your rival discards"]
        : ["discard"];
      
      if (operator === ":") {
        return patterns.some(p => cardText.includes(p));
      }
      if (operator === "!=") {
        return !patterns.some(p => cardText.includes(p));
      }
      return false;
    },
  },
  {
    key: "momentum",
    aliases: ["mom"],
    description: "Find cards that interact with momentum",
    examples: ["momentum:add", "momentum:discard", "mom:all"],
    operators: [":", "!="],
    matcher: (card, operator, value) => {
      const cardText = (card.searchAll ?? card.text ?? "").toLowerCase();
      const lowerValue = value.toLowerCase();
      
      let patterns: string[];
      if (lowerValue === "add" || lowerValue === "gain") {
        patterns = ["add", "to your momentum", "adds", "gain momentum"];
      } else if (lowerValue === "discard") {
        patterns = ["discard", "momentum"];
      } else {
        patterns = ["momentum"];
      }
      
      if (operator === ":") {
        return patterns.every(p => cardText.includes(p));
      }
      if (operator === "!=") {
        return !patterns.every(p => cardText.includes(p));
      }
      return false;
    },
  },
  {
    key: "damage",
    aliases: ["dmg"],
    description: "Filter by attack damage",
    examples: ["damage:4", "damage>3", "dmg>=5"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.damage),
  },
  {
    key: "speed",
    aliases: ["spd"],
    description: "Filter by attack speed",
    examples: ["speed:3", "speed>2", "spd<=4"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.speed),
  },
  {
    key: "difficulty",
    aliases: ["diff", "d"],
    description: "Filter by difficulty",
    examples: ["difficulty:3", "diff>2", "d<=4"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.difficulty),
  },
  {
    key: "control",
    aliases: ["ctrl", "c"],
    description: "Filter by control",
    examples: ["control:4", "ctrl>3", "c>=5"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.control),
  },
  {
    key: "health",
    aliases: ["hp"],
    description: "Filter by health",
    examples: ["health:25", "hp>20", "hp>=30"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.health),
  },
  {
    key: "handsize",
    aliases: ["hand", "hs"],
    description: "Filter by hand size",
    examples: ["handsize:6", "hand>5", "hs>=7"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.handSize),
  },
  {
    key: "stamina",
    aliases: ["stam"],
    description: "Filter by stamina",
    examples: ["stamina:3", "stam>2", "stam>=4"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.stamina),
  },
  {
    key: "block",
    aliases: ["blk"],
    description: "Filter by block modifier",
    examples: ["block:2", "blk>1", "blk>=3"],
    operators: [":", "=", "!=", ">", "<", ">=", "<="],
    matcher: createNumericMatcher((card) => card.blockModifier),
  },
  {
    key: "type",
    aliases: ["t"],
    description: "Filter by card type",
    examples: ["type:attack", "t:action", "type:foundation"],
    operators: [":", "=", "!="],
    matcher: createStringMatcher((card) => card.type),
  },
  {
    key: "rarity",
    aliases: ["r"],
    description: "Filter by rarity",
    examples: ["rarity:rare", "r:uncommon", "rarity:\"super rare\""],
    operators: [":", "=", "!="],
    matcher: createStringMatcher((card) => card.rarity),
  },
  {
    key: "set",
    aliases: ["s"],
    description: "Filter by set code",
    examples: ["set:MHA01", "s:SF01"],
    operators: [":", "=", "!="],
    matcher: createStringMatcher((card) => card.setCode),
  },
  {
    key: "keyword",
    aliases: ["kw", "k"],
    description: "Filter by keyword",
    examples: ["keyword:powerful", "kw:breaker", "k:stun"],
    operators: [":", "=", "!="],
    matcher: createArrayMatcher((card) => card.keywords),
  },
  {
    key: "symbol",
    aliases: ["sym"],
    description: "Filter by symbol",
    examples: ["symbol:fire", "sym:earth", "symbol:void"],
    operators: [":", "=", "!="],
    matcher: createArrayMatcher((card) => card.symbols),
  },
  {
    key: "zone",
    aliases: ["z"],
    description: "Filter by attack/block zone",
    examples: ["zone:high", "z:mid", "zone:low"],
    operators: [":", "=", "!="],
    matcher: (card, operator, value) => {
      const attackZone = card.metadata?.attack?.zone?.toLowerCase();
      const blockZone = card.metadata?.block?.zone?.toLowerCase();
      const searchValue = value.toLowerCase();

      if (operator === ":") {
        return attackZone === searchValue || blockZone === searchValue;
      }
      if (operator === "=") {
        return attackZone === searchValue || blockZone === searchValue;
      }
      if (operator === "!=") {
        return attackZone !== searchValue && blockZone !== searchValue;
      }
      return false;
    },
  },
  {
    key: "attackzone",
    aliases: ["az"],
    description: "Filter by attack zone specifically",
    examples: ["attackzone:high", "az:mid", "az:low"],
    operators: [":", "=", "!="],
    matcher: createStringMatcher((card) => card.metadata?.attack?.zone),
  },
  {
    key: "blockzone",
    aliases: ["bz"],
    description: "Filter by block zone specifically",
    examples: ["blockzone:high", "bz:mid", "bz:low"],
    operators: [":", "=", "!="],
    matcher: createStringMatcher((card) => card.metadata?.block?.zone),
  },
  {
    key: "text",
    aliases: ["o", "oracle"],
    description: "Search in card text",
    examples: ["text:\"after this attack\"", "o:response"],
    operators: [":", "!="],
    matcher: createTextMatcher((value) => [value], "text"),
  },
  {
    key: "has",
    description: "Check if card has certain properties",
    examples: ["has:attack", "has:block", "has:abilities"],
    operators: [":"],
    matcher: (card, _operator, value) => {
      const lowerValue = value.toLowerCase();
      switch (lowerValue) {
        case "attack":
          return !!card.metadata?.attack;
        case "block":
          return !!card.metadata?.block;
        case "abilities":
          return (card.metadata?.abilities?.length ?? 0) > 0;
        case "keywords":
          return (card.keywords?.length ?? 0) > 0;
        default:
          return false;
      }
    },
  },
  {
    key: "is",
    description: "Check card characteristics",
    examples: ["is:character", "is:dual"],
    operators: [":"],
    matcher: (card, _operator, value) => {
      const lowerValue = value.toLowerCase();
      switch (lowerValue) {
        case "character":
          return card.type === "Character";
        case "attack":
          return card.type === "Attack";
        case "action":
          return card.type === "Action";
        case "asset":
          return card.type === "Asset";
        case "foundation":
          return card.type === "Foundation";
        case "backup":
          return card.type === "Backup";
        case "dual":
        case "dualfaced":
        default:
          return false;
      }
    },
  },
  {
    key: "boost",
    aliases: ["buff"],
    description: "Find cards that boost damage or speed",
    examples: ["boost:damage", "boost:speed", "buff:all"],
    operators: [":", "!="],
    matcher: (card, operator, value) => {
      const cardText = (card.searchAll ?? card.text ?? "").toLowerCase();
      const lowerValue = value.toLowerCase();
      
      let patterns: string[];
      if (lowerValue === "damage" || lowerValue === "dmg") {
        patterns = ["+1 damage", "+2 damage", "+3 damage", "+4 damage", "+5 damage", "gets +", "damage"];
      } else if (lowerValue === "speed" || lowerValue === "spd") {
        patterns = ["+1 speed", "+2 speed", "+3 speed", "+4 speed", "+5 speed", "gets +", "speed"];
      } else {
        patterns = ["gets +", "+1 ", "+2 ", "+3 ", "+4 ", "+5 "];
      }
      
      if (operator === ":") {
        if (lowerValue === "damage" || lowerValue === "speed") {
          return cardText.includes("gets +") && patterns.some(p => cardText.includes(p));
        }
        return patterns.some(p => cardText.includes(p));
      }
      if (operator === "!=") {
        return !patterns.some(p => cardText.includes(p));
      }
      return false;
    },
  },
];

const syntaxMap = new Map<string, SyntaxDefinition>();
UNIVERSUS_SYNTAX_DEFINITIONS.forEach(def => {
  syntaxMap.set(def.key.toLowerCase(), def);
  def.aliases?.forEach(alias => syntaxMap.set(alias.toLowerCase(), def));
});

export function getSyntaxDefinition(key: string): SyntaxDefinition | undefined {
  return syntaxMap.get(key.toLowerCase());
}

export function parseSearchQuery(query: string): ParsedSearch {
  const tokens: SyntaxToken[] = [];
  const textParts: string[] = [];
  
  const tokenPattern = /(?:^|\s)([a-zA-Z_-]+)(>=|<=|!=|[:=><])("([^"]+)"|([^\s"]+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  const normalizedQuery = query.trim();
  
  while ((match = tokenPattern.exec(normalizedQuery)) !== null) {
    const beforeMatch = normalizedQuery.slice(lastIndex, match.index).trim();
    if (beforeMatch) {
      textParts.push(beforeMatch);
    }
    
    const key = match[1];
    const operator = match[2] as SyntaxOperator;
    const value = match[4] || match[5];
    
    const syntaxDef = getSyntaxDefinition(key);
    if (syntaxDef && syntaxDef.operators.includes(operator)) {
      tokens.push({
        key: key.toLowerCase(),
        operator,
        value,
        raw: match[0].trim(),
      });
    } else {
      textParts.push(match[0].trim());
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  const remaining = normalizedQuery.slice(lastIndex).trim();
  if (remaining) {
    textParts.push(remaining);
  }
  
  return {
    textQuery: textParts.join(" ").trim(),
    tokens,
  };
}

export function applySearchSyntax(
  cards: Card<UniversusCardMetadata>[],
  query: string
): { filtered: Card<UniversusCardMetadata>[]; textQuery: string } {
  const parsed = parseSearchQuery(query);
  
  if (parsed.tokens.length === 0) {
    return { filtered: cards, textQuery: query };
  }
  
  const filtered = cards.filter(card => {
    return parsed.tokens.every(token => {
      const syntaxDef = getSyntaxDefinition(token.key);
      if (!syntaxDef) return true;
      return syntaxDef.matcher(card, token.operator, token.value);
    });
  });
  
  return { filtered, textQuery: parsed.textQuery };
}

export function getSearchSyntaxHelp(): { key: string; description: string; examples: string[] }[] {
  return UNIVERSUS_SYNTAX_DEFINITIONS.map(def => ({
    key: def.key + (def.aliases?.length ? ` (${def.aliases.join(", ")})` : ""),
    description: def.description,
    examples: def.examples,
  }));
}

