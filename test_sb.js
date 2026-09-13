const { createClient } = require('@supabase/supabase-js');
try {
  const supabase = createClient('https://oqecfwapemsideodfmzl.supabase.co', 'sb_publishable_mOmAsBtzyoCll0mQKpDiQQ_Tu7Z_pjN');
  console.log("Client created successfully");
} catch(e) {
  console.error("Error creating:", e);
}
