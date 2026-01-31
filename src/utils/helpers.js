/**
 * 工具模块 - 提供通用的辅助函数
 */

class Helpers {
  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 格式化日期时间
   * @param {Date} date 日期对象
   * @param {string} format 格式字符串
   * @returns {string} 格式化后的日期时间
   */
  static formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 深度克隆对象
   * @param {Object} obj 要克隆的对象
   * @returns {Object} 克隆后的对象
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * 安全地访问嵌套对象属性
   * @param {Object} obj 对象
   * @param {string} path 属性路径，如 'a.b.c'
   * @param {*} defaultValue 默认值
   * @returns {*} 属性值或默认值
   */
  static getNestedProperty(obj, path, defaultValue = null) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  /**
   * 格式化字节大小
   * @param {number} bytes 字节数
   * @param {number} decimals 小数位数
   * @returns {string} 格式化后的大小
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否为有效邮箱
   */
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否为有效URL
   */
  static isValidUrl(url) {
    const re = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return re.test(url);
  }

  /**
   * 截断字符串
   * @param {string} str 原始字符串
   * @param {number} length 最大长度
   * @param {string} suffix 后缀
   * @returns {string} 截断后的字符串
   */
  static truncateString(str, length = 100, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * 打乱数组
   * @param {Array} array 原始数组
   * @returns {Array} 打乱后的数组
   */
  static shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * 去重数组
   * @param {Array} array 原始数组
   * @param {string} key 可选的对象属性键
   * @returns {Array} 去重后的数组
   */
  static uniqueArray(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
}

module.exports = Helpers;