import axios from 'axios';
import chalk from 'chalk';
import Table from 'cli-table3';
import fs from 'fs-extra';
import { glob } from 'glob';
import { gzipSize } from 'gzip-size';
import ora from 'ora';
import prettyBytes from 'pretty-bytes';
import tar from 'tar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取目录大小
 * @param {string} dir - 目录路径
 * @returns {Promise<number>} - 目录大小（字节）
 */
async function getDirectorySize(dir) {
  let totalSize = 0;
  const files = await glob('**/*', { cwd: dir, nodir: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    totalSize += stats.size;
  }
  
  return totalSize;
}

/**
 * 获取压缩后的大小
 * @param {string} dir - 目录路径
 * @returns {Promise<number>} - 压缩后大小（字节）
 */
async function getGzipSize(dir) {
  let totalGzipSize = 0;
  const files = await glob('**/*.{js,css,json}', { cwd: dir, nodir: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = await fs.readFile(filePath);
    const gzipSizeValue = await gzipSize(content);
    totalGzipSize += gzipSizeValue;
  }
  
  return totalGzipSize;
}

/**
 * 下载并分析包
 * @param {string} packageName - 包名
 * @param {string} version - 版本号
 * @param {string} registry - npm registry 地址
 * @returns {Promise<object>} - 分析结果
 */
async function analyzePackage(packageName, version, registry) {
  const spinner = ora(`分析 ${packageName}@${version}`).start();
  
  try {
    // 创建临时目录
    const tempDir = path.join(__dirname, 'temp', `${packageName.replace('/', '-')}-${version}`);
    await fs.ensureDir(tempDir);
    
    // 构建 tarball URL
    spinner.text = `获取包信息 ${packageName}@${version}`;
    let tarballUrl;
    
    // 检查是否是 Nexus 3 格式的 registry
    if (registry.includes('nexus3.bilibili.co')) {
      // Nexus 3 格式：https://nexus3.bilibili.co/repository/npm-public/@game/game-button/-/game-button-3.18.0.tgz
      const packageNameWithoutScope = packageName.replace(/^@[^/]+\//, '');
      tarballUrl = `https://nexus3.bilibili.co/repository/npm-public/${packageName}/-/${packageNameWithoutScope}-${version}.tgz`;
    } else {
      // 标准 npm registry 格式
      try {
        const packageUrl = `${registry}/${packageName}/${version}`;
        const response = await axios.get(packageUrl);
        tarballUrl = response.data.dist.tarball;
      } catch (error) {
        // 如果获取包信息失败，尝试使用其他常见格式
        throw new Error(`无法获取包信息: ${error.message}`);
      }
    }
    
    console.log(chalk.gray(`   Tarball URL: ${tarballUrl}`));
    
    // 下载 tarball
    spinner.text = `下载 ${packageName}@${version}`;
    const tarballResponse = await axios.get(tarballUrl, { 
      responseType: 'stream',
      timeout: 60000 // 60秒超时
    });
    const tarballPath = path.join(tempDir, 'package.tgz');
    const writer = fs.createWriteStream(tarballPath);
    
    await new Promise((resolve, reject) => {
      tarballResponse.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // 解压 tarball
    spinner.text = `解压 ${packageName}@${version}`;
    await tar.x({
      file: tarballPath,
      cwd: tempDir
    });
    
    // 分析包体积
    spinner.text = `分析 ${packageName}@${version}`;
    const packageDir = path.join(tempDir, 'package');
    const unpacked = await getDirectorySize(packageDir);
    const gzipped = await getGzipSize(packageDir);
    
    // 获取文件数量
    const files = await glob('**/*', { cwd: packageDir, nodir: true });
    const fileCount = files.length;
    
    // 清理临时文件
    await fs.remove(tempDir);
    
    spinner.succeed(`完成分析 ${packageName}@${version}`);
    
    return {
      version,
      unpacked,
      gzipped,
      fileCount,
      tarballSize: unpacked
    };
  } catch (error) {
    spinner.fail(`分析失败 ${packageName}@${version}: ${error.message}`);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('package', {
      alias: 'p',
      type: 'string',
      description: '要分析的包名',
      demandOption: true
    })
    .option('versions', {
      alias: 'v',
      type: 'array',
      description: '要对比的版本号列表',
      demandOption: true
    })
    .option('registry', {
      alias: 'r',
      type: 'string',
      description: 'NPM registry 地址',
      default: 'https://registry.npmjs.org'
    })
    .help()
    .argv;
  
  const { package: packageName, versions, registry } = argv;
  
  console.log(chalk.blue(`\n📦 包体积分析工具\n`));
  console.log(chalk.gray(`包名: ${packageName}`));
  console.log(chalk.gray(`版本: ${versions.join(', ')}`));
  console.log(chalk.gray(`Registry: ${registry}\n`));
  
  const results = [];
  
  // 分析每个版本
  for (const version of versions) {
    try {
      const result = await analyzePackage(packageName, version, registry);
      results.push(result);
    } catch (error) {
      console.error(chalk.red(`分析 ${version} 失败: ${error.message}`));
    }
  }
  
  // 显示结果表格
  const table = new Table({
    head: [
      chalk.cyan('版本'),
      chalk.cyan('文件数'),
      chalk.cyan('原始大小'),
      chalk.cyan('Gzip 大小'),
      chalk.cyan('对比基准')
    ],
    style: {
      head: [],
      border: []
    }
  });
  
  // 计算大小变化
  const baseResult = results[0];
  results.forEach((result, index) => {
    const unpackedDiff = index === 0 ? '' : 
      `(${result.unpacked > baseResult.unpacked ? '+' : ''}${prettyBytes(result.unpacked - baseResult.unpacked)})`;
    const gzippedDiff = index === 0 ? '' : 
      `(${result.gzipped > baseResult.gzipped ? '+' : ''}${prettyBytes(result.gzipped - baseResult.gzipped)})`;
    
    table.push([
      result.version,
      result.fileCount,
      `${prettyBytes(result.unpacked)} ${unpackedDiff}`,
      `${prettyBytes(result.gzipped)} ${gzippedDiff}`,
      index === 0 ? '基准' : `${((result.unpacked / baseResult.unpacked) * 100).toFixed(1)}%`
    ]);
  });
  
  console.log('\n' + table.toString());
  
  // 显示汇总信息
  console.log(chalk.green('\n✨ 分析完成！\n'));
  
  // 生成报告文件
  const reportPath = path.join(__dirname, 'reports', `${packageName.replace('/', '-')}-size-report.json`);
  await fs.ensureDir(path.join(__dirname, 'reports'));
  await fs.writeJSON(reportPath, {
    packageName,
    registry,
    timestamp: new Date().toISOString(),
    results
  }, { spaces: 2 });
  
  console.log(chalk.gray(`报告已保存到: ${reportPath}`));
}

// 运行主函数
main().catch(error => {
  console.error(chalk.red(`\n❌ 错误: ${error.message}`));
  process.exit(1);
}); 