import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查 .env')
}

export const supabase = createClient(url, key)

export const HISTORY_TABLE = 'history_data'

export const OPERATION_LOG_TABLE = 'history_operation_logs'

/** 人员固定占 id = 0 */
export const PEOPLE_ROW_ID = 0
