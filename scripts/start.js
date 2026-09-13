const concurrently = require('concurrently');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

console.log('\n========================================');
console.log('  LAAS Real Estate - Starting servers');
console.log('========================================');
console.log('  Backend  -> http://localhost:8001');
console.log('  Frontend -> http://localhost:5173');
console.log('  Si aad u joojiso, xidh furaha.');
console.log('========================================\n');

const { result } = concurrently([
  {
    name: 'Backend',
    command: 'npm run dev',
    cwd: backendDir,
    prefixColor: 'green',
  },
  {
    name: 'Frontend',
    command: 'npm run dev',
    cwd: frontendDir,
    prefixColor: 'cyan',
  },
]);

result.then(
  () => process.exit(0),
  () => process.exit(1)
);
