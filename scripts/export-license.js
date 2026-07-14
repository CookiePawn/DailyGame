/* eslint-disable */

const child_process = require('child_process');
const fs = require('fs');
const util = require('util');
const path = require('path');

(async () => {
  const exec = util.promisify(child_process.exec);

  const { stdout, stderr } = await exec('cd .. && yarn react-native-oss-license --json --only-direct-dependency');

  if (stderr) return console.error('[Export License] LICENSE EXPORT FAILED: ', stderr);

  // 첫 2줄과 마지막 2줄 제거
  const cleanOutput = stdout
    .split('\n')
    .slice(2, -2)  // 첫 2줄 제거, 마지막 2줄 제거
    .join('\n');

  fs.writeFileSync('../src/screens/Stack/OpenSourceLicense/license-list.json', cleanOutput);

  console.log('[Export License] EXPORTED TO: ', path.join(__dirname, '..', 'src/screens/main-stack/open-source-license/license-list.json'));
})();
