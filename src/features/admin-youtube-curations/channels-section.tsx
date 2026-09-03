"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatKeywordList } from "../../../shared/youtube-title-filters";
import type { Id } from "../../../convex/_generated/dataModel";

export type AdminYoutubeChannelRow = {
  channelDocId: Id<"communityYoutubeChannels">;
  channelId: string;
  title: string;
  handle?: string;
  enabled: boolean;
  maxVideos: number;
  topicPlaylistId?: string;
  titleIncludes?: string[];
  titleExcludes?: string[];
  lastSyncedAt?: number;
  lastSyncError?: string;
};

function syncedLabel(at?: number): string {
  if (!at) return "Not synced yet";
  return `Synced ${new Date(at).toLocaleString()}`;
}

const filterFieldClassName = "h-9 placeholder:text-muted-foreground/45 placeholder:italic";

function ChannelTargetingFields({
  includeId,
  excludeId,
  playlistId,
  includeValue,
  excludeValue,
  playlistValue,
  onIncludeChange,
  onExcludeChange,
  onPlaylistChange,
  onSave,
}: {
  includeId: string;
  excludeId: string;
  playlistId: string;
  includeValue: string;
  excludeValue: string;
  playlistValue: string;
  onIncludeChange: (value: string) => void;
  onExcludeChange: (value: string) => void;
  onPlaylistChange: (value: string) => void;
  onSave?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={includeId}>Title must include</Label>
          <Input
            id={includeId}
            value={includeValue}
            onChange={(e) => onIncludeChange(e.target.value)}
            onBlur={onSave}
            placeholder="one or more words, comma-separated"
            className={filterFieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={excludeId}>Title must not include</Label>
          <Input
            id={excludeId}
            value={excludeValue}
            onChange={(e) => onExcludeChange(e.target.value)}
            onBlur={onSave}
            placeholder="one or more words, comma-separated"
            className={filterFieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={playlistId}>Optional playlist</Label>
          <Input
            id={playlistId}
            value={playlistValue}
            onChange={(e) => onPlaylistChange(e.target.value)}
            onBlur={onSave}
            placeholder="e.g. playlist URL"
            className={filterFieldClassName}
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Empty fields are not filters. Separate multiple words with commas; a title matches if it
        contains any include word. Click outside the box to save.
      </p>
    </div>
  );
}

function ChannelRow({
  row,
  busy,
  onToggleEnabled,
  onRemoveChannel,
  onSaveTargeting,
}: {
  row: AdminYoutubeChannelRow;
  busy: boolean;
  onToggleEnabled: (
    channelDocId: Id<"communityYoutubeChannels">,
    enabled: boolean
  ) => Promise<void>;
  onRemoveChannel: (channelDocId: Id<"communityYoutubeChannels">) => Promise<void>;
  onSaveTargeting: (
    channelDocId: Id<"communityYoutubeChannels">,
    args: { titleIncludes: string; titleExcludes: string; playlistUrlOrId: string }
  ) => Promise<void>;
}) {
  const [includeValue, setIncludeValue] = useState(formatKeywordList(row.titleIncludes));
  const [excludeValue, setExcludeValue] = useState(formatKeywordList(row.titleExcludes));
  const [playlistValue, setPlaylistValue] = useState(row.topicPlaylistId ?? "");

  const saveTargeting = () => {
    const nextIncludes = includeValue.trim();
    const nextExcludes = excludeValue.trim();
    const nextPlaylist = playlistValue.trim();
    const curIncludes = formatKeywordList(row.titleIncludes);
    const curExcludes = formatKeywordList(row.titleExcludes);
    const curPlaylist = row.topicPlaylistId ?? "";
    if (
      nextIncludes === curIncludes &&
      nextExcludes === curExcludes &&
      nextPlaylist === curPlaylist
    ) {
      return;
    }
    void onSaveTargeting(row.channelDocId, {
      titleIncludes: includeValue,
      titleExcludes: excludeValue,
      playlistUrlOrId: playlistValue,
    });
  };

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium leading-tight">{row.title}</p>
            {row.handle ? (
              <Badge variant="outline" className="normal-case tracking-normal">
                @{row.handle}
              </Badge>
            ) : null}
            <Badge variant="secondary">{row.maxVideos} latest</Badge>
            {row.titleIncludes && row.titleIncludes.length > 0 ? (
              <Badge variant="outline">Includes {row.titleIncludes.join(", ")}</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                No title filter
              </Badge>
            )}
            {row.topicPlaylistId ? <Badge variant="outline">Playlist</Badge> : null}
          </div>
          <p className="text-[11px] text-muted-foreground truncate" title={row.channelId}>
            {row.channelId}
          </p>
          <p className="text-xs text-muted-foreground">{syncedLabel(row.lastSyncedAt)}</p>
          {row.lastSyncError ? (
            <p className="text-xs text-destructive">{row.lastSyncError}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={row.enabled}
              disabled={busy}
              onCheckedChange={(enabled) => {
                void onToggleEnabled(row.channelDocId, enabled);
              }}
              aria-label={`Sync ${row.title}`}
            />
            <span className="text-muted-foreground">Enabled</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={`Remove ${row.title}`}
            disabled={busy}
            onClick={() => {
              void onRemoveChannel(row.channelDocId);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ChannelTargetingFields
        includeId={`${row.channelDocId}-include`}
        excludeId={`${row.channelDocId}-exclude`}
        playlistId={`${row.channelDocId}-playlist`}
        includeValue={includeValue}
        excludeValue={excludeValue}
        playlistValue={playlistValue}
        onIncludeChange={setIncludeValue}
        onExcludeChange={setExcludeValue}
        onPlaylistChange={setPlaylistValue}
        onSave={saveTargeting}
      />
    </li>
  );
}

export function AdminYoutubeChannelsSection({
  channels,
  channelUrl,
  onChannelUrlChange,
  includeValue,
  onIncludeChange,
  excludeValue,
  onExcludeChange,
  playlistValue,
  onPlaylistChange,
  onAddChannel,
  onToggleEnabled,
  onRemoveChannel,
  onSaveTargeting,
}: {
  channels: AdminYoutubeChannelRow[] | undefined;
  channelUrl: string;
  onChannelUrlChange: (value: string) => void;
  includeValue: string;
  onIncludeChange: (value: string) => void;
  excludeValue: string;
  onExcludeChange: (value: string) => void;
  playlistValue: string;
  onPlaylistChange: (value: string) => void;
  onAddChannel: () => Promise<void>;
  onToggleEnabled: (
    channelDocId: Id<"communityYoutubeChannels">,
    enabled: boolean
  ) => Promise<void>;
  onRemoveChannel: (channelDocId: Id<"communityYoutubeChannels">) => Promise<void>;
  onSaveTargeting: (
    channelDocId: Id<"communityYoutubeChannels">,
    args: { titleIncludes: string; titleExcludes: string; playlistUrlOrId: string }
  ) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<Id<"communityYoutubeChannels"> | null>(null);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Creator channels</p>
        <p className="text-xs text-muted-foreground">
          Newest matching uploads from enabled channels go into the Community stream. Use title
          words or a dedicated playlist when a creator also covers other games.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="add-yt-channel">Channel URL, @handle, or channel id</Label>
          <Input
            id="add-yt-channel"
            value={channelUrl}
            onChange={(e) => onChannelUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (adding) return;
                setAdding(true);
                void onAddChannel().finally(() => setAdding(false));
              }
            }}
            placeholder="https://www.youtube.com/@UniVersusTCG"
            className="h-10"
          />
        </div>
        <Button
          type="button"
          disabled={adding}
          onClick={() => {
            setAdding(true);
            void onAddChannel().finally(() => setAdding(false));
          }}
        >
          {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Watch channel
        </Button>
      </div>
      <ChannelTargetingFields
        includeId="add-yt-include"
        excludeId="add-yt-exclude"
        playlistId="add-yt-playlist"
        includeValue={includeValue}
        excludeValue={excludeValue}
        playlistValue={playlistValue}
        onIncludeChange={onIncludeChange}
        onExcludeChange={onExcludeChange}
        onPlaylistChange={onPlaylistChange}
      />
      {channels === undefined ? (
        <div className="text-sm text-muted-foreground animate-pulse">Loading channels…</div>
      ) : channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No watched channels yet. Add a creator and optional title words to keep only UniVersus
          videos in the stream.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {channels.map((row) => (
            <ChannelRow
              key={row.channelDocId}
              row={row}
              busy={busyId === row.channelDocId}
              onToggleEnabled={async (id, enabled) => {
                setBusyId(id);
                try {
                  await onToggleEnabled(id, enabled);
                } finally {
                  setBusyId(null);
                }
              }}
              onRemoveChannel={async (id) => {
                setBusyId(id);
                try {
                  await onRemoveChannel(id);
                } finally {
                  setBusyId(null);
                }
              }}
              onSaveTargeting={async (id, args) => {
                setBusyId(id);
                try {
                  await onSaveTargeting(id, args);
                } finally {
                  setBusyId(null);
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
