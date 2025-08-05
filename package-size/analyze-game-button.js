import { spawn } from 'child_process';
import chalk from 'chalk';

/**
 * 运行分析命令
 */
async function analyzeGameButton() {
  console.log(chalk.blue('\n🎮 分析 @game/game-button 包体积\n'));
  
  const args = [
    'index.js',
    '--package', '@game/game-button',
    '--versions', '3.20.0', '3.18.0', '3.8.7',
    '--registry', 'https://nexus3.bilibili.co'
  ];
  
  const child = spawn('node', args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(chalk.red(`执行失败: ${error.message}`));
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(chalk.red(`进程退出，代码: ${code}`));
      process.exit(code);
    }
  });
}

// 运行分析
analyzeGameButton(); 