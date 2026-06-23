class MockQueryBuilder {
  table: string
  method: string
  filters: any[] = []
  data: any = null

  constructor(table: string, method: string = 'select', data: any = null) {
    this.table = table
    this.method = method
    this.data = data
  }

  select(fields?: string) {
    this.method = 'select'
    return this
  }

  insert(data: any) {
    this.method = 'insert'
    this.data = data
    return this
  }

  update(data: any) {
    this.method = 'update'
    this.data = data
    return this
  }

  delete() {
    this.method = 'delete'
    return this
  }

  eq(col: string, val: any) {
    this.filters.push({ type: 'eq', col, val })
    return this
  }

  gte(col: string, val: any) {
    this.filters.push({ type: 'gte', col, val })
    return this
  }

  neq(col: string, val: any) {
    this.filters.push({ type: 'neq', col, val })
    return this
  }

  upsert(data: any) {
    this.method = 'insert'
    this.data = data
    return this
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.filters.push({ type: 'order', col, options })
    return this
  }

  single() {
    this.filters.push({ type: 'single' })
    return this
  }

  async execute() {
    if (typeof window === 'undefined') {
      // Server-side
      const { executeQuery } = require('./mockDb')
      return executeQuery(this.table, this.method, this.data, this.filters)
    } else {
      // Client-side
      try {
        const res = await fetch('/ppa/api/mock-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: this.table,
            method: this.method,
            data: this.data,
            filters: this.filters
          })
        })
        return await res.json()
      } catch (err: any) {
        return { data: null, error: { message: err.message } }
      }
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createMockClient(cookieStore?: any): any {
  const auth = {
    async signInWithPassword({ email, password }: any) {
      if (typeof window === 'undefined') {
        const { readDb, writeDb } = require('./mockDb')
        const db = readDb()
        let user = db.users.find((u: any) => u.email === email)
        if (!user) {
          user = {
            id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
            email,
            name: email.split('@')[0],
            preferred_model: 'gpt-4o-mini',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          db.users.push(user)
          writeDb(db)
        }
        if (cookieStore) {
          cookieStore.set('sb-mock-session', user.id, { path: '/', httpOnly: false })
        }
        return { data: { user, session: { access_token: 'mock-token', user } }, error: null }
      } else {
        const res = await fetch('/ppa/api/mock-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signin', email, password })
        })
        return await res.json()
      }
    },

    async signUp({ email, password, options }: any) {
      const name = options?.data?.name || email.split('@')[0]
      if (typeof window === 'undefined') {
        const { readDb, writeDb } = require('./mockDb')
        const db = readDb()
        let user = db.users.find((u: any) => u.email === email)
        if (!user) {
          user = {
            id: `mock-user-${Math.random().toString(36).substr(2, 9)}`,
            email,
            name,
            preferred_model: 'gpt-4o-mini',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          db.users.push(user)
          writeDb(db)
        }
        if (cookieStore) {
          cookieStore.set('sb-mock-session', user.id, { path: '/', httpOnly: false })
        }
        return { data: { user, session: { access_token: 'mock-token', user } }, error: null }
      } else {
        const res = await fetch('/ppa/api/mock-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signup', email, password, name })
        })
        return await res.json()
      }
    },

    async signOut() {
      if (typeof window === 'undefined') {
        if (cookieStore) {
          cookieStore.delete('sb-mock-session')
        }
        return { error: null }
      } else {
        const res = await fetch('/ppa/api/mock-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signout' })
        })
        return await res.json()
      }
    },

    async getUser() {
      if (typeof window === 'undefined') {
        const mockSessionId = cookieStore?.get?.('sb-mock-session')?.value
        if (!mockSessionId) {
          return { data: { user: null }, error: null }
        }
        const { readDb } = require('./mockDb')
        const db = readDb()
        const user = db.users.find((u: any) => u.id === mockSessionId)
        return { data: { user: user || null }, error: null }
      } else {
        const res = await fetch('/ppa/api/mock-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getuser' })
        })
        return await res.json()
      }
    },

    async signInWithOAuth({ provider, options }: any) {
      return { data: { url: '/ppa/dashboard' }, error: null }
    },

    async exchangeCodeForSession(code: string) {
      return { data: { session: {} }, error: null }
    }
  }

  return {
    auth,
    from(table: string) {
      return new MockQueryBuilder(table) as any
    }
  }
}
