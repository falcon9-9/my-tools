/**
 * 计算数组元素的和
 * @param {number[]} numbers - 数字数组
 * @returns {number} 数组元素的和
 */
export function calculateSum(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('参数必须是数组')
  }
  
  return numbers.reduce((sum, num) => {
    if (typeof num !== 'number') {
      throw new Error('数组元素必须是数字')
    }
    return sum + num
  }, 0)
}

/**
 * 计算数组元素的平均值
 * @param {number[]} numbers - 数字数组
 * @returns {number} 平均值
 */
export function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return 0
  }
  
  const sum = calculateSum(numbers)
  return sum / numbers.length
}

/**
 * 获取数组中的最大值
 * @param {number[]} numbers - 数字数组
 * @returns {number} 最大值
 */
export function getMax(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null
  }
  
  return Math.max(...numbers)
}

/**
 * 获取数组中的最小值
 * @param {number[]} numbers - 数字数组
 * @returns {number} 最小值
 */
export function getMin(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return null
  }
  
  return Math.min(...numbers)
}

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 默认导出一个包含所有函数的对象
export default {
  calculateSum,
  calculateAverage,
  getMax,
  getMin,
  randomInt
} 