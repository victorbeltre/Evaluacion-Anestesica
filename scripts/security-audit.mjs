import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.startsWith('package-lock.json'));

const forbidden = [
  { label: 'Supabase service role key', pattern: /service[_-]?role/i },
  { label: 'GitHub personal access token', pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { label: 'Generic bearer token', pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/i },
  { label: 'Private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { label: 'Committed env secret', pattern: /^VITE_SUPABASE_(?:URL|PUBLISHABLE_KEY|ANON_KEY)=.+(?:supabase\.co|eyJ|sb_)/m },
];

const allowedFiles = new Set(['.env.example', 'SECURITY.md', 'SUPABASE_SETUP.md', 'src/vite-env.d.ts']);
const findings = [];

for (const file of trackedFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(content) && !allowedFiles.has(file)) {
      findings.push(`${rule.label}: ${file}`);
    }
  }
}

if (findings.length) {
  console.error('Security audit failed. Remove sensitive values before committing:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log('Security audit passed: no obvious secrets in tracked files.');
