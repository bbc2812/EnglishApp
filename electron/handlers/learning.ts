import { ipcMain } from 'electron'
import { getDb } from './db'

interface MarkLearningRequest {
  type: 'video' | 'audio' | 'article' | 'lesson' | 'shadowing'
  itemId: string
  itemTitle: string
  source?: string
  cefrLevel?: string
}

export function registerLearningHandlers(): void {
  // Mark an item as learnt
  ipcMain.handle('learning:mark', async (_event, req: MarkLearningRequest) => {
    const db = getDb()
    const existing = db.prepare(
      `SELECT id FROM learning_progress WHERE type = ? AND item_id = ?`
    ).get(req.type, req.itemId) as { id: number } | undefined

    if (existing) {
      // Toggle: if already learnt, unlearn it; otherwise mark as learnt
      const isCurrentlyLearnt = db.prepare(
        `SELECT completed FROM learning_progress WHERE id = ?`
      ).get(existing.id) as { completed: number }

      if (isCurrentlyLearnt.completed === 1) {
        db.prepare(
          `UPDATE learning_progress SET completed = 0, completed_at = NULL WHERE id = ?`
        ).run(existing.id)
        return { toggled: false, nowLearnt: false }
      } else {
        db.prepare(
          `UPDATE learning_progress SET completed = 1, completed_at = datetime('now') WHERE id = ?`
        ).run(existing.id)
        return { toggled: true, nowLearnt: true }
      }
    } else {
      db.prepare(
        `INSERT INTO learning_progress (type, item_id, item_title, source, cefr_level, completed, completed_at, added_at)
         VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
      ).run(req.type, req.itemId, req.itemTitle, req.source, req.cefrLevel ?? null)
      return { toggled: true, nowLearnt: true }
    }
  })

  // Get learning history with search, filters, and pagination
  ipcMain.handle('learning:getHistory', async (_event, {
    search = '',
    type = 'all',
    cefrLevel = 'all',
    completed = 'all',
    sortBy = 'newest',
    limit = 100,
    offset = 0
  }: {
    search?: string
    type?: string
    cefrLevel?: string
    completed?: string
    sortBy?: string
    limit?: number
    offset?: number
  }) => {
    const db = getDb()
    const whereClauses: string[] = []
    const params: unknown[] = []

    if (search) {
      whereClauses.push('(item_title LIKE ? OR source LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (type !== 'all') {
      whereClauses.push('type = ?')
      params.push(type)
    }
    if (cefrLevel !== 'all') {
      whereClauses.push('cefr_level = ?')
      params.push(cefrLevel)
    }
    if (completed === 'learnt') {
      whereClauses.push('completed = 1')
    } else if (completed === 'notlearnt') {
      whereClauses.push('completed = 0')
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    let orderBy = 'added_at DESC'
    if (sortBy === 'newest') orderBy = 'completed_at DESC, added_at DESC'
    else if (sortBy === 'oldest') orderBy = 'added_at ASC'
    else if (sortBy === 'level') orderBy = 'CASE cefr_level WHEN \'A2\' THEN 1 WHEN \'B1\' THEN 2 WHEN \'B2\' THEN 3 WHEN \'C1\' THEN 4 WHEN \'C2\' THEN 5 ELSE 6 END, item_title ASC'

    const rows = db.prepare(
      `SELECT * FROM learning_progress ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed: number
      completed_at: string | null
      added_at: string
    }[]

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM learning_progress ${whereSql}`
    ).get(...params) as { count: number }

    return { items: rows, total: total.count }
  })

  // Get learning stats
  ipcMain.handle('learning:getStats', async (_event) => {
    const db = getDb()

    const totalItems = db.prepare(`SELECT COUNT(*) as c FROM learning_progress`).get() as { c: number }
    const learntItems = db.prepare(`SELECT COUNT(*) as c FROM learning_progress WHERE completed = 1`).get() as { c: number }
    const byType = db.prepare(`
      SELECT type, COUNT(*) as c FROM learning_progress GROUP BY type
    `).all() as { type: string; c: number }[]

    const todayLearnt = db.prepare(`
      SELECT COUNT(*) as c FROM learning_progress
      WHERE completed = 1 AND completed_at >= date('now')
    `).get() as { c: number }

    const thisWeekLearnt = db.prepare(`
      SELECT COUNT(*) as c FROM learning_progress
      WHERE completed = 1 AND completed_at >= date('now', '-7 days')
    `).get() as { c: number }

    const recentLearnt = db.prepare(`
      SELECT * FROM learning_progress
      WHERE completed = 1
      ORDER BY completed_at DESC
      LIMIT 20
    `).all() as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    return {
      total: totalItems.c,
      learnt: learntItems.c,
      todayLearnt: todayLearnt.c,
      thisWeekLearnt: thisWeekLearnt.c,
      byType,
      recentLearnt
    }
  })

  // Get recent items for dashboard
  ipcMain.handle('learning:getRecent', async (_event, limit = 6) => {
    const db = getDb()
    const rows = db.prepare(
      `SELECT * FROM learning_progress WHERE completed = 1 ORDER BY completed_at DESC LIMIT ?`
    ).all(limit) as {
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    return rows
  })

  // Get items by date group for Learning page
  ipcMain.handle('learning:getByDate', async (_event) => {
    const db = getDb()

    const today = db.prepare(`
      SELECT * FROM learning_progress WHERE completed = 1 AND date(completed_at) = date('now')
      ORDER BY completed_at DESC
    `).all() as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    const thisWeek = db.prepare(`
      SELECT * FROM learning_progress WHERE completed = 1
      AND date(completed_at) >= date('now', '-7 days')
      AND date(completed_at) < date('now')
      ORDER BY completed_at DESC
    `).all() as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    const thisMonth = db.prepare(`
      SELECT * FROM learning_progress WHERE completed = 1
      AND date(completed_at) >= date('now', '-30 days')
      AND date(completed_at) < date('now', '-7 days')
      ORDER BY completed_at DESC
    `).all() as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    const allTime = db.prepare(`
      SELECT * FROM learning_progress WHERE completed = 1
      AND date(completed_at) < date('now', '-30 days')
      ORDER BY completed_at DESC
    `).all() as {
      id: number
      type: string
      item_id: string
      item_title: string
      source: string | null
      cefr_level: string | null
      completed_at: string | null
    }[]

    return { today, thisWeek, thisMonth, allTime }
  })

  // Check if item is already marked as learnt
  ipcMain.handle('learning:isLearnt', async (_event, type: string, itemId: string) => {
    const db = getDb()
    const row = db.prepare(
      `SELECT completed FROM learning_progress WHERE type = ? AND item_id = ?`
    ).get(type, itemId) as { completed: number } | undefined
    return row?.completed === 1
  })
}
