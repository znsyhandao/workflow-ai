/**
 * axios配置文件 - 支持代理服务器
 */
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
const dotenvPath = path.join(__dirname, '..', '..', 'config', '.env');
dotenv.config({ path: dotenvPath });

// 创建axios实例
const axiosInstance = axios.create({
  timeout: 30000 // 增加超时时间，解决网络较慢时的超时问题
});

// 配置代理
const proxyHost = process.env.PROXY_HOST;
const proxyPort = process.env.PROXY_PORT;

if (proxyHost && proxyPort) {
  console.log('使用代理服务器:', `${proxyHost}:${proxyPort}`);
  
  axiosInstance.defaults.proxy = {
    host: proxyHost,
    port: parseInt(proxyPort, 10) // 确保端口是数字类型
  };
}

module.exports = axiosInstance;

