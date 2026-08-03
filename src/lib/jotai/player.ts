import { atom } from 'jotai';
import { FREE_RECRUIT_COOLDOWN_MS, getCompanyStage, RECRUITMENT_METHODS } from '@/constants';
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
export const companyLevelAtom = atom(1);
export const isPlayerHydratedAtom = atom(false);

export type PassiveIncomeResult = {
  amount: number;
  elapsedSeconds: number;
};

export type TeamSynergy = {
  name: string;
  description: string;
  multiplier: number;
};

export type ProjectIncome = {
  baseIncomePerSecond: number;
  incomePerSecond: number;
  synergy: TeamSynergy | null;
};

const getTeamSynergy = (employees: Employee[]): TeamSynergy | null => {
  if (employees.length < 3) return null;

  const jobs = employees.map(employee => employee.job);
  const count = (job: string) => jobs.filter(item => item === job).length;
  const developerCount = count('개발자');
  const plannerCount = count('기획자');
  const designerCount = count('디자이너');

  if (developerCount && plannerCount && designerCount) {
    return { name: '드림팀', description: '개발 · 기획 · 디자인의 완벽한 조합', multiplier: 1.2 };
  }
  if (new Set(jobs).size === 1) {
    return { name: '전문 팀', description: '동일 직군 3명의 전문성', multiplier: 1.15 };
  }
  if (developerCount >= 2 && plannerCount) {
    return { name: '빠른 실행', description: '개발과 기획의 실행력', multiplier: 1.12 };
  }
  if (developerCount >= 2 && designerCount) {
    return { name: '완성도 강화', description: '개발과 디자인의 완성도', multiplier: 1.12 };
  }
  if (plannerCount >= 2 && designerCount) {
    return { name: '사용자 중심', description: '기획과 디자인의 사용자 감각', multiplier: 1.12 };
  }
  return { name: '협업 보너스', description: '3명의 직원이 함께 만드는 성과', multiplier: 1.05 };
};

const getProjectScore = (employee: Employee) => {
  const { workSkill, creativity, diligence, teamwork, leadership, luck } = employee.stats;
  const baseScore =
    workSkill * 0.3 +
    creativity * 0.22 +
    diligence * 0.16 +
    teamwork * 0.15 +
    leadership * 0.1 +
    luck * 0.07;

  const roleMultiplier = employee.job === '개발자'
    ? 1.12
    : employee.job === '디자이너'
      ? 1.1
      : employee.job === '기획자'
        ? 1.08
        : 1;

  return baseScore * roleMultiplier;
};

export const projectIncomeAtom = atom<ProjectIncome>(get => {
  const employees = get(employeesAtom);
  const equippedEmployeeIds = get(equippedEmployeeIdsAtom);
  const equippedEmployees = equippedEmployeeIds.reduce<Employee[]>((result, employeeId) => {
    const employee = employees.find(item => item.id === employeeId);
    if (employee) result.push(employee);
    return result;
  }, []);
  const baseIncomePerSecond = Math.floor(
    equippedEmployees.reduce((total, employee) => total + getProjectScore(employee), 0) / 10,
  );
  const synergy = getTeamSynergy(equippedEmployees);
  const companyStage = getCompanyStage(get(companyLevelAtom));

  return {
    baseIncomePerSecond,
    incomePerSecond: Math.floor(baseIncomePerSecond * (synergy?.multiplier ?? 1) * (1 + companyStage.incomeBonus)),
    synergy,
  };
});

export const incomePerSecondAtom = atom(get => get(projectIncomeAtom).incomePerSecond);
export const teamSynergyAtom = atom(get => get(projectIncomeAtom).synergy);
export const companyStageAtom = atom(get => getCompanyStage(get(companyLevelAtom)));
export const maxTeamSizeAtom = atom(get => get(companyStageAtom).maxTeamSize);

export const hydratePlayerAtom = atom(null, async (_get, set) => {
  try {
    const snapshot = await playerDatabase.load();
    set(goldAtom, snapshot.gold);
    set(employeesAtom, snapshot.employees);
    set(totalRecruitCountAtom, snapshot.totalRecruitCount);
    set(totalEarnedGoldAtom, snapshot.totalEarnedGold);
    set(lastFreeRecruitAtAtom, snapshot.lastFreeRecruitAt);
    set(equippedEmployeeIdsAtom, snapshot.equippedEmployeeIds);
    set(companyLevelAtom, snapshot.companyLevel);
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
    : equippedEmployeeIds.length < get(maxTeamSizeAtom)
      ? [...equippedEmployeeIds, employeeId]
      : null;

  if (nextEquippedEmployeeIds === null) return false;

  await playerDatabase.saveEquippedEmployeeIds(nextEquippedEmployeeIds);
  set(equippedEmployeeIdsAtom, nextEquippedEmployeeIds);
  return true;
});

export const autoEquipBestEmployeesAtom = atom(null, async (get, set) => {
  const equippedEmployeeIds = get(employeesAtom)
    .slice()
    .sort((left, right) => right.workValue - left.workValue || right.recruitedAt - left.recruitedAt)
    .slice(0, Math.min(3, get(maxTeamSizeAtom)))
    .map(employee => employee.id);

  await playerDatabase.saveEquippedEmployeeIds(equippedEmployeeIds);
  set(equippedEmployeeIdsAtom, equippedEmployeeIds);
  return equippedEmployeeIds;
});

export const expandCompanyAtom = atom(null, async (get, set) => {
  const currentStage = get(companyStageAtom);
  const nextStage = getCompanyStage(currentStage.level + 1);
  if (nextStage.level === currentStage.level) return false;

  const gold = get(goldAtom);
  if (
    get(totalEarnedGoldAtom) < nextStage.requiredTotalEarnedGold ||
    get(employeesAtom).length < nextStage.requiredEmployeeCount ||
    gold < nextStage.expansionCost
  ) return false;

  const nextGold = gold - nextStage.expansionCost;
  await playerDatabase.saveCompanyExpansion({ gold: nextGold, companyLevel: nextStage.level });
  set(goldAtom, nextGold);
  set(companyLevelAtom, nextStage.level);
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
