export type CompanyStage = {
  level: number;
  name: string;
  maxTeamSize: number;
  incomeBonus: number;
  requiredTotalEarnedGold: number;
  requiredEmployeeCount: number;
  expansionCost: number;
};

export const COMPANY_STAGES: CompanyStage[] = [
  { level: 1, name: '팀 프로젝트', maxTeamSize: 3, incomeBonus: 0, requiredTotalEarnedGold: 0, requiredEmployeeCount: 0, expansionCost: 0 },
  { level: 2, name: '스타트업', maxTeamSize: 4, incomeBonus: 0.05, requiredTotalEarnedGold: 100_000, requiredEmployeeCount: 3, expansionCost: 50_000 },
  { level: 3, name: '중소기업', maxTeamSize: 5, incomeBonus: 0.1, requiredTotalEarnedGold: 1_000_000, requiredEmployeeCount: 10, expansionCost: 300_000 },
  { level: 4, name: '중견기업', maxTeamSize: 6, incomeBonus: 0.15, requiredTotalEarnedGold: 10_000_000, requiredEmployeeCount: 20, expansionCost: 2_000_000 },
  { level: 5, name: '대기업', maxTeamSize: 8, incomeBonus: 0.22, requiredTotalEarnedGold: 100_000_000, requiredEmployeeCount: 40, expansionCost: 15_000_000 },
  { level: 6, name: '유니콘 기업', maxTeamSize: 10, incomeBonus: 0.3, requiredTotalEarnedGold: 1_000_000_000, requiredEmployeeCount: 70, expansionCost: 100_000_000 },
];

export const getCompanyStage = (level: number) =>
  COMPANY_STAGES.find(stage => stage.level === level) ?? COMPANY_STAGES[0];
