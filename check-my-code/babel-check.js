// babel-check.js
// 在文件开头设置环境变量
process.env.CHECK_MY_CODE_MODE = 'check';

const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = './';
const excludeDir = ['node_modules', 'dist', 'build', 'public', 'static', 'assets', 'images', 'fonts'];

// 全局变量，存储当前处理的文件名，供插件使用
global.CURRENT_PROCESSING_FILE = null;

// 递归查找文件的函数
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        // 跳过 node_modules 目录
        if (excludeDir.includes(file)) {
            return;
        }
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.vue')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// 查找并处理文件
try {
    const files = findFiles(targetDir);
    console.log(`找到 ${files.length} 个文件需要处理`);
    
    files.forEach((file, index) => {
        console.log(`处理第 ${index+1}/${files.length} 个文件: ${file}`);
        
        try {
            // 设置全局当前处理的文件名
            global.CURRENT_PROCESSING_FILE = file;
            const pluginPath = 'babel-plugin-check-my-code';
            
            if (file.endsWith('.vue')) {
                // 处理 Vue 文件
                const content = fs.readFileSync(file, 'utf8');
                // 提取 script 部分
                const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
                if (scriptMatch && scriptMatch[1]) {
                    const scriptContent = scriptMatch[1];
                    try {
                        babel.transform(scriptContent, {
                            filename: file,
                            plugins: [
                                [pluginPath, { currentFilename: file }]
                            ],
                            presets: ['@babel/preset-env']
                        });
                        console.log(`检查 Vue 文件脚本部分: ${file} - 成功`);
                    } catch (transformError) {
                        console.error(`Babel 转换失败: ${file}`, transformError);
                    }
                } else {
                    console.log(`跳过无脚本部分的 Vue 文件: ${file}`);
                }
            } else {
                // 处理 JS 文件
                const code = fs.readFileSync(file, 'utf8');
                
                try {
                    babel.transform(code, {
                        filename: file,
                        plugins: [
                            [pluginPath, { currentFilename: file }]
                        ],
                        presets: ['@babel/preset-env']
                    });
                    console.log(`检查文件: ${file} - 成功`);
                } catch (transformError) {
                    console.error(`Babel 转换失败: ${file}`, transformError);
                }
            }
        } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error);
        } finally {
            // 清除全局变量
            global.CURRENT_PROCESSING_FILE = null;
        }
    });
} catch (err) {
    console.error('查找文件出错:', err);
}