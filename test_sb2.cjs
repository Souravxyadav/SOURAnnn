const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oqecfwapemsideodfmzl.supabase.co', 'sb_publishable_mOmAsBtzyoCll0mQKpDiQQ_Tu7Z_pjN');
supabase.auth.signInWithPassword({email: 'test@example.com', password: 'password'}).then(r => console.log(r)).catch(e => console.error(e));
