import { atom } from 'jotai';
import { FREE_RECRUIT_COOLDOWN_MS, RECRUITMENT_METHODS } from '@/constants';
import { Employee, RecruitmentMethod } from '@/models';
import { playerDatabase } from '@/services';
import { createRandomEmployee } from '@/utils/recruit';

export const goldAtom = atom(10_000);
export const employeesAtom = atom<Employee[]>([]);
export const totalRecruitCountAtom = atom(0);
export const lastFreeRecruitAtAtom = atom<number | null>(null);
export const totalEarnedGoldAtom = atom(0);
export const isPlayerHydratedAtom = atom(false);

export const hydratePlayerAtom = atom(null, async (_get, set) => {
  try {
    const snapshot = await playerDatabase.load();
    set(goldAtom, snapshot.gold);
    set(employeesAtom, snapshot.employees);
    set(totalRecruitCountAtom, snapshot.totalRecruitCount);
    set(totalEarnedGoldAtom, snapshot.totalEarnedGold);
    set(lastFreeRecruitAtAtom, snapshot.lastFreeRecruitAt);
  } catch (error) {
    console.error('플레이어 데이터를 불러오지 못했습니다.', error);
  } finally {
    set(isPlayerHydratedAtom, true);
  }
});

export const earnGoldAtom = atom(null, async (get, set, amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) return;

  const gold = get(goldAtom) + amount;
  const totalEarnedGold = get(totalEarnedGoldAtom) + amount;
  await playerDatabase.saveGold({ gold, totalEarnedGold });
  set(goldAtom, gold);
  set(totalEarnedGoldAtom, totalEarnedGold);
});

export type RecruitRequest = {
  method: RecruitmentMethod;
  count?: number;
};

export const recruitEmployeesAtom = atom(
  null,
  async (get, set, { method, count = 1 }: RecruitRequest): Promise<Employee[] | null> => {
    const now = Date.now();
    const recruitmentMethod = RECRUITMENT_METHODS[method];
    const lastFreeRecruitAt = get(lastFreeRecruitAtAtom);
    const recruitCount = get(totalRecruitCountAtom);
    const totalEarnedGold = get(totalEarnedGoldAtom);

    if (
      recruitCount < recruitmentMethod.requiredRecruitCount ||
      totalEarnedGold < recruitmentMethod.requiredEarnedGold
    ) {
      return null;
    }

    if (count < 1 || !Number.isInteger(count) || (recruitmentMethod.isFree && count > 1)) {
      return null;
    }

    if (recruitmentMethod.isFree &&
      lastFreeRecruitAt !== null &&
      now - lastFreeRecruitAt < FREE_RECRUIT_COOLDOWN_MS
    ) {
      return null;
    }

    const recruitCost = method === 'open-recruitment' && count === 10
      ? recruitmentMethod.cost * 9
      : recruitmentMethod.cost * count;

    if (!recruitmentMethod.isFree && get(goldAtom) < recruitCost) return null;

    const nextGold = recruitmentMethod.isFree ? get(goldAtom) : get(goldAtom) - recruitCost;
    const nextLastFreeRecruitAt = recruitmentMethod.isFree ? now : lastFreeRecruitAt;

    const employees = Array.from({ length: count }, () => createRandomEmployee(method));
    const nextRecruitCount = recruitCount + count;

    await playerDatabase.saveRecruitResults({
      employees,
      gold: nextGold,
      totalRecruitCount: nextRecruitCount,
      lastFreeRecruitAt: nextLastFreeRecruitAt,
    });

    set(goldAtom, nextGold);
    set(lastFreeRecruitAtAtom, nextLastFreeRecruitAt);
    set(employeesAtom, currentEmployees => [...employees, ...currentEmployees]);
    set(totalRecruitCountAtom, nextRecruitCount);
    return employees;
  },
);

export const recruitEmployeeAtom = atom(
  null,
  async (get, set, method: RecruitmentMethod): Promise<Employee | null> => {
    const employees = await set(recruitEmployeesAtom, { method });
    return employees?.[0] ?? null;
  },
);
