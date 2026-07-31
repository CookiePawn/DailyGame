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
export const equippedEmployeeIdsAtom = atom<string[]>([]);
export const lastIncomeAtAtom = atom<number | null>(null);
export const isPlayerHydratedAtom = atom(false);

export type PassiveIncomeResult = {
  amount: number;
  elapsedSeconds: number;
};

export const incomePerSecondAtom = atom(get => {
  const employees = get(employeesAtom);
  const equippedEmployeeIds = get(equippedEmployeeIdsAtom);
  const totalWorkValue = equippedEmployeeIds.reduce((total, employeeId) => {
    const employee = employees.find(item => item.id === employeeId);
    return total + (employee?.workValue ?? 0);
  }, 0);

  return Math.floor(totalWorkValue / 10);
});

export const hydratePlayerAtom = atom(null, async (_get, set) => {
  try {
    const snapshot = await playerDatabase.load();
    set(goldAtom, snapshot.gold);
    set(employeesAtom, snapshot.employees);
    set(totalRecruitCountAtom, snapshot.totalRecruitCount);
    set(totalEarnedGoldAtom, snapshot.totalEarnedGold);
    set(lastFreeRecruitAtAtom, snapshot.lastFreeRecruitAt);
    set(equippedEmployeeIdsAtom, snapshot.equippedEmployeeIds);
    set(lastIncomeAtAtom, snapshot.lastIncomeAt ?? Date.now());
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
  await playerDatabase.saveGold({
    gold,
    totalEarnedGold,
    lastIncomeAt: get(lastIncomeAtAtom),
  });
  set(goldAtom, gold);
  set(totalEarnedGoldAtom, totalEarnedGold);
});

export const collectPassiveIncomeAtom = atom<null, [now?: number], Promise<PassiveIncomeResult>>(
  null,
  async (get, set, now = Date.now()) => {
    const lastIncomeAt = get(lastIncomeAtAtom);
    if (lastIncomeAt === null) {
      set(lastIncomeAtAtom, now);
      await playerDatabase.saveGold({
        gold: get(goldAtom),
        totalEarnedGold: get(totalEarnedGoldAtom),
        lastIncomeAt: now,
      });
      return { amount: 0, elapsedSeconds: 0 };
    }

    const elapsedSeconds = Math.floor((now - lastIncomeAt) / 1000);
    if (elapsedSeconds <= 0) return { amount: 0, elapsedSeconds: 0 };

    const nextIncomeAt = lastIncomeAt + elapsedSeconds * 1000;
    const amount = get(incomePerSecondAtom) * elapsedSeconds;
    const gold = get(goldAtom) + amount;
    const totalEarnedGold = get(totalEarnedGoldAtom) + amount;

    await playerDatabase.saveGold({ gold, totalEarnedGold, lastIncomeAt: nextIncomeAt });
    set(lastIncomeAtAtom, nextIncomeAt);
    set(goldAtom, gold);
    set(totalEarnedGoldAtom, totalEarnedGold);
    return { amount, elapsedSeconds };
  },
);

export const toggleEquippedEmployeeAtom = atom(null, async (get, set, employeeId: string) => {
  const equippedEmployeeIds = get(equippedEmployeeIdsAtom);
  const employeeIndex = equippedEmployeeIds.indexOf(employeeId);
  const nextEquippedEmployeeIds = employeeIndex >= 0
    ? equippedEmployeeIds.filter(id => id !== employeeId)
    : equippedEmployeeIds.length < 3
      ? [...equippedEmployeeIds, employeeId]
      : null;

  if (nextEquippedEmployeeIds === null) return false;

  await playerDatabase.saveEquippedEmployeeIds(nextEquippedEmployeeIds);
  set(equippedEmployeeIdsAtom, nextEquippedEmployeeIds);
  return true;
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
