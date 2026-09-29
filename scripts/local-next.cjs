const { spawn } = require('node:child_process');
const command = process.argv[2];
if (!['dev', 'start', 'build', 'lint'].includes(command) || process.argv.length > 3) {
  throw new Error('Use npm run dev/start/build/lint without overrides. Host is fixed to 127.0.0.1.');
}
const args = [require.resolve('next/dist/bin/next'), command];
if (command === 'dev' || command === 'start') args.push('--hostname', '127.0.0.1', '--port', '3001');
const child = spawn(process.execPath, args, { stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));
