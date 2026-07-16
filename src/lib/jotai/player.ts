import { atom } from 'jotai';
import { FREE_RECRUIT_COOLDOWN_MS, RECRUITMENT_METHODS } from '@/constants';
import { Employee, RecruitmentMethod } from '@/models';
import { createRandomEmployee } from '@/utils/recruit';

export const goldAtom = atom(10_000);
export const employeesAtom = atom<Employee[]>([]);
export const totalRecruitCountAtom = atom(0);
export const lastFreeRecruitAtAtom = atom<number | null>(null);
export const totalEarnedGoldAtom = atom(0);

export const recruitEmployeeAtom = atom(
  null,
  (get, set, method: RecruitmentMethod): Employee | null => {
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

    if (recruitmentMethod.isFree &&
      lastFreeRecruitAt !== null &&
      now - lastFreeRecruitAt < FREE_RECRUIT_COOLDOWN_MS
    ) {
      return null;
    }

    if (recruitmentMethod.isFree) {
      set(lastFreeRecruitAtAtom, now);
    } else {
      if (get(goldAtom) < recruitmentMethod.cost) return null;
      set(goldAtom, currentGold => currentGold - recruitmentMethod.cost);
    }

    const employee = createRandomEmployee(method);
    set(employeesAtom, currentEmployees => [employee, ...currentEmployees]);
    set(totalRecruitCountAtom, currentCount => currentCount + 1);
    return employee;
  },
);
