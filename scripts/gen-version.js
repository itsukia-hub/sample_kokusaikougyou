// prebuild スクリプト: src/environments/version.ts にビルド情報を書き出す。
// ローカルでは git rev-parse、Netlify では COMMIT_REF 環境変数を使う。

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getCommitShort() {
  if (process.env.COMMIT_REF) {
    return process.env.COMMIT_REF.substring(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

function getBranch() {
  if (process.env.BRANCH) {
    return process.env.BRANCH;
  }
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

const buildInfo = {
  commit: getCommitShort(),
  branch: getBranch(),
  builtAt: new Date().toISOString(),
};

const outputPath = path.join(__dirname, '..', 'src', 'environments', 'version.ts');
const content = `// AUTO-GENERATED at build time by scripts/gen-version.js. Do not edit manually.
export interface BuildInfo {
  commit: string;
  branch: string;
  builtAt: string;
}

export const BUILD_INFO: BuildInfo = ${JSON.stringify(buildInfo, null, 2)};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log('[gen-version] wrote', outputPath, buildInfo);
