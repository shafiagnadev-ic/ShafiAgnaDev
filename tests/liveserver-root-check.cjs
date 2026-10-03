/* Replicates Live Server's root resolution (out/src/helper.js testPathWithRoot + getSubPath)
   to confirm that a `liveServer.settings.root` value pointing at the PARENT folder makes the
   portfolio's ../Kumpulan links reachable. Run: node tests/liveserver-root-check.cjs */
const path = require('node:path');
const fs = require('node:fs');

const workspace = 'C:\\Users\\rafly\\OneDrive\\Desktop\\Agna Files\\Portofolio 2';
const target = workspace + '\\index.html';
const projectUrl = '/Kumpulan/Website/Food%20And%20Beverage/330%20KOPI/index.html';
const pattern = /\/|\/[^\/]/;

for (const root of ['/', '/..', '/../', '/../Kumpulan']) {
  const testPath = path.join(workspace, root);
  const exists = fs.existsSync(testPath);
  let rootPath = exists ? testPath : workspace;
  if (!rootPath.endsWith(path.sep)) rootPath += path.sep;
  const supported = ['.html', '.htm'].includes(path.extname(target).toLowerCase());
  const sub = supported && target.startsWith(rootPath) ? target.substring(rootPath.length) : null;
  const servesProjects = fs.existsSync(path.join(rootPath, 'Kumpulan'));
  console.log(
    JSON.stringify(root).padEnd(14),
    'schema-ok:', String(pattern.test(root)).padEnd(5),
    '| root:', rootPath,
    '\n              opens:', sub, '| ../Kumpulan reachable:', servesProjects,
    '| project 200-equivalent:', servesProjects && fs.existsSync(path.join(rootPath, decodeURIComponent(projectUrl).replace(/^\//, '')))
  );
}
