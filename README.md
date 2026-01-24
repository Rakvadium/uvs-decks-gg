# TCG Platform

A multi-game Trading Card Game platform built with Next.js, Convex, and React. This platform provides a flexible architecture for supporting multiple trading card games with features like deck building, collection management, and social features.

## Features

- **Multi-Game Support**: Extensible architecture supporting multiple card games
- **Real-time Updates**: Powered by Convex for instant data synchronization
- **Deck Builder**: Create, edit, and share deck lists with drag-and-drop support
- **Collection Tracking**: Track your card collection with condition and foil variants
- **Card Gallery**: Browse and search cards with filtering and pagination
- **Social Features**: Follow users, like decks, and track views
- **Customizable UI**: Game-specific themes, terminology, and components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (real-time database and serverless functions)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Convex Auth
- **Package Manager**: Bun

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Convex](https://convex.dev/) account

### Installation

```bash
bun install
```

### Development

Start the Convex backend:

```bash
bunx convex dev
```

In another terminal, start the Next.js dev server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Getting Started](./docs/Getting-Started.md)** - Installation, project structure, and quick start examples
- **[API Reference](./docs/API-Reference.md)** - Complete Convex API documentation with examples
- **[Components Reference](./docs/Components-Reference.md)** - React components and hooks documentation
- **[Database Schema](./docs/Database-Schema.md)** - Database tables, indexes, and relationships

### Additional Architecture Docs

- [01-foundation.md](./docs/01-foundation.md) - Core architecture concepts
- [02-the-registry.md](./docs/02-the-registry.md) - Game registry system
- [03-data-layer.md](./docs/03-data-layer.md) - Data layer design
- [04-deck-builder.md](./docs/04-deck-builder.md) - Deck builder implementation
- [05-real-time.md](./docs/05-real-time.md) - Real-time features
- [06-context-switching.md](./docs/06-context-switching.md) - Game context switching
- [07-specifics-riftbound.md](./docs/07-specifics-riftbound.md) - Game-specific implementations

## Project Structure

```
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── admin.ts            # Admin API (games, sets, cards CRUD)
│   ├── cards.ts            # Cards query API
│   ├── collections.ts      # Collection management API
│   ├── decks.ts            # Deck management API
│   ├── games.ts            # Games API
│   ├── sets.ts             # Sets API
│   ├── social.ts           # Social features (likes, follows, views)
│   └── user.ts             # User API
│
├── src/
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   └── auth/           # Authentication components
│   │
│   └── lib/
│       ├── game/           # Game system core
│       │   ├── context.tsx # GameProvider
│       │   ├── registry.ts # Game registration
│       │   ├── types.ts    # Type definitions
│       │   └── hooks/      # Data hooks
│       │
│       ├── games/          # Game implementations
│       │   ├── base/       # Base game components
│       │   ├── universus/  # UniVersus game
│       │   └── testGame/   # Test game
│       │
│       └── dnd/            # Drag and drop system
│
└── docs/                   # Documentation
```

## Key Concepts

### Game Registry

Games are registered with customizable configurations including:

- Theme colors
- Feature flags
- Custom terminology
- Game-specific components
- Sidebar actions
- Search configurations

```typescript
import { registerGame, IGameConfig } from "@/lib/game";

const config: IGameConfig = {
  id: "my-game",
  name: "My Game",
  theme: { primary: "220 70% 50%", ... },
  flags: { hideGallery: false, ... },
  terminology: { card: "Card", deck: "Deck", ... },
  components: { GalleryView: MyGallery, ... },
  hooks: createBaseGameHooks(gameId),
};

registerGame(config);
```

### Data Hooks

Type-safe hooks for accessing game data:

```typescript
import { useCards, useDecks, useCollection } from "@/lib/game/hooks";

const { cards, isLoading } = useCards(gameId, { search: "dragon" });
const { decks } = useDecks(userId, gameId);
const { entries } = useCollection(userId, gameId);
```

### TcgCard Component

Versatile card display component with multiple variants:

```tsx
import { TcgCard } from "@/lib/games/base/components";

<TcgCard
  card={card}
  variant="grid"
  showDeckControls
  deckCount={3}
  onAddToDeck={handleAdd}
  onRemoveFromDeck={handleRemove}
/>
```

## API Overview

| API | Description |
|-----|-------------|
| `games` | List, get, create, update games |
| `cards` | Query cards with search, filters, pagination |
| `sets` | Query card sets/expansions |
| `decks` | CRUD for user decks, add/remove cards |
| `collections` | Track user card ownership |
| `social` | Likes, views, follows |
| `admin` | Admin CRUD operations, bulk import |
| `user` | Current user info |

## License

MIT
