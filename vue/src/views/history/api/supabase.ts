import { createClient } from '@supabase/supabase-js'

const url = 'https://awkwnyjujftudwxolxpf.supabase.co'
const key = 'sb_publishable_L02ZoW7Dfr12T3RDtB6VdQ_Gb64zgb_'

export const supabase = createClient(url, key)

export const HISTORY_TABLE = 'history_data'

export const OPERATION_LOG_TABLE = 'history_operation_logs'

/** 人员固定占 id = 0 */
export const PEOPLE_ROW_ID = 0
