import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/supabase/mockDb'

export async function POST(req: NextRequest) {
  try {
    const { table, method, data, filters } = await req.json()
    const result = executeQuery(table, method, data, filters)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ data: null, error: { message: err.message } }, { status: 500 })
  }
}
