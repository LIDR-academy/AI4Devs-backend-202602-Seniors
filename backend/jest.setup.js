const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.parsed) {
  // Expand ${VAR} references within values (dotenv-expand behaviour without the package)
  const parsed = result.parsed;
  Object.keys(parsed).forEach((key) => {
    parsed[key] = parsed[key].replace(/\$\{([^}]+)\}/g, (_, name) => {
      return parsed[name] ?? process.env[name] ?? '';
    });
  });
  Object.assign(process.env, parsed);
}

// Enable all feature flags at 100% in the test environment so integration
// tests exercise the real handlers rather than hitting the 501 gate.
process.env.FEATURE_CANDIDATE_STAGE_UPDATE = '100';
process.env.FEATURE_POSITION_CANDIDATES_ENDPOINT = '100';
