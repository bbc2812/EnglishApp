import Database from 'better-sqlite3';
declare function getDb(): Database.Database;
export { getDb };
export declare function registerDbHandlers(): void;
