import { open, type DB } from '@op-engineering/op-sqlite';
import { Employee, EmployeeGrade } from '@/models';

const DATABASE_NAME = 'daily-game.sqlite';

type PlayerRow = {
  gold: number;
  total_earned_gold: number;
  total_recruit_count: number;
  last_free_recruit_at: number | null;
  last_income_at: number | null;
  company_level: number;
};

type EmployeeRow = {
  id: string;
  template_id: Employee['templateId'];
  name: string;
  job: string;
  work_skill: number;
  creativity: number;
  diligence: number;
  teamwork: number;
  leadership: number;
  luck: number;
  work_value: number;
  grade: EmployeeGrade;
  recruited_at: number;
};

export type PlayerSnapshot = {
  gold: number;
  totalEarnedGold: number;
  totalRecruitCount: number;
  lastFreeRecruitAt: number | null;
  lastIncomeAt: number | null;
  companyLevel: number;
  employees: Employee[];
  equippedEmployeeIds: string[];
};

let database: DB | null = null;
let initialization: Promise<void> | null = null;

const getDatabase = () => {
  if (database === null) {
    database = open({ name: DATABASE_NAME });
  }

  return database;
};

const mapEmployee = (row: EmployeeRow): Employee => ({
  id: row.id,
  templateId: row.template_id,
  name: row.name,
  job: row.job,
  stats: {
    workSkill: row.work_skill,
    creativity: row.creativity,
    diligence: row.diligence,
    teamwork: row.teamwork,
    leadership: row.leadership,
    luck: row.luck,
  },
  workValue: row.work_value,
  grade: row.grade,
  recruitedAt: row.recruited_at,
});

const initializeDatabase = async () => {
  if (initialization !== null) return initialization;

  initialization = (async () => {
    const db = getDatabase();
    await db.executeBatch([
      [
        `CREATE TABLE IF NOT EXISTS player_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          gold INTEGER NOT NULL,
          total_earned_gold INTEGER NOT NULL,
          total_recruit_count INTEGER NOT NULL,
          last_free_recruit_at INTEGER,
          last_income_at INTEGER,
          company_level INTEGER NOT NULL DEFAULT 1
        )`,
      ],
      [
        `CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY NOT NULL,
          template_id TEXT NOT NULL,
          name TEXT NOT NULL,
          job TEXT NOT NULL,
          work_skill INTEGER NOT NULL,
          creativity INTEGER NOT NULL,
          diligence INTEGER NOT NULL,
          teamwork INTEGER NOT NULL,
          leadership INTEGER NOT NULL,
          luck INTEGER NOT NULL,
          work_value INTEGER NOT NULL,
          grade TEXT NOT NULL,
          recruited_at INTEGER NOT NULL
        )`,
      ],
      [
        `CREATE TABLE IF NOT EXISTS equipped_employees (
          slot INTEGER PRIMARY KEY NOT NULL,
          employee_id TEXT UNIQUE NOT NULL
        )`,
      ],
    ]);

    const columnsResult = await db.execute('PRAGMA table_info(player_state)');
    const columnNames = columnsResult.rows.map(column => String(column.name));
    if (!columnNames.includes('last_income_at')) {
      await db.execute('ALTER TABLE player_state ADD COLUMN last_income_at INTEGER');
    }
    if (!columnNames.includes('company_level')) {
      await db.execute('ALTER TABLE player_state ADD COLUMN company_level INTEGER NOT NULL DEFAULT 1');
    }

    await db.execute(
      'INSERT OR IGNORE INTO player_state (id, gold, total_earned_gold, total_recruit_count, last_free_recruit_at, last_income_at, company_level) VALUES (1, 10000, 0, 0, NULL, NULL, 1)',
    );
  })();

  return initialization;
};

export const playerDatabase = {
  async load(): Promise<PlayerSnapshot> {
    await initializeDatabase();
    const db = getDatabase();
    const [playerResult, employeeResult, equippedResult] = await Promise.all([
      db.execute('SELECT gold, total_earned_gold, total_recruit_count, last_free_recruit_at, last_income_at, company_level FROM player_state WHERE id = 1'),
      db.execute('SELECT * FROM employees ORDER BY recruited_at DESC'),
      db.execute('SELECT employee_id FROM equipped_employees ORDER BY slot ASC'),
    ]);
    const player = playerResult.rows[0] as PlayerRow | undefined;

    if (!player) {
      throw new Error('플레이어 저장 데이터를 불러오지 못했습니다.');
    }

    return {
      gold: player.gold,
      totalEarnedGold: player.total_earned_gold,
      totalRecruitCount: player.total_recruit_count,
      lastFreeRecruitAt: player.last_free_recruit_at,
      lastIncomeAt: player.last_income_at,
      companyLevel: player.company_level,
      employees: employeeResult.rows.map(row => mapEmployee(row as EmployeeRow)),
      equippedEmployeeIds: equippedResult.rows.map(row => String(row.employee_id)),
    };
  },

  async saveRecruitResults({
    employees,
    gold,
    totalRecruitCount,
    lastFreeRecruitAt,
  }: Pick<PlayerSnapshot, 'gold' | 'totalRecruitCount' | 'lastFreeRecruitAt'> & { employees: Employee[] }): Promise<void> {
    await initializeDatabase();
    const db = getDatabase();

    await db.transaction(async transaction => {
      await transaction.execute(
        'UPDATE player_state SET gold = ?, total_recruit_count = ?, last_free_recruit_at = ? WHERE id = 1',
        [gold, totalRecruitCount, lastFreeRecruitAt],
      );
      for (const employee of employees) {
        await transaction.execute(
          `INSERT INTO employees (
            id, template_id, name, job, work_skill, creativity, diligence, teamwork,
            leadership, luck, work_value, grade, recruited_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employee.id,
            employee.templateId,
            employee.name,
            employee.job,
            employee.stats.workSkill,
            employee.stats.creativity,
            employee.stats.diligence,
            employee.stats.teamwork,
            employee.stats.leadership,
            employee.stats.luck,
            employee.workValue,
            employee.grade,
            employee.recruitedAt,
          ],
        );
      }
    });
  },

  async saveGold({
    gold,
    totalEarnedGold,
    lastIncomeAt,
  }: Pick<PlayerSnapshot, 'gold' | 'totalEarnedGold' | 'lastIncomeAt'>): Promise<void> {
    await initializeDatabase();
    await getDatabase().execute(
      'UPDATE player_state SET gold = ?, total_earned_gold = ?, last_income_at = ? WHERE id = 1',
      [gold, totalEarnedGold, lastIncomeAt],
    );
  },

  async saveEquippedEmployeeIds(equippedEmployeeIds: string[]): Promise<void> {
    await initializeDatabase();
    const db = getDatabase();

    await db.transaction(async transaction => {
      await transaction.execute('DELETE FROM equipped_employees');
      for (const [slot, employeeId] of equippedEmployeeIds.entries()) {
        await transaction.execute(
          'INSERT INTO equipped_employees (slot, employee_id) VALUES (?, ?)',
          [slot, employeeId],
        );
      }
    });
  },

  async saveCompanyExpansion({ gold, companyLevel }: Pick<PlayerSnapshot, 'gold' | 'companyLevel'>): Promise<void> {
    await initializeDatabase();
    await getDatabase().execute(
      'UPDATE player_state SET gold = ?, company_level = ? WHERE id = 1',
      [gold, companyLevel],
    );
  },
};
