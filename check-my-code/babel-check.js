// babel-check.js
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = './source-save/biligame/cfwl/erznbb/h5';

// 递归查找文件的函数
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
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
    files.forEach(file => {
        try {
            if (file.endsWith('.vue')) {
                // 处理 Vue 文件
                const content = fs.readFileSync(file, 'utf8');
                // 提取 script 部分
                const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
                if (scriptMatch && scriptMatch[1]) {
                    const scriptContent = scriptMatch[1];
                    babel.transform(scriptContent, {
                        filename: file,
                        plugins: ['babel-plugin-check-my-code'],
                        presets: ['@babel/preset-env']
                    });
                    console.log(`检查 Vue 文件脚本部分: ${file}`);
                } else {
                    console.log(`跳过无脚本部分的 Vue 文件: ${file}`);
                }
            } else {
                // 处理 JS 文件
                const code = fs.readFileSync(file, 'utf8');
                babel.transform(code, {
                    filename: file,
                    plugins: ['babel-plugin-check-my-code'],
                    presets: ['@babel/preset-env']
                });
                console.log(`检查文件: ${file}`);
            }
        } catch (error) {
            console.error(`处理文件 ${file} 时出错:`, error);
        }
    });
} catch (err) {
    console.error('查找文件出错:', err);
}