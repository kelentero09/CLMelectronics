# CLM Electronics Engineering Services — Company Profile Website

Next.js 14 + TypeScript + Tailwind CSS 3.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Content

- `src/data/company.ts` — company info, contact, nav
- `src/data/services.ts` — service categories
- `src/data/equipment.ts` — equipment expertise + parts sourcing
- `src/data/board-repair.ts` — board repair records (`station`, `model`, `boardDescription`, `image`, `problem`, `repairRate`)
- `src/data/legal.ts` — business registration / permit documents shown in the About page gallery

To add a board repair record, append an object to `boardRepairRecords`. Filters, summary
statistics, desktop table, and mobile cards update automatically.

## Images

Place client-supplied board/equipment photos under `public/images/…` and set the record's
`image` field to that path (e.g. `/images/boards/indelag-infosam3.jpg`). Records with
`image: null` render a clean "Photo coming soon" placeholder.
