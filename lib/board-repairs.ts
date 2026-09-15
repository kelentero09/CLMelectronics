import { prisma } from "@/lib/db";

export type BoardRepairRow = {
  id: string;
  key: string;
  station: string;
  model: string;
  boardDescription: string;
  image: string | null;
  problem: string;
  repairRate: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

type BoardRepairDelegate = {
  findMany: (args: object) => Promise<BoardRepairRow[]>;
  findUnique: (args: object) => Promise<BoardRepairRow | null>;
};

/**
 * Returns the BoardRepair delegate, or null when the running process holds a
 * stale Prisma client (dev server started before `prisma generate` ran —
 * `global.prisma` caches the old client). Callers fall back to static data
 * or an empty list instead of crashing on `undefined.findMany`.
 * Fix is a dev-server restart; production builds always use a fresh client.
 */
export function boardRepairDelegate(): BoardRepairDelegate | null {
  const client = prisma as unknown as { boardRepair?: BoardRepairDelegate };
  return client.boardRepair ?? null;
}
