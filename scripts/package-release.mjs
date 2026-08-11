import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const releaseDirectory = path.join(root, 'build', 'releases');
const archiveName = `baby-tracker-v${version}.tar.gz`;
const archivePath = path.join(releaseDirectory, archiveName);

await mkdir(releaseDirectory, { recursive: true });
await rm(archivePath, { force: true });

await new Promise((resolve, reject) => {
  const tar = spawn('tar', ['-czf', archivePath, '-C', path.join(root, 'dist'), '.'], {
    stdio: 'inherit',
  });

  tar.on('error', reject);
  tar.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`tar exited with code ${code}`));
  });
});

const checksum = createHash('sha256').update(await readFile(archivePath)).digest('hex');
const checksumPath = `${archivePath}.sha256`;
await writeFile(checksumPath, `${checksum}  ${archiveName}\n`);

console.log(`Release package: ${path.relative(root, archivePath)}`);
console.log(`SHA-256 file:   ${path.relative(root, checksumPath)}`);
