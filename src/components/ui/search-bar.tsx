"use client";

import { useState, useRef, ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface SearchConfig {
  placeholder?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  quickFilters?: ReactNode;
  advancedFilters?: ReactNode;
  advancedFiltersTitle?: string;
  leftButton?: {
    label: string;
    onClick?: () => void;
    opensAdvancedFilters?: boolean;
  };
  rightButton?: {
    label: string;
    onClick?: (value: string) => void;
  };
}

export interface SearchBarProps extends Partial<SearchConfig> {
  /** Current search value (controlled) */
  value?: string;
  /** Class name for the search bar container */
  className?: string;
  /** Class name for the popover content */
  popoverClassName?: string;
  /** Class name for the dialog content */
  dialogClassName?: string;
  /** End adornment rendered inside the search bar on the right */
  endAdornment?: ReactNode;
  /** Horizontal offset for the popover alignment (in pixels) */
  alignOffset?: number;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onSearchChange,
  onSearch,
  quickFilters,
  advancedFilters,
  advancedFiltersTitle = "Advanced Filters",
  leftButton,
  rightButton,
  className,
  popoverClassName,
  dialogClassName,
  endAdornment,
  alignOffset,
}: SearchBarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const searchValue = value ?? internalValue;
  const setSearchValue = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    onSearchChange?.(val);
  };

  const handleLeftButtonClick = () => {
    if (leftButton?.opensAdvancedFilters && advancedFilters) {
      setIsPopoverOpen(false);
      setIsDialogOpen(true);
    } else {
      leftButton?.onClick?.();
    }
  };

  const handleRightButtonClick = () => {
    setIsPopoverOpen(false);
    if (rightButton?.onClick) {
      rightButton.onClick(searchValue);
    } else {
      onSearch?.(searchValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRightButtonClick();
    }
    if (e.key === "Escape") {
      setIsPopoverOpen(false);
    }
  };

  const hasPopover = quickFilters || leftButton || rightButton;
  const hasFooter = leftButton || rightButton;
  const containerRef = useRef<HTMLDivElement>(null);

  if (!hasPopover) {
    return (
      <div className={cn("relative flex-1 max-w-md", className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("pl-9", endAdornment && "pr-10")}
        />
        {endAdornment && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div ref={containerRef} className={cn("relative flex-1 max-w-md", className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn("pl-9", endAdornment && "pr-10")}
              onClick={(e) => {
                if (isPopoverOpen) {
                  e.stopPropagation();
                }
              }}
            />
            {endAdornment && (
              <div
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={(e) => e.stopPropagation()}
              >
                {endAdornment}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-[var(--radix-popover-trigger-width)] min-w-[800px] max-h-[70vh] p-0 flex flex-col", popoverClassName)}
          align="start"
          alignOffset={alignOffset}
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (containerRef.current?.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          {quickFilters && (
            <div className="flex-1 overflow-y-auto p-4">
              {quickFilters}
            </div>
          )}

          {hasFooter && (
            <div className={cn(
              "flex shrink-0 items-center justify-between bg-muted/30 px-4 py-3 border-t"
            )}>
              <div>
                {leftButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeftButtonClick}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {leftButton.label}
                  </Button>
                )}
              </div>
              <div>
                {rightButton && (
                  <Button
                    size="sm"
                    onClick={handleRightButtonClick}
                  >
                    {rightButton.label}
                  </Button>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Advanced Filters Dialog */}
      {advancedFilters && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            size="xl"
            className={cn("overflow-hidden p-0", dialogClassName)}
            showCloseButton={false}
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    onSearch?.(searchValue);
                  }}
                >
                  Apply Filters
                </Button>
              </>
            }
          >
            <div className="relative flex h-full min-h-0 flex-col">
              <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
                <DialogTitle>{advancedFiltersTitle}</DialogTitle>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2">
                {advancedFilters}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/**
 * Hook to create a SearchBar configuration from a game's search config.
 * Use this in top bar components to integrate the search bar with game-specific settings.
 */
export function useSearchBarProps(config?: SearchConfig): SearchBarProps {
  const [searchValue, setSearchValue] = useState("");

  if (!config) {
    return {
      value: searchValue,
      onSearchChange: setSearchValue,
    };
  }

  return {
    ...config,
    value: searchValue,
    onSearchChange: (val) => {
      setSearchValue(val);
      config.onSearchChange?.(val);
    },
  };
}
