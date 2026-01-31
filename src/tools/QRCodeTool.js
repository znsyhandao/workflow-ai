/**
 * 二维码生成工具 - 用于生成授权链接的二维码
 */
const QRCode = require('qrcode');

class QRCodeTool {
  constructor() {
    // 二维码生成配置
    this.options = {
      type: 'terminal', // 在终端中显示二维码
      small: true,      // 生成小尺寸二维码
      color: {
        dark: '#000000',  // 深色点颜色
        light: '#ffffff'  // 浅色点颜色
      }
    };
  }

  /**
   * 在终端中生成并显示二维码
   * @param {string} text 要编码的文本（通常是URL）
   * @param {Object} options 二维码生成选项（可选）
   * @returns {Promise<void>}
   */
  async generateTerminalQRCode(text, options = {}) {
    try {
      const mergedOptions = { ...this.options, ...options };
      await QRCode.toString(text, mergedOptions, (err, url) => {
        if (err) {
          console.error('生成二维码失败:', err);
          return;
        }
        
        // 在终端中显示二维码
        console.log('\n请使用微信扫描以下二维码进行授权:');
        console.log(url);
        console.log('\n或者复制以下链接在微信中打开:');
        console.log(text);
        console.log('');
      });
    } catch (error) {
      console.error('生成二维码时出错:', error);
    }
  }

  /**
   * 生成二维码数据URL
   * @param {string} text 要编码的文本
   * @param {Object} options 二维码生成选项（可选）
   * @returns {Promise<string>} 二维码数据URL
   */
  async generateDataURL(text, options = {}) {
    try {
      const mergedOptions = { 
        ...this.options, 
        type: 'svg',
        ...options 
      };
      return await QRCode.toDataURL(text, mergedOptions);
    } catch (error) {
      console.error('生成二维码数据URL失败:', error);
      return null;
    }
  }

  /**
   * 生成二维码图片文件
   * @param {string} text 要编码的文本
   * @param {string} filePath 输出文件路径
   * @param {Object} options 二维码生成选项（可选）
   * @returns {Promise<void>}
   */
  async generateImageFile(text, filePath, options = {}) {
    try {
      const mergedOptions = { 
        ...this.options, 
        type: 'png',
        ...options 
      };
      await QRCode.toFile(filePath, text, mergedOptions);
      console.log(`二维码图片已生成: ${filePath}`);
    } catch (error) {
      console.error('生成二维码图片失败:', error);
    }
  }
}

module.exports = QRCodeTool;
