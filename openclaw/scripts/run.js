require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const collectorAgent = require('./collector');
const summarizerAgent = require('./summarizer');

async function run() {
  const startTime = Date.now();
  console.log('=== AI News Agent Pipeline ===');
  console.log(new Date().toISOString());
  console.log('');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { realtime: { transport: ws } }
  );

  let collected = 0;
  let summarized = 0;
  let status = 'success';
  let errorMsg = null;

  try {
    const collectorResult = await collectorAgent.run();
    collected = collectorResult.inserted;

    const summarizerResult = await summarizerAgent.run();
    summarized = summarizerResult.summarized;
  } catch (err) {
    status = 'error';
    errorMsg = err.message;
    console.error('pipeline error:', err.message);
  }

  await supabase.from('runs').insert({
    articles_collected: collected,
    articles_summarized: summarized,
    status,
    error_msg: errorMsg,
    duration_ms: Date.now() - startTime,
  });

  console.log('');
  console.log(`=== done — collected: ${collected}, summarized: ${summarized}, status: ${status} ===`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('pipeline fatal:', err.message);
    process.exit(1);
  });
