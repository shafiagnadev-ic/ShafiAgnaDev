/* Playwright resolver.
   node_modules was moved out of this folder (into ../Kumpulan/node_modules) so the
   portfolio folder stays small, so the browser tests can no longer rely on Node walking
   up from tests/ to find playwright. Resolve it explicitly instead, with an env override
   for a machine where it lives somewhere else:
     PLAYWRIGHT_MODULE=C:/path/to/node_modules/playwright-core node tests/motion-ui.cjs */
const path = require('node:path');
const fs = require('node:fs');

function load(name) {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE && path.join(process.env.PLAYWRIGHT_MODULE, '..', name),
    path.join(__dirname, '..', 'node_modules', name),
    path.join(__dirname, '..', '..', 'Kumpulan', 'node_modules', name),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  return require(name);
}

module.exports = {playwrightCore: load('playwright-core'), playwright: load('playwright')};
