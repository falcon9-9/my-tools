/**
 * 通用辅助工具函数
 */

// 首字母大写
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 生成随机ID
export function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// 格式化日期
export function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 延迟函数
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 判断是否为空值
export function isEmpty(value) {
  return value === null || value === undefined || value === '';
} 