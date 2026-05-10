require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const collectorAgent = require('./collector');
const summarizerAgent = require('./summarizer');

async function run() {
  console.log('=== AI News Agent Pipeline ===');
  console.log(new Date().toISOString());
  console.log('');

  const collectorResult = await collectorAgent.run();
  const summarizerResult = await summarizerAgent.run();

  console.log('');
  console.log(`=== done — collected: ${collectorResult.inserted}, summarized: ${summarizerResult.summarized} ===`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('pipeline fatal:', err.message);
    process.exit(1);
  });
