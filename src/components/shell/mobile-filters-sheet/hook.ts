import { useCallback, useState } from "react";

export function useMobileFiltersSheetModel(onApply?: () => void, onClear?: () => void) {
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    onApply?.();
    setIsOpen(false);
  }, [onApply]);

  const handleClear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  return {
    isOpen,
    setIsOpen,
    openSheet,
    closeSheet,
    handleApply,
    handleClear,
  };
}
