import { ipcMain, app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { runMigrations } from '../db/migrate'

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    const dataDir = join(app.getPath('userData'), 'data')
    mkdirSync(dataDir, { recursive: true })
    const dbPath = join(dataDir, 'wiserain.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    runMigrations(db)
  }
  return db
}

export function registerDbHandlers(): void {
  ipcMain.handle('db:query', (_event, sql: string, params: unknown[] = []) => {
    return getDb().prepare(sql).get(...params)
  })

  ipcMain.handle('db:run', (_event, sql: string, params: unknown[] = []) => {
    const result = getDb().prepare(sql).run(...params)
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('db:all', (_event, sql: string, params: unknown[] = []) => {
    return getDb().prepare(sql).all(...params)
  })
}

export { getDb }
