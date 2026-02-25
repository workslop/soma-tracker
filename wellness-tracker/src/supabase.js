import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// A fixed user ID - since this is a personal app with no auth,
// we just use a constant ID. You can change this string to anything.
export const USER_ID = 'my-wellness-tracker'

export async function loadHistory() {
  const { data, error } = await supabase
    .from('wellness_logs')
    .select('*')
    .eq('user_id', USER_ID)
    .order('date', { ascending: true })

  if (error) { console.error('Load error:', error); return {} }

  const history = {}
  data.forEach(row => {
    history[row.date] = {
      sleep: row.sleep,
      bodyweight: row.bodyweight,
      workout: row.workout,
      meditation: row.meditation,
    }
  })
  return history
}

export async function saveSection(date, sectionName, sectionData) {
  const { error } = await supabase
    .from('wellness_logs')
    .upsert(
      { user_id: USER_ID, date, [sectionName]: sectionData },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    )

  if (error) { console.error('Save error:', error); return false }
  return true
}
