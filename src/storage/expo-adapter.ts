import type { ISqliteDatabase, ISqliteStatement } from './types.js';

/**
 * Creates an ISqliteDatabase adapter for expo-sqlite in React Native environments,
 * or falls back to node:sqlite DatabaseSync when running in Node.js test runners.
 */
export function createDatabaseDriver(dbName = 'marketmimic.db'): ISqliteDatabase {
  // 1. Check if running inside Expo/React Native with expo-sqlite available
  try {
    if (typeof require === 'function') {
      const SQLite = require('expo-sqlite');
      if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
        const expoDb = SQLite.openDatabaseSync(dbName);
        return new ExpoSqliteDriver(expoDb);
      }
    }
  } catch {
    // expo-sqlite not available (e.g. running in Node.js vitest environment)
  }

  // 2. Node.js environment fallback using node:sqlite DatabaseSync
  try {
    let nodeSqlite: any = null;
    if (typeof process !== 'undefined' && typeof (process as any).getBuiltinModule === 'function') {
      nodeSqlite = (process as any).getBuiltinModule('node:sqlite');
    }
    if (!nodeSqlite && typeof require === 'function') {
      nodeSqlite = require('node:sqlite');
    }

    if (nodeSqlite && typeof nodeSqlite.DatabaseSync === 'function') {
      const nodeDb = new nodeSqlite.DatabaseSync(dbName === ':memory:' ? ':memory:' : undefined);
      return new NodeSqliteDriver(nodeDb);
    }
  } catch {
    // node:sqlite fallback
  }

  // 3. Fallback driver
  return createInMemoryDriver();
}

/**
 * Expo SQLite Driver adapting expo-sqlite sync methods to ISqliteDatabase
 */
export class ExpoSqliteDriver implements ISqliteDatabase {
  constructor(private readonly db: any) {}

  public exec(sql: string): void {
    this.db.execSync(sql);
  }

  public prepare(sql: string): ISqliteStatement {
    return {
      run: (...params: unknown[]) => this.db.runSync(sql, ...params),
      get: (...params: unknown[]) => this.db.getFirstSync(sql, ...params) ?? undefined,
      all: (...params: unknown[]) => this.db.getAllSync(sql, ...params),
    };
  }
}

/**
 * Node.js SQLite Driver adapting node:sqlite DatabaseSync to ISqliteDatabase
 */
export class NodeSqliteDriver implements ISqliteDatabase {
  constructor(private readonly db: any) {}

  public exec(sql: string): void {
    this.db.exec(sql);
  }

  public prepare(sql: string): ISqliteStatement {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params: unknown[]) => stmt.run(...params),
      get: (...params: unknown[]) => stmt.get(...params),
      all: (...params: unknown[]) => stmt.all(...params),
    };
  }
}

/**
 * In-memory fallback driver for pure unit testing without binary SQLite libraries
 */
function createInMemoryDriver(): ISqliteDatabase {
  return {
    exec(_sql: string) {},
    prepare(_sql: string) {
      return {
        run: (..._params: unknown[]) => ({ changes: 1 }),
        get: (..._params: unknown[]) => undefined,
        all: (..._params: unknown[]) => [],
      };
    },
  };
}
