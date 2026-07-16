import {
  EMPLOYEE_STAT_WEIGHTS,
  EMPLOYEE_TEMPLATES,
} from '@/constants';
import {
  Employee,
  EmployeeGrade,
  EmployeeStats,
  EmployeeTemplateId,
  RecruitmentMethod,
} from '@/models';
import { RECRUITMENT_METHODS } from '@/constants';

const randomStat = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getGrade = (workValue: number, isPerfectStats: boolean): EmployeeGrade => {
  if (isPerfectStats) return 'SSS+';
  if (workValue >= 93) return 'SSS';
  if (workValue >= 83) return 'SS';
  if (workValue >= 70) return 'S';
  if (workValue >= 55) return 'A';
  if (workValue >= 40) return 'B';
  if (workValue >= 25) return 'C';
  return 'D';
};

export const calculateWorkValue = (stats: EmployeeStats) => {
  const weightedValue = Object.entries(EMPLOYEE_STAT_WEIGHTS).reduce(
    (total, [stat, weight]) => total + stats[stat as keyof EmployeeStats] * weight,
    0,
  );

  const isPerfectStats = Object.values(stats).every(value => value === 100);
  return isPerfectStats ? 100 : Math.min(99, Math.round(weightedValue));
};

export const createRandomEmployee = (method: RecruitmentMethod): Employee => {
  const template = EMPLOYEE_TEMPLATES[Math.floor(Math.random() * EMPLOYEE_TEMPLATES.length)];
  const recruitmentMethod = RECRUITMENT_METHODS[method];
  const stats: EmployeeStats = {
    workSkill: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
    creativity: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
    diligence: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
    teamwork: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
    leadership: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
    luck: randomStat(recruitmentMethod.minStat, recruitmentMethod.maxStat),
  };
  const workValue = calculateWorkValue(stats);
  const isPerfectStats = Object.values(stats).every(value => value === 100);

  return {
    id: `${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: template.id as EmployeeTemplateId,
    name: template.name,
    job: template.job,
    stats,
    workValue,
    grade: getGrade(workValue, isPerfectStats),
    recruitedAt: Date.now(),
  };
};
