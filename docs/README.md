# Documentation map

**Product intent:** [PRODUCT_VISION.md](./PRODUCT_VISION.md)

**Runtime picture:** [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)

**Multi-game platform (tcgdecks.gg):** [multi-game.md](./multi-game.md)

**UI structure:** [component-architecture-playbook.md](./component-architecture-playbook.md)

**Agents:** [`AGENTS.md`](../AGENTS.md)

---

## Core


| Doc                                                                  | Role                                      |
| -------------------------------------------------------------------- | ----------------------------------------- |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md)                             | Outcomes, scope, principles               |
| [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)                           | Clients, Convex, data, integrations       |
| [multi-game.md](./multi-game.md)                                     | Game modules, hosts/routing, game-scoped data, auth handoff, rollout |
| [local-convex.md](./local-convex.md)                                 | Local Convex deployment for branch work (cloud dev = production) |
| [component-architecture-playbook.md](./component-architecture-playbook.md) | Feature folders and UI module shape |
| [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)                                 | Interface patterns and constraints        |
| [theme-chrome-guidelines.md](./theme-chrome-guidelines.md)           | Portable theme / chrome / styling law     |
| [floating-header-islands.md](./floating-header-islands.md)          | Desktop page header slot semantics (island bars)  |
| [mobile-shell.md](./mobile-shell.md)                                 | Mobile chrome slot semantics (nav, tab bar, search, sheets) |
| [theme-and-chrome.md](./theme-and-chrome.md)                         | This app’s appearance wiring              |


## Features


| Doc                                                                                          | Role                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------ |
| [features/community/TierListSystem.md](./features/community/TierListSystem.md)               | Tier lists, ranked scopes, rankings  |
| [teams-feature-implementation.md](./teams-feature-implementation.md)                         | Teams permissions and flows          |
| [implementation/notes/legality-dates.md](./implementation/notes/legality-dates.md)           | Format legality date semantics       |
| [universus/ability-text.md](./universus/ability-text.md)                                     | Card `text`: reminders vs abilities, colon rules |

Missing / planned feature docs: `card-data-hooks.md`, `content-moderation-and-language-filter.md`.


## Process


| Doc                                                      | Role                                      |
| -------------------------------------------------------- | ----------------------------------------- |
| [BACKLOG.md](./BACKLOG.md)                               | Queued work                               |
| [CHANGELOG.md](./CHANGELOG.md)                           | Release-facing history                    |


## Historical material

Older placeholders, process docs, finished checklists, handoffs, and deferred spikes live in **[`_noLongerNeeded/`](../_noLongerNeeded/)**.
