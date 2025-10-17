/*
  Cross-platform dev starter that finds a free port, sets PORT, and starts the
  main and renderer dev servers just like the previous npm start chain, but
  without failing when 1212 is in use.
*/

const path = require('path');
const { spawn } = require('child_process');
const detectPortMod = require('detect-port');
const chalk = require('chalk');
require('dotenv').config();

(async () => {
  try {
    const preferred = Number(process.env.PORT) || 1212;
    const detect = detectPortMod.default || detectPortMod; // handle ESM/CJS
    const port = await detect(preferred);

    if (port !== preferred) {
      console.log(
        chalk.black.bgYellow(`Port ${preferred} is busy; using free port ${port} instead.`)
      );
    } else {
      console.log(chalk.green(`Using port ${port}`));
    }

    // Shared env with selected PORT
    const env = { ...process.env, PORT: String(port), NODE_ENV: 'development' };

    // Start renderer dev server; it will spawn preload and main. Note: npm automatically
    // runs the "prestart" script before this file because of npm lifecycle hooks.
    const renderer = spawn('npm', ['run', 'start:renderer'], {
      env,
      shell: true,
      stdio: 'inherit',
    });

    renderer.on('error', (err) => {
      console.error(chalk.red('Failed to start renderer:'), err);
      process.exit(1);
    });

    renderer.on('close', (code) => {
      process.exit(code || 0);
    });
  } catch (err) {
    console.error(chalk.red('Dev start failed:'), err);
    process.exit(1);
  }
})();
