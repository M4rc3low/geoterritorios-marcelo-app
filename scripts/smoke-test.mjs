import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/main.jsx',
  'src/api/geoterritoriosClient.js',
  'Dockerfile',
  '.github/workflows/ci.yml'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Required file not found: ${file}`);
  }
}

const client = readFileSync('src/api/geoterritoriosClient.js', 'utf8');

if (!client.includes('geoterritoriosApi')) {
  throw new Error('Local client export not found: geoterritoriosApi');
}

if (!client.includes('geoterritorios_')) {
  throw new Error('Local storage namespace not found: geoterritorios_');
}

console.log('Smoke test passed: GeoTerritorios structure is valid.');
