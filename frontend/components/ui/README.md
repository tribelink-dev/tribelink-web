# Platform UI primitives

Use these components on traveler platform routes (`/explore`, `/dashboard`, `/cart`, `/bookings`, etc.).

| Component | Use for |
|-----------|---------|
| `Button` | All CTAs — variants: `primary`, `secondary`, `ghost`, `outline`, `icon` |
| `Card` | Content panels, reserve widgets |
| `Input` / `Select` | Forms and filters |
| `Sheet` | Mobile filter panels, bottom drawers |
| `Dialog` | Center modals (desktop) |
| `DropdownMenu` | Sort menus, compact action lists |
| `PageContainer` | Platform page shell — `width`: `fluid` (default), `constrained` (`max-w-7xl`), `narrow` (`max-w-3xl`); optional `pt-below-nav` |
| `PageHeader` | Page title + description |
| `Skeleton` | Loading states for grids and detail pages |
| `Badge` | Status pills, verified tags |

## PageContainer widths

| `width` | When to use |
|---------|-------------|
| `fluid` (default) | Browse, lists, profile — full viewport with `px-page` gutters |
| `constrained` | PDP body, dense two-column layouts |
| `narrow` | Payment, short forms |

Gutters: `--page-gutter` (1rem) / `--page-gutter-lg` (2.5rem at `lg+`) via `px-page lg:px-page-lg`.

## Tokens

Defined in `app/tokens.css`. Use Tailwind aliases: `bg-background`, `bg-surface`, `text-text-primary`, `text-text-secondary`, `border-border`, `bg-brand`.

## Deprecated

Legacy classes in `globals.css` (`btn-accent`, `card-professional`, `charcoal-*` on platform pages) — do not use on new platform UI.
