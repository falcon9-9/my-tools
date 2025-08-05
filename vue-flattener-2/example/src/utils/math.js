/**
 * 数学工具函数
 */

// 加法函数
export function add(a, b) {
  return a + b;
}

export const arrowFunction = () => {
  console.log('arrowFunction');
};

export const variable = {};

// 乘法函数
export function multiply(a, b) {
  return a * b;
}

// 格式化数字（添加千位分隔符）
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 计算平方
export function square(num) {
  return multiply(num, num);
}

// 默认导出一个计算器对象
export default {
  add,
  multiply,
  formatNumber,
  square,
  // 复合计算：平方后格式化
  squareAndFormat: (num) => formatNumber(square(num))
}; 