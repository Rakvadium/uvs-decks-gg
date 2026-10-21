type SetCodeOption = { code: string };

type IsSetLegalInFormat = (setCode: string, formatKey: string) => boolean;

export function filterSetOptionsForFormat<T extends SetCodeOption>(
  options: T[],
  formatKey: string | undefined,
  isSetLegalInFormat: IsSetLegalInFormat
): T[] {
  if (!formatKey) return options;
  return options.filter((option) => isSetLegalInFormat(option.code, formatKey));
}

export function legalSelectedSetCodes(
  selected: string[] | undefined,
  formatKey: string | undefined,
  isSetLegalInFormat: IsSetLegalInFormat
): string[] | undefined {
  if (!selected?.length || !formatKey) return selected;
  const legal = selected.filter((code) => isSetLegalInFormat(code, formatKey));
  if (legal.length === selected.length) return selected;
  return legal.length > 0 ? legal : undefined;
}
