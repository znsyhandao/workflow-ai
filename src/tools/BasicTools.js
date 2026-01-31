/**
 * 基础工具模块 - 提供文件操作、系统信息等基础功能
 */
const fs = require('fs');
const path = require('path');

class BasicTools {
  /**
   * 读取文件内容
   * @param {string} filePath 文件路径
   * @returns {string} 文件内容
   */
  static readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`读取文件时出错: ${error.message}`);
    }
  }

  /**
   * 写入文件内容
   * @param {string} filePath 文件路径
   * @param {string} content 文件内容
   */
  static writeFile(filePath, content) {
    try {
      // 确保目录存在
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      return `文件已成功写入: ${filePath}`;
    } catch (error) {
      throw new Error(`写入文件时出错: ${error.message}`);
    }
  }

  /**
   * 列出目录内容
   * @param {string} dirPath 目录路径
   * @returns {Array} 目录内容列表
   */
  static listDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      return files.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        };
      });
    } catch (error) {
      throw new Error(`列出目录内容时出错: ${error.message}`);
    }
  }

  /**
   * 获取系统信息
   * @returns {Object} 系统信息
   */
  static getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      memory: process.memoryUsage()
    };
  }

  /**
   * 创建目录
   * @param {string} dirPath 目录路径
   */
  static createDirectory(dirPath) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return `目录已成功创建: ${dirPath}`;
    } catch (error) {
      throw new Error(`创建目录时出错: ${error.message}`);
    }
  }

  /**
   * 删除文件
   * @param {string} filePath 文件路径
   */
  static deleteFile(filePath) {
    try {
      fs.unlinkSync(filePath);
      return `文件已成功删除: ${filePath}`;
    } catch (error) {
      throw new Error(`删除文件时出错: ${error.message}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath 文件路径
   * @returns {boolean} 文件是否存在
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }
}

module.exports = BasicTools;