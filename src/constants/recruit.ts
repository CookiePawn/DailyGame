import { Assets } from '@/assets';
import {
  EmployeeGrade,
  EmployeeStatKey,
  EmployeeTemplateId,
  RecruitmentMethod,
} from '@/models';

export const FREE_RECRUIT_COOLDOWN_MS = 60 * 60 * 1000;

export const RECRUITMENT_METHODS: Record<
  RecruitmentMethod,
  {
    name: string;
    description: string;
    cost: number;
    minStat: number;
    maxStat: number;
    requiredRecruitCount: number;
    requiredEarnedGold: number;
    isFree: boolean;
  }
> = {
  'job-posting': {
    name: '채용 공고 지원자',
    description: '공고를 보고 찾아온 지원자를 무료로 만나보세요.',
    cost: 0,
    minStat: 1,
    maxStat: 100,
    requiredRecruitCount: 0,
    requiredEarnedGold: 0,
    isFree: true,
  },
  'open-recruitment': {
    name: '공개 채용',
    description: '다양한 지원자 중 새로운 직원을 채용합니다.',
    cost: 1_000,
    minStat: 1,
    maxStat: 100,
    requiredRecruitCount: 0,
    requiredEarnedGold: 0,
    isFree: false,
  },
  'experienced-hire': {
    name: '경력직 채용',
    description: '검증된 경력자를 영입해 더 높은 능력치를 기대할 수 있습니다.',
    cost: 10_000,
    minStat: 35,
    maxStat: 100,
    requiredRecruitCount: 10,
    requiredEarnedGold: 0,
    isFree: false,
  },
  headhunting: {
    name: '헤드헌팅',
    description: '전문 헤드헌터를 통해 핵심 인재를 비공개로 영입합니다.',
    cost: 50_000,
    minStat: 60,
    maxStat: 100,
    requiredRecruitCount: 30,
    requiredEarnedGold: 100_000,
    isFree: false,
  },
};

export const EMPLOYEE_STAT_LABELS: Record<EmployeeStatKey, string> = {
  workSkill: '업무력',
  creativity: '창의성',
  diligence: '성실성',
  teamwork: '협업력',
  leadership: '리더십',
  luck: '행운',
};

export const EMPLOYEE_STAT_WEIGHTS: Record<EmployeeStatKey, number> = {
  workSkill: 0.35,
  creativity: 0.15,
  diligence: 0.15,
  teamwork: 0.15,
  leadership: 0.1,
  luck: 0.1,
};

export const EMPLOYEE_TEMPLATES: Array<{
  id: EmployeeTemplateId;
  name: string;
  job: string;
  image: number;
}> = [
  { id: 'developer-man-01', name: '도윤', job: '개발자', image: Assets.Images.Characters.DeveloperMan01 },
  { id: 'developer-woman-01', name: '서연', job: '개발자', image: Assets.Images.Characters.DeveloperWoman01 },
  { id: 'designer-woman-01', name: '하린', job: '디자이너', image: Assets.Images.Characters.DesignerWoman01 },
  { id: 'designer-woman-02', name: '유진', job: '디자이너', image: Assets.Images.Characters.DesignerWoman02 },
  { id: 'designer-woman-03', name: '지아', job: '디자이너', image: Assets.Images.Characters.DesignerWoman03 },
  { id: 'planner-man-01', name: '민준', job: '기획자', image: Assets.Images.Characters.PlannerMan01 },
  { id: 'security-man-01', name: '성호', job: '보안 담당', image: Assets.Images.Characters.SecurityMan01 },
];

export const GRADE_COLORS: Record<EmployeeGrade, string> = {
  D: '#8A8A8A',
  C: '#57A56A',
  B: '#4B86D1',
  A: '#9A64C9',
  S: '#E4A925',
  SS: '#E66B5B',
  SSS: '#DC4C83',
  'SSS+': '#B94BE1',
};
