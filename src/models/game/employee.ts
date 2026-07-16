export type EmployeeStatKey =
  | 'workSkill'
  | 'creativity'
  | 'diligence'
  | 'teamwork'
  | 'leadership'
  | 'luck';

export type EmployeeStats = Record<EmployeeStatKey, number>;

export type EmployeeGrade = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'SSS+';

export type EmployeeTemplateId =
  | 'developer-man-01'
  | 'developer-woman-01'
  | 'designer-woman-01'
  | 'designer-woman-02'
  | 'designer-woman-03'
  | 'planner-man-01'
  | 'security-man-01';

export type Employee = {
  id: string;
  templateId: EmployeeTemplateId;
  name: string;
  job: string;
  stats: EmployeeStats;
  workValue: number;
  grade: EmployeeGrade;
  recruitedAt: number;
};
