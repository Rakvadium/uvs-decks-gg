/** Display order of UVS card-type groups in deck lists. */
export const CARD_TYPE_ORDER = ["Attack", "Foundation", "Action", "Asset", "Backup", "Character"] as const;

/** Plural group labels keyed by UVS card type. */
export const CARD_TYPE_LABELS: Record<string, string> = {
  Attack: "Attacks",
  Foundation: "Foundations",
  Action: "Actions",
  Asset: "Assets",
  Backup: "Backups",
  Character: "Characters",
};
