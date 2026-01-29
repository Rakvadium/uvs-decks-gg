# Universus Mobile App - Implementation Plan

## Executive Summary

This document outlines the implementation plan for a React Native mobile application for the Universus Trading Card Game. The app will serve as a Life Tracker, Stat Tracker, and Game State Management tool with both free and premium subscription tiers.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Phase 1: Project Setup & Infrastructure](#phase-1-project-setup--infrastructure)
4. [Phase 2: Design System & Components](#phase-2-design-system--components)
5. [Phase 3: Core Life Tracker](#phase-3-core-life-tracker)
6. [Phase 4: Attack Mode](#phase-4-attack-mode)
7. [Phase 5: History & Game Records](#phase-5-history--game-records)
8. [Phase 6: Statistics & Subscription](#phase-6-statistics--subscription)
9. [Phase 7: Offline Support](#phase-7-offline-support)
10. [Phase 8: Rival Sync (Stretch Goal)](#phase-8-rival-sync-stretch-goal)
11. [Database Schema Extensions](#database-schema-extensions)
12. [API Design](#api-design)
13. [Component Architecture](#component-architecture)
14. [State Management](#state-management)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile framework |
| Expo | Development toolchain & native APIs |
| ConvexDB | Real-time backend database (existing) |
| Convex Auth | Authentication system |
| Convex Stripe Component | Subscription management |
| StyleSheet API | Native styling (React Native) |
| AsyncStorage | Local data persistence |
| expo-camera | QR code scanning for Rival Sync |
| expo-screen-orientation | Lock orientation per screen |

---

## Project Structure

```
universus-mobile/
├── app/                              # Expo Router app directory
│   ├── (auth)/                       # Auth screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                       # Main tab navigation
│   │   ├── _layout.tsx
│   │   ├── life-tracker.tsx          # Main life tracker screen
│   │   ├── stats.tsx                 # Statistics dashboard
│   │   ├── history.tsx               # Match history
│   │   └── settings.tsx              # App settings
│   ├── attack-mode.tsx               # Attack mode overlay/screen
│   ├── character-select.tsx          # Character picker modal
│   ├── rival-sync.tsx                # QR code sync screen
│   ├── _layout.tsx                   # Root layout
│   └── index.tsx                     # Entry redirect
├── components/
│   ├── ui/                           # ShadCN-inspired base components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Slider.tsx
│   │   ├── Switch.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Separator.tsx
│   │   ├── Sheet.tsx
│   │   └── index.ts
│   ├── life-tracker/
│   │   ├── PlayerPanel.tsx           # Individual player health display
│   │   ├── HealthCounter.tsx         # Tappable health adjustment
│   │   ├── SubCounter.tsx            # Additional game counters
│   │   ├── CharacterBadge.tsx        # Selected character display
│   │   ├── ResetButton.tsx           # New game button
│   │   ├── HistoryDrawer.tsx         # Health change history
│   │   └── index.ts
│   ├── attack-mode/
│   │   ├── AttackPanel.tsx           # Main attack tracking UI
│   │   ├── ZoneSelector.tsx          # High/Mid/Low zone picker
│   │   ├── StatAdjuster.tsx          # Speed/Damage modifiers
│   │   ├── ThrowToggle.tsx           # Throw attack indicator
│   │   ├── BlockButtons.tsx          # Full/Partial/No block
│   │   └── index.ts
│   ├── stats/
│   │   ├── WinLossChart.tsx          # Visual win/loss display
│   │   ├── CharacterStats.tsx        # Per-character statistics
│   │   ├── MatchCard.tsx             # Individual match display
│   │   ├── MatchEditor.tsx           # Edit/delete match modal
│   │   └── index.ts
│   ├── character/
│   │   ├── CharacterCard.tsx         # Character selection card
│   │   ├── CharacterGrid.tsx         # Character picker grid
│   │   └── index.ts
│   └── shared/
│       ├── ThemeProvider.tsx         # Theme context
│       ├── ColorPicker.tsx           # Theme color selector
│       ├── SubscriptionGate.tsx      # Premium feature guard
│       └── index.ts
├── convex/                           # Convex backend (shared with web)
│   ├── lifeTracker.ts                # Life tracker mutations/queries
│   ├── matches.ts                    # Match history management
│   ├── gameRecords.ts                # Game session records
│   ├── userPreferences.ts            # User settings/themes
│   ├── rivalSync.ts                  # Real-time sync functions
│   └── subscription.ts               # Subscription management
├── hooks/
│   ├── useLifeTracker.ts             # Life tracker state management
│   ├── useAttackMode.ts              # Attack mode state
│   ├── useCharacters.ts              # Character data fetching
│   ├── useGameHistory.ts             # History with debouncing
│   ├── useOfflineSync.ts             # Offline data management
│   ├── useRivalSync.ts               # Real-time rival connection
│   ├── useSubscription.ts            # Subscription status
│   └── useTheme.ts                   # Theme management
├── lib/
│   ├── theme/
│   │   ├── colors.ts                 # Color definitions
│   │   ├── spacing.ts                # Spacing scale
│   │   ├── typography.ts             # Font styles
│   │   ├── shadows.ts                # Shadow definitions
│   │   └── index.ts
│   ├── storage/
│   │   ├── offlineQueue.ts           # Offline mutation queue
│   │   ├── matchCache.ts             # Cached match data
│   │   └── index.ts
│   ├── utils/
│   │   ├── damage.ts                 # Damage calculation helpers
│   │   ├── health.ts                 # Health validation
│   │   └── index.ts
│   └── constants/
│       ├── zones.ts                  # Attack zones
│       ├── defaultThemes.ts          # Character default colors
│       └── index.ts
├── providers/
│   ├── ConvexProvider.tsx            # Convex client setup
│   ├── AuthProvider.tsx              # Auth context
│   ├── ThemeProvider.tsx             # Theme context
│   ├── OfflineProvider.tsx           # Offline sync context
│   └── index.ts
├── types/
│   ├── game.ts                       # Game state types
│   ├── character.ts                  # Character types
│   ├── match.ts                      # Match/stats types
│   ├── theme.ts                      # Theme types
│   └── index.ts
├── shadcn-reference/                 # Downloaded ShadCN components for reference
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── separator.tsx
│   └── sheet.tsx
├── assets/
│   ├── images/
│   │   └── universus/                # Game assets (copied from web)
│   └── fonts/
├── app.json                          # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Expo Project

```bash
bunx create-expo-app universus-mobile --template tabs
cd universus-mobile
bun install
```

### 1.2 Install Dependencies

```json
{
  "dependencies": {
    "convex": "^1.31.0",
    "@convex-dev/auth": "^0.0.90",
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-camera": "~16.0.0",
    "expo-screen-orientation": "~8.0.0",
    "expo-secure-store": "~14.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "react-native-qrcode-svg": "^6.3.0",
    "react-native-svg": "^15.0.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "zustand": "^5.0.0",
    "zod": "^4.1.0"
  }
}
```

### 1.3 Configure Convex Connection

The mobile app will connect to the existing Convex backend. Configure environment variables:

```
EXPO_PUBLIC_CONVEX_URL=<existing-convex-deployment-url>
```

### 1.4 Authentication Setup

Integrate Convex Auth with React Native:

```typescript
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
```

---

## Phase 2: Design System & Components

### 2.1 ShadCN Component Analysis

Download and analyze these ShadCN components for React Native recreation:

| ShadCN Component | RN Implementation | Priority |
|------------------|-------------------|----------|
| Button | Pressable + StyleSheet | High |
| Card | View + StyleSheet | High |
| Dialog | Modal + Animated | High |
| Input | TextInput + StyleSheet | Medium |
| Select | Custom Picker/Sheet | Medium |
| Slider | Slider + StyleSheet | High |
| Switch | Switch + StyleSheet | Medium |
| Tabs | Custom + Animated | Medium |
| Toast | Animated View | Medium |
| Badge | View + Text | High |
| Avatar | Image + View | Medium |
| Separator | View | Low |
| Sheet | Modal + PanGesture | High |

### 2.2 Theme System

```typescript
interface Theme {
  mode: "light" | "dark";
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    small: TextStyle;
    caption: TextStyle;
  };
}
```

### 2.3 Character Theme Colors

Each character has a default theme color that can be customized:

```typescript
const CHARACTER_THEME_COLORS: Record<string, { light: string; dark: string }> = {
  "Ryu": { light: "#FFFFFF", dark: "#1A1A2E" },
  "Chun-Li": { light: "#87CEEB", dark: "#1E3A5F" },
  "Akuma": { light: "#8B0000", dark: "#2D0000" },
  "Juri": { light: "#9B59B6", dark: "#2E1A47" },
};
```

---

## Phase 3: Core Life Tracker

### 3.1 Main Screen Layout

The life tracker displays two player panels:
- **Top (Rival)**: Rotated 180° for opponent viewing
- **Bottom (You)**: Normal orientation for player

```
┌─────────────────────────────────────┐
│         [RIVAL PANEL - INVERTED]    │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  [Character Badge]    ⚙️    │  │
│    │                             │  │
│    │         ५    ←  Theme color │  │
│    │       (Health)              │  │
│    │                             │  │
│    │    +              -         │  │
│    │                             │  │
│    │  [Sub Counters...]          │  │
│    └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│           [CENTER CONTROLS]         │
│   [Reset] [Attack Mode] [History]   │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────────┐  │
│    │  [Sub Counters...]          │  │
│    │                             │  │
│    │    +              -         │  │
│    │                             │  │
│    │         20                  │  │
│    │       (Health)              │  │
│    │                             │  │
│    │  [Character Badge]    ⚙️    │  │
│    └─────────────────────────────┘  │
│                                     │
│         [YOUR PANEL - NORMAL]       │
└─────────────────────────────────────┘
```

### 3.2 Player Panel Component

```typescript
interface PlayerPanelProps {
  playerId: "player" | "rival";
  isInverted: boolean;
  character: Character | null;
  health: number;
  maxHealth: number;
  themeColor: string;
  subCounters: SubCounter[];
  onHealthChange: (delta: number) => void;
  onCharacterSelect: () => void;
  onThemeChange: () => void;
  onSubCounterAdd: () => void;
  onSubCounterChange: (id: string, delta: number) => void;
  onSubCounterRemove: (id: string) => void;
}
```

### 3.3 Health Counter Interaction

- **Tap left half**: Decrease health by 1
- **Tap right half**: Increase health by 1
- **Long press**: Show number pad for direct input
- **Swipe up/down**: Rapid adjustment (±5 per gesture)

### 3.4 Character Selection

Characters are fetched from the existing Convex `cards` table where `type === "Character"`:

```typescript
const characters = useQuery(api.cards.listCharacters);
```

Each character card contains:
- `name`: Character name
- `health`: Starting health value
- `imageUrl`: Character artwork

### 3.5 Sub-Counters

Sub-counters track additional game state (poison, momentum, energy, etc.):

```typescript
interface SubCounter {
  id: string;
  name: string;
  value: number;
  icon?: string;
  color?: string;
}
```

---

## Phase 4: Attack Mode

### 4.1 Attack Mode Overlay

When attack mode is activated, an overlay appears showing attack tracking:

```
┌─────────────────────────────────────┐
│  ← Back              Attack Mode    │
├─────────────────────────────────────┤
│                                     │
│           ZONE                      │
│   ┌─────┬─────┬─────┐               │
│   │ HIGH│ MID │ LOW │               │
│   └─────┴─────┴─────┘               │
│                                     │
│    Speed: [  5  ]  [-] [+]          │
│                                     │
│    Damage: [ 11 ]  [-] [+]          │
│                                     │
│    ┌─────────────────────────────┐  │
│    │      [ THROW ]              │  │
│    └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │         FULL BLOCK            │  │
│  │        (0 damage)             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       PARTIAL BLOCK           │  │
│  │        (6 damage)             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         NO BLOCK              │  │
│  │        (11 damage)            │  │
│  └───────────────────────────────┘  │
│                                     │
│          [Current HP: 20 → ??]      │
└─────────────────────────────────────┘
```

### 4.2 Attack State

```typescript
interface AttackState {
  isActive: boolean;
  zone: "high" | "mid" | "low" | null;
  speed: number;
  damage: number;
  isThrow: boolean;
  attacker: "player" | "rival";
  defender: "player" | "rival";
}
```

### 4.3 Damage Calculation

```typescript
function calculateDamage(
  attack: AttackState,
  blockResult: "full" | "partial" | "none"
): number {
  const baseDamage = attack.damage;
  
  if (baseDamage <= 0) return 0;
  
  switch (blockResult) {
    case "full":
      return attack.isThrow ? Math.ceil(baseDamage / 2) : 0;
    case "partial":
      return Math.ceil(baseDamage / 2);
    case "none":
      return baseDamage;
  }
}
```

### 4.4 Attack Resolution Flow

1. Player enters attack mode
2. Selects attack zone (High/Mid/Low)
3. Adjusts speed and damage modifiers
4. Optionally toggles Throw
5. Taps block result button
6. Damage applied to defender's health
7. Attack mode exits
8. History record created

---

## Phase 5: History & Game Records

### 5.1 Health Change Debouncing

Health changes are debounced to create meaningful history entries:

```typescript
const DEBOUNCE_DELAY = 1500;

function useHealthHistory() {
  const [pendingChange, setPendingChange] = useState<HealthChange | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const recordChange = useCallback((change: HealthChange) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setPendingChange((prev) => {
      if (!prev) return change;
      return {
        ...prev,
        delta: prev.delta + change.delta,
        newHealth: change.newHealth,
      };
    });
    
    timeoutRef.current = setTimeout(() => {
      commitChange(pendingChange);
      setPendingChange(null);
    }, DEBOUNCE_DELAY);
  }, []);

  return { recordChange };
}
```

### 5.2 History Entry Types

```typescript
type HistoryEntry = 
  | {
      type: "health_change";
      playerId: "player" | "rival";
      delta: number;
      previousHealth: number;
      newHealth: number;
      timestamp: number;
    }
  | {
      type: "attack_result";
      attacker: "player" | "rival";
      defender: "player" | "rival";
      zone: "high" | "mid" | "low";
      damage: number;
      blockResult: "full" | "partial" | "none";
      isThrow: boolean;
      timestamp: number;
    }
  | {
      type: "counter_change";
      playerId: "player" | "rival";
      counterName: string;
      delta: number;
      timestamp: number;
    };
```

### 5.3 History Drawer

A slide-up drawer showing session history with undo capability for recent changes.

---

## Phase 6: Statistics & Subscription

### 6.1 Match Record Structure

```typescript
interface MatchRecord {
  _id: Id<"matchRecords">;
  userId: Id<"users">;
  playerCharacterId: Id<"cards">;
  rivalCharacterId: Id<"cards">;
  result: "win" | "loss" | "draw";
  playerFinalHealth: number;
  rivalFinalHealth: number;
  duration: number;
  createdAt: number;
  deckId?: Id<"decks">;
  notes?: string;
  syncedFromOffline?: boolean;
}
```

### 6.2 Game Session Creation

A game record is created when:
1. Health totals change for the first time after app load or reset
2. The session persists until reset is pressed

```typescript
interface GameSession {
  _id: Id<"gameSessions">;
  userId: Id<"users">;
  playerCharacterId: Id<"cards">;
  rivalCharacterId: Id<"cards">;
  startedAt: number;
  endedAt?: number;
  history: HistoryEntry[];
  finalResult?: "win" | "loss" | "draw";
}
```

### 6.3 Statistics Views

**Free Tier:**
- Current session tracking
- Basic win/loss display (last 10 matches)

**Premium Tier:**
- Full match history
- Per-character statistics
- Win rate by matchup
- Performance trends over time
- Match editing/deletion
- Data export

### 6.4 Subscription Integration

```typescript
const subscriptionTiers = {
  free: {
    matchHistoryLimit: 10,
    statsAccess: false,
    offlineSync: false,
    rivalSync: false,
  },
  premium: {
    matchHistoryLimit: Infinity,
    statsAccess: true,
    offlineSync: true,
    rivalSync: true,
    price: "$2.99/month",
  },
};
```

---

## Phase 7: Offline Support

### 7.1 Offline Queue

Matches recorded offline are queued for sync:

```typescript
interface OfflineQueueItem {
  id: string;
  type: "match_record" | "match_update" | "match_delete";
  data: unknown;
  createdAt: number;
  retryCount: number;
}
```

### 7.2 Sync Strategy

```typescript
async function syncOfflineData() {
  const queue = await getOfflineQueue();
  
  for (const item of queue) {
    try {
      switch (item.type) {
        case "match_record":
          await createMatch(item.data as MatchInput);
          break;
        case "match_update":
          await updateMatch(item.data as MatchUpdate);
          break;
        case "match_delete":
          await deleteMatch(item.data as { id: Id<"matchRecords"> });
          break;
      }
      await removeFromQueue(item.id);
    } catch (error) {
      item.retryCount++;
      if (item.retryCount >= 3) {
        await moveToFailedQueue(item);
      }
    }
  }
}
```

### 7.3 Network Status Handling

```typescript
function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const nowOnline = state.isConnected ?? false;
      
      setIsOnline(nowOnline);
      
      if (wasOffline && nowOnline) {
        syncOfflineData();
      }
    });
    
    return unsubscribe;
  }, [isOnline]);
  
  return { isOnline };
}
```

---

## Phase 8: Rival Sync (Stretch Goal)

### 8.1 Sync Flow

1. **Host** presses "Share Game" button
2. App generates a unique session code + QR code
3. **Rival** scans QR code or enters code manually
4. Both devices now share real-time game state
5. Either player can modify health/counters
6. Changes sync instantly via Convex subscriptions

### 8.2 Session Token Structure

```typescript
interface SyncSession {
  _id: Id<"syncSessions">;
  hostUserId: Id<"users">;
  rivalUserId?: Id<"users">;
  sessionCode: string;
  gameState: GameState;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}
```

### 8.3 Real-time Updates

```typescript
const useSyncedGameState = (sessionId: Id<"syncSessions">) => {
  const session = useQuery(api.rivalSync.getSession, { sessionId });
  const updateGameState = useMutation(api.rivalSync.updateGameState);
  
  return {
    gameState: session?.gameState,
    updateHealth: (playerId: "player" | "rival", delta: number) => {
      updateGameState({
        sessionId,
        update: { type: "health", playerId, delta },
      });
    },
  };
};
```

### 8.4 QR Code Generation

```typescript
const generateSessionQR = (sessionCode: string) => {
  const deepLink = `universus://join/${sessionCode}`;
  return <QRCode value={deepLink} size={200} />;
};
```

---

## Database Schema Extensions

Add these tables to the existing Convex schema:

```typescript
gameSessions: defineTable({
  userId: v.id("users"),
  playerCharacterId: v.optional(v.id("cards")),
  rivalCharacterId: v.optional(v.id("cards")),
  playerHealth: v.number(),
  rivalHealth: v.number(),
  playerMaxHealth: v.number(),
  rivalMaxHealth: v.number(),
  playerSubCounters: v.array(v.object({
    id: v.string(),
    name: v.string(),
    value: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  })),
  rivalSubCounters: v.array(v.object({
    id: v.string(),
    name: v.string(),
    value: v.number(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  })),
  history: v.array(v.any()),
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  result: v.optional(v.union(
    v.literal("win"),
    v.literal("loss"),
    v.literal("draw")
  )),
})
  .index("by_user", ["userId"])
  .index("by_user_and_date", ["userId", "startedAt"]),

matchRecords: defineTable({
  userId: v.id("users"),
  gameSessionId: v.optional(v.id("gameSessions")),
  playerCharacterId: v.id("cards"),
  rivalCharacterId: v.id("cards"),
  result: v.union(
    v.literal("win"),
    v.literal("loss"),
    v.literal("draw")
  ),
  playerFinalHealth: v.number(),
  rivalFinalHealth: v.number(),
  duration: v.number(),
  deckId: v.optional(v.id("decks")),
  notes: v.optional(v.string()),
  syncedFromOffline: v.optional(v.boolean()),
  playedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_player_character", ["userId", "playerCharacterId"])
  .index("by_user_and_rival_character", ["userId", "rivalCharacterId"])
  .index("by_user_and_date", ["userId", "playedAt"]),

userPreferences: defineTable({
  userId: v.id("users"),
  themeMode: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  colorScheme: v.string(),
  playerDefaultColor: v.optional(v.string()),
  rivalDefaultColor: v.optional(v.string()),
  characterColors: v.optional(v.record(v.string(), v.string())),
  hapticFeedback: v.optional(v.boolean()),
  soundEffects: v.optional(v.boolean()),
})
  .index("by_user", ["userId"]),

syncSessions: defineTable({
  hostUserId: v.id("users"),
  rivalUserId: v.optional(v.id("users")),
  sessionCode: v.string(),
  gameSessionId: v.id("gameSessions"),
  isActive: v.boolean(),
  expiresAt: v.number(),
})
  .index("by_code", ["sessionCode"])
  .index("by_host", ["hostUserId"])
  .index("by_active", ["isActive"]),
```

---

## API Design

### Life Tracker Mutations

```typescript
export const updateHealth = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    playerId: v.union(v.literal("player"), v.literal("rival")),
    delta: v.number(),
  },
  returns: v.object({
    newHealth: v.number(),
    historyEntryId: v.string(),
  }),
  handler: async (ctx, args) => {},
});

export const resetGame = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    result: v.optional(v.union(
      v.literal("win"),
      v.literal("loss"),
      v.literal("draw")
    )),
  },
  returns: v.id("gameSessions"),
  handler: async (ctx, args) => {},
});

export const setCharacter = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    playerId: v.union(v.literal("player"), v.literal("rival")),
    characterId: v.id("cards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {},
});
```

### Match Record Mutations

```typescript
export const createMatchRecord = mutation({
  args: {
    playerCharacterId: v.id("cards"),
    rivalCharacterId: v.id("cards"),
    result: v.union(v.literal("win"), v.literal("loss"), v.literal("draw")),
    playerFinalHealth: v.number(),
    rivalFinalHealth: v.number(),
    duration: v.number(),
    deckId: v.optional(v.id("decks")),
    notes: v.optional(v.string()),
    playedAt: v.optional(v.number()),
    syncedFromOffline: v.optional(v.boolean()),
  },
  returns: v.id("matchRecords"),
  handler: async (ctx, args) => {},
});

export const updateMatchRecord = mutation({
  args: {
    matchId: v.id("matchRecords"),
    result: v.optional(v.union(v.literal("win"), v.literal("loss"), v.literal("draw"))),
    notes: v.optional(v.string()),
    deckId: v.optional(v.id("decks")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {},
});

export const deleteMatchRecord = mutation({
  args: {
    matchId: v.id("matchRecords"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {},
});
```

### Statistics Queries

```typescript
export const getCharacterStats = query({
  args: {
    characterId: v.optional(v.id("cards")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  returns: v.object({
    totalMatches: v.number(),
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    winRate: v.number(),
    matchups: v.array(v.object({
      rivalCharacterId: v.id("cards"),
      wins: v.number(),
      losses: v.number(),
      winRate: v.number(),
    })),
  }),
  handler: async (ctx, args) => {},
});

export const getMatchHistory = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    characterId: v.optional(v.id("cards")),
  },
  returns: v.object({
    matches: v.array(matchRecordValidator),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {},
});
```

---

## Component Architecture

### State Management with Zustand

```typescript
interface GameStore {
  playerHealth: number;
  rivalHealth: number;
  playerMaxHealth: number;
  rivalMaxHealth: number;
  playerCharacter: Character | null;
  rivalCharacter: Character | null;
  playerThemeColor: string;
  rivalThemeColor: string;
  playerSubCounters: SubCounter[];
  rivalSubCounters: SubCounter[];
  attackMode: AttackState;
  history: HistoryEntry[];
  sessionId: string | null;
  isSessionActive: boolean;
  
  setPlayerHealth: (health: number) => void;
  setRivalHealth: (health: number) => void;
  adjustHealth: (playerId: "player" | "rival", delta: number) => void;
  setCharacter: (playerId: "player" | "rival", character: Character) => void;
  setThemeColor: (playerId: "player" | "rival", color: string) => void;
  addSubCounter: (playerId: "player" | "rival", counter: SubCounter) => void;
  updateSubCounter: (playerId: "player" | "rival", id: string, delta: number) => void;
  removeSubCounter: (playerId: "player" | "rival", id: string) => void;
  enterAttackMode: (attacker: "player" | "rival") => void;
  exitAttackMode: () => void;
  updateAttack: (updates: Partial<AttackState>) => void;
  resolveAttack: (blockResult: "full" | "partial" | "none") => void;
  resetGame: (result?: "win" | "loss" | "draw") => void;
  undoLastChange: () => void;
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Initialize Expo project
- [ ] Set up Convex connection
- [ ] Create base UI components (Button, Card, etc.)
- [ ] Implement theme system

### Week 3-4: Life Tracker Core
- [ ] Build PlayerPanel component
- [ ] Implement health counter interactions
- [ ] Add character selection
- [ ] Create sub-counter system
- [ ] Build center controls

### Week 5-6: Attack Mode
- [ ] Design attack mode overlay
- [ ] Implement zone selection
- [ ] Add stat modifiers
- [ ] Build block resolution
- [ ] Integrate with health tracking

### Week 7-8: History & Persistence
- [ ] Implement debounced history recording
- [ ] Build history drawer UI
- [ ] Add undo functionality
- [ ] Set up game session creation
- [ ] Implement reset flow

### Week 9-10: Statistics & Subscription
- [ ] Create match record system
- [ ] Build statistics views
- [ ] Integrate Stripe subscriptions
- [ ] Add premium feature gating

### Week 11-12: Offline & Polish
- [ ] Implement offline queue
- [ ] Add network sync handling
- [ ] Polish animations
- [ ] Performance optimization
- [ ] Testing & bug fixes

### Week 13+ (Stretch): Rival Sync
- [ ] QR code generation
- [ ] Deep linking setup
- [ ] Real-time sync implementation
- [ ] Session management

---

## Testing Strategy

### Unit Tests
- Damage calculation functions
- Health validation logic
- Debounce behavior
- Offline queue operations

### Integration Tests
- Convex mutations/queries
- Authentication flow
- Subscription verification

### E2E Tests
- Complete game session flow
- Attack mode resolution
- History recording
- Reset functionality

---

## Accessibility Considerations

- Large touch targets (minimum 44x44 points)
- High contrast mode support
- Screen reader labels for all interactive elements
- Haptic feedback for health changes
- Sound effects (optional) for actions
- Support for reduced motion preferences

---

## Performance Optimizations

- Memoize expensive character list renders
- Use `useMemo` for filtered/sorted data
- Lazy load statistics views
- Optimize image loading for character cards
- Batch Convex mutations where possible
- Use `React.memo` for static UI elements

---

## Security Considerations

- Validate all mutations server-side
- Rate limit API calls
- Sanitize user input (notes, etc.)
- Secure session tokens for Rival Sync
- Encrypt sensitive data in AsyncStorage
- Implement proper auth token refresh

---

## Future Enhancements (Post-MVP)

1. **Deck Integration**: Select deck instead of character, track deck-specific stats
2. **Card Gallery**: Browse card database within app
3. **Deck Builder**: Mobile deck building experience
4. **Collection Tracking**: Scan and track physical cards
5. **Tournament Mode**: Multi-round tracking
6. **Social Features**: Friend lists, match sharing
7. **Replay System**: Step-through match history
8. **Analytics Dashboard**: Advanced statistics visualization
