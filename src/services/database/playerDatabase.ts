import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { Employee, EmployeeGrade, EmployeeStats } from '@/models';

const DATABASE_NAME = 'daily-game.sqlite';

type PlayerRow = {
  gold: number;
  total_earned_gold: number;
  total_recruit_count: number;
  last_free_recruit_at: number | null;
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
  employees: Employee[];
};

let database: QuickSQLiteConnection | null = null;
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
    await db.executeBatchAsync([
      [
        `CREATE TABLE IF NOT EXISTS player_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          gold INTEGER NOT NULL,
          total_earned_gold INTEGER NOT NULL,
          total_recruit_count INTEGER NOT NULL,
          last_free_recruit_at INTEGER
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
        'INSERT OR IGNORE INTO player_state (id, gold, total_earned_gold, total_recruit_count, last_free_recruit_at) VALUES (1, 10000, 0, 0, NULL)',
      ],
    ]);
  })();

  return initialization;
};

export const playerDatabase = {
  async load(): Promise<PlayerSnapshot> {
    await initializeDatabase();
    const db = getDatabase();
    const [playerResult, employeeResult] = await Promise.all([
      db.executeAsync('SELECT gold, total_earned_gold, total_recruit_count, last_free_recruit_at FROM player_state WHERE id = 1'),
      db.executeAsync('SELECT * FROM employees ORDER BY recruited_at DESC'),
    ]);
    const player = playerResult.rows?._array[0] as PlayerRow | undefined;

    if (!player) {
      throw new Error('플레이어 저장 데이터를 불러오지 못했습니다.');
    }

    return {
      gold: player.gold,
      totalEarnedGold: player.total_earned_gold,
      totalRecruitCount: player.total_recruit_count,
      lastFreeRecruitAt: player.last_free_recruit_at,
      employees: (employeeResult.rows?._array ?? []).map(row => mapEmployee(row as EmployeeRow)),
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
      await transaction.executeAsync(
        'UPDATE player_state SET gold = ?, total_recruit_count = ?, last_free_recruit_at = ? WHERE id = 1',
        [gold, totalRecruitCount, lastFreeRecruitAt],
      );
      for (const employee of employees) {
        await transaction.executeAsync(
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

  async saveGold({ gold, totalEarnedGold }: Pick<PlayerSnapshot, 'gold' | 'totalEarnedGold'>): Promise<void> {
    await initializeDatabase();
    await getDatabase().executeAsync(
      'UPDATE player_state SET gold = ?, total_earned_gold = ? WHERE id = 1',
      [gold, totalEarnedGold],
    );
  },
};
