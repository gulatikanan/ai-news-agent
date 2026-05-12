const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function healthcheck() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: runs, error } = await supabase
    .from('runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log('HEALTH ALERT: Could not query runs table:', error.message);
    process.exit(1);
  }

  if (!runs || runs.length === 0) {
    console.log('HEALTH ALERT: No pipeline runs found in database.');
    process.exit(0);
  }

  const last = runs[0];
  const ageMs = Date.now() - new Date(last.ran_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const stale = ageHours > 5;
  const failed = last.status === 'error';

  if (failed || stale) {
    console.log('HEALTH ALERT: Pipeline needs attention.');
    console.log(`Last run: ${new Date(last.ran_at).toUTCString()}`);
    console.log(`Status: ${last.status}`);
    if (failed && last.error_msg) console.log(`Error: ${last.error_msg}`);
    if (stale) console.log(`Pipeline last ran ${ageHours.toFixed(1)}h ago — expected within 5h.`);
    console.log(`Collected: ${last.articles_collected} | Summarized: ${last.articles_summarized}`);
  } else {
    console.log('HEALTH OK: Pipeline is running normally.');
    console.log(`Last run: ${new Date(last.ran_at).toUTCString()} (${ageHours.toFixed(1)}h ago)`);
    console.log(`Collected: ${last.articles_collected} | Summarized: ${last.articles_summarized} | Duration: ${(last.duration_ms / 1000).toFixed(1)}s`);
  }
}

healthcheck().catch(err => {
  console.log('HEALTH ALERT: Unexpected error —', err.message);
  process.exit(1);
});
