# Documentation map

**Product intent (read first):** [PRODUCT_VISION.md](./PRODUCT_VISION.md)

**How we structure UI code:** [component-architecture-playbook.md](./component-architecture-playbook.md)

**AI agents:** [agent-onboarding.md](./agent-onboarding.md) (implementation) · [orchestration-agent.md](./orchestration-agent.md) (delegate-only coordination)

---

## Tier 1 — aligned with current goals


| Doc                                            | Role                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md)       | Outcomes, scope, principles, roadmap themes                                  |
| [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)     | Runtime picture: clients, Convex, data, integrations                         |
| [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) | Vision ↔ repository layout, stack posture, playbook and file-size discipline |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)   | Short orientation; links to vision and analysis                              |


## Tier 2 — supporting detail


| Doc                                                              | Role                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| [TECH_STACK_DETAILS.md](./TECH_STACK_DETAILS.md)                 | Versions, tooling, where config lives                            |
| [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)                             | Interface patterns and design constraints                        |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                                 | Deploy and environment notes                                     |
| [POTENTIAL_CHALLENGES.md](./POTENTIAL_CHALLENGES.md)             | Risks and open questions                                         |
| [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md)                           | Reserved: product memory / persistence concepts (fill when used) |
| [community-tier-list-system.md](./community-tier-list-system.md) | Tier lists, rankings, aggregation (feature deep-dive)            |


## Process and hygiene


| Doc                                          | Role                                                     |
| -------------------------------------------- | -------------------------------------------------------- |
| [BACKLOG.md](./BACKLOG.md)                   | Queued work, statuses, acceptance hints                  |
| [CHANGELOG.md](./CHANGELOG.md)               | Release-facing history                                   |
| [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md) | File-size targets and how to split code (playbook-first) |
| [AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md)   | How coding and orchestration agents fit together         |


## Working notes


| Path                                                   | Role                              |
| ------------------------------------------------------ | --------------------------------- |
| [implementation/notes/](./implementation/notes/)       | Optional phase or spike notes     |
| [orchestration/run-log.md](./orchestration/run-log.md) | Optional orchestrator session log |


## Archive

Superseded or historical material belongs in **[archive/](./archive/)** so the main map stays current.

## Reference layout

The **[reference/docs/](../_reference/docs/)** tree in this repository is an example documentation tree from another product. Use it for **folder shape and tone**, not as the source of truth for **tcg-decks** behavior. This `**docs/`** directory is canonical for this app.