### Destructive label contrast, dev vs PR (live)

Live in-browser measurement, 2 call sites x 8 palettes x light/dark = 32 readings per side. PR below dev: 0. Errors: 0. Blocked frames dev 49, PR 49 (app background writes only); canEdit rewrites dev 21, PR 18.

| Call site | Palette | Mode | dev | PR | Δ |
| --- | --- | --- | --- | --- | --- |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | default | light | 3.63:1 | 4.77:1 | +1.14 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | default | dark | 3.61:1 | 4.5:1 | +0.89 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | calm-storm | light | 5.23:1 | 5.23:1 | +0.00 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | calm-storm | dark | 3.57:1 | 5.23:1 | +1.66 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | cyberpunk | light | 5.45:1 | 5.45:1 | +0.00 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | cyberpunk | dark | 3.08:1 | 5.45:1 | +2.37 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | cotton-candy | light | 2.42:1 | 4.42:1 | +2.00 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | cotton-candy | dark | 3.16:1 | 5.19:1 | +2.03 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | caffeine | light | 4.21:1 | 4.21:1 | +0.00 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | caffeine | dark | 3.33:1 | 4.88:1 | +1.55 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | aurora | light | 3.77:1 | 4.78:1 | +1.01 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | aurora | dark | 3.28:1 | 4.8:1 | +1.52 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | sorbet | light | 2.44:1 | 2.79:1 | +0.35 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | sorbet | dark | 2.65:1 | 4.86:1 | +2.21 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | singularity | light | 4.71:1 | 4.71:1 | +0.00 |
| Tier-list delete confirm (`AlertDialogAction` + `text-destructive-foreground`; dev inherited `--foreground`) | singularity | dark | 2.2:1 | 4.75:1 | +2.55 |
| `Button variant="destructive"` (dev `text-white`) | default | light | 4.77:1 | 4.77:1 | +0.00 |
| `Button variant="destructive"` (dev `text-white`) | default | dark | 4.05:1 | 4.5:1 | +0.45 |
| `Button variant="destructive"` (dev `text-white`) | calm-storm | light | 3.81:1 | 5.23:1 | +1.42 |
| `Button variant="destructive"` (dev `text-white`) | calm-storm | dark | 3.81:1 | 5.23:1 | +1.42 |
| `Button variant="destructive"` (dev `text-white`) | cyberpunk | light | 3.55:1 | 5.45:1 | +1.90 |
| `Button variant="destructive"` (dev `text-white`) | cyberpunk | dark | 3.55:1 | 5.45:1 | +1.90 |
| `Button variant="destructive"` (dev `text-white`) | cotton-candy | light | 4.42:1 | 4.42:1 | +0.00 |
| `Button variant="destructive"` (dev `text-white`) | cotton-candy | dark | 3.7:1 | 5.19:1 | +1.49 |
| `Button variant="destructive"` (dev `text-white`) | caffeine | light | 3.87:1 | 4.21:1 | +0.34 |
| `Button variant="destructive"` (dev `text-white`) | caffeine | dark | 3.87:1 | 4.88:1 | +1.01 |
| `Button variant="destructive"` (dev `text-white`) | aurora | light | 4.78:1 | 4.78:1 | +0.00 |
| `Button variant="destructive"` (dev `text-white`) | aurora | dark | 4.13:1 | 4.8:1 | +0.67 |
| `Button variant="destructive"` (dev `text-white`) | sorbet | light | 2.79:1 | 2.79:1 | +0.00 |
| `Button variant="destructive"` (dev `text-white`) | sorbet | dark | 3.28:1 | 4.86:1 | +1.58 |
| `Button variant="destructive"` (dev `text-white`) | singularity | light | 3.76:1 | 4.71:1 | +0.95 |
| `Button variant="destructive"` (dev `text-white`) | singularity | dark | 3.96:1 | 4.75:1 | +0.79 |
