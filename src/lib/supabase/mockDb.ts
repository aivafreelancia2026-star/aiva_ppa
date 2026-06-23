import fs from 'fs'
import path from 'path'

// Path to the mock database file in the workspace
const DB_FILE = path.join(process.cwd(), '.mock-db.json')

interface MockSchema {
  users: any[]
  tasks: any[]
  shopping_items: any[]
  counters: any[]
  counter_logs: any[]
  reminders: any[]
  conversations: any[]
  messages: any[]
}

function getInitialDb(): MockSchema {
  return {
    users: [
      {
        id: 'mock-user-uuid-1234',
        email: 'test@example.com',
        name: 'Test User',
        preferred_model: 'gpt-4o-mini',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    tasks: [],
    shopping_items: [],
    counters: [],
    counter_logs: [],
    reminders: [],
    conversations: [],
    messages: []
  }
}

export function readDb(): MockSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb()
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2))
      return initial
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error reading mock db:', err)
    return getInitialDb()
  }
}

export function writeDb(db: MockSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (err) {
    console.error('Error writing mock db:', err)
  }
}

export function executeQuery(table: string, method: string, data: any, filters: any[]) {
  const db = readDb() as any
  if (!db[table]) {
    db[table] = []
  }

  let items = [...db[table]]

  // Apply filters (simple implementation of eq, order, single)
  let single = false
  for (const filter of filters) {
    if (filter.type === 'eq') {
      items = items.filter((item: any) => {
        const itemVal = item[filter.col]
        const filterVal = filter.val
        return String(itemVal) === String(filterVal)
      })
    } else if (filter.type === 'gte') {
      items = items.filter((item: any) => {
        const itemVal = item[filter.col]
        return itemVal && itemVal >= filter.val
      })
    } else if (filter.type === 'neq') {
      items = items.filter((item: any) => {
        const itemVal = item[filter.col]
        return itemVal !== filter.val
      })
    } else if (filter.type === 'single') {
      single = true
    }
  }

  if (method === 'select') {
    // Apply order filters
    for (const filter of filters) {
      if (filter.type === 'order') {
        const col = filter.col
        const ascending = filter.options?.ascending !== false
        items.sort((a: any, b: any) => {
          if (a[col] < b[col]) return ascending ? -1 : 1
          if (a[col] > b[col]) return ascending ? 1 : -1
          return 0
        })
      }
    }

    return { data: single ? (items[0] || null) : items, error: null }
  }

  if (method === 'insert') {
    const records = Array.isArray(data) ? data : [data]
    const inserted: any[] = []
    for (const rec of records) {
      const newRec = {
        id: rec.id || `mock-uuid-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...rec
      }
      db[table].push(newRec)
      inserted.push(newRec)
    }
    writeDb(db)
    return { data: single ? inserted[0] : (Array.isArray(data) ? inserted : inserted[0]), error: null }
  }

  if (method === 'update') {
    // Update matching items
    db[table] = db[table].map((item: any) => {
      // Check if item matches current filtered items
      const isMatch = items.some((matched: any) => matched.id === item.id)
      if (isMatch) {
        return {
          ...item,
          ...data,
          updated_at: new Date().toISOString()
        }
      }
      return item
    })
    writeDb(db)
    // Refetch the updated items
    const updatedDb = readDb() as any
    const updatedItems = updatedDb[table].filter((item: any) =>
      items.some((matched: any) => matched.id === item.id)
    )
    return { data: single ? (updatedItems[0] || null) : updatedItems, error: null }
  }

  if (method === 'delete') {
    db[table] = db[table].filter((item: any) =>
      !items.some((matched: any) => matched.id === item.id)
    )
    writeDb(db)
    return { data: items, error: null }
  }

  return { data: null, error: { message: 'Method not supported in mock client' } }
}
