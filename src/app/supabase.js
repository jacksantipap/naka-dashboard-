import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gstkzsazcwxihhrhtkjn.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_hYfjkP-E9vU0waQbY4_oGA_45_nUiMU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function getOrders(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('วันที่ทำรายการ', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

export async function getOrderStats() {
  const { data, error } = await supabase
    .from('orders')
    .select('ยอดรวม,ยอดขาย_admin,ช่องทาง,วันที่ทำรายการ,ลูกค้าใหม่_รีออเดอร์,ส่วนลด,สั่งซื้อครั้งที่,ผู้ขาย_username,ผู้ขาย_nickname,ชื่อผู้ขาย')
    .limit(5000)
  if (error) throw error
  return data || []
}

export async function insertOrders(rows) {
  const { data, error } = await supabase
    .from('orders')
    .upsert(rows, { onConflict: 'เลขออเดอร์', ignoreDuplicates: true })
  if (error) throw error
  return data
}

export async function checkExistingOrders(orderNumbers) {
  const { data, error } = await supabase
    .from('orders')
    .select('เลขออเดอร์')
    .in('เลขออเดอร์', orderNumbers)
  if (error) throw error
  return new Set((data || []).map(r => r['เลขออเดอร์']))
}
