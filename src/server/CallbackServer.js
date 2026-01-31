/**
 * 授权回调服务器 - 处理多平台授权回调
 */
const express = require('express');
const path = require('path');

class CallbackServer {
  constructor(authorizationManager, workflowEngine, port = 3000) {
    this.app = express();
    this.port = port;
    this.authorizationManager = authorizationManager;
    this.workflowEngine = workflowEngine;
    this.pendingWorkflows = new Map(); // 存储等待授权的工作流
    
    this.setupRoutes();
    this.setupStaticFiles();
  }

  /**
   * 设置静态文件服务
   */
  setupStaticFiles() {
    // 设置静态文件目录
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // 微信授权回调
    this.app.get('/wechat/callback', async (req, res) => {
      const { code, state } = req.query;
      try {
        const connector = this.authorizationManager.getConnector('wechat');
        if (!connector) {
          return res.send('微信连接器未注册');
        }
        
        // 获取访问令牌
        const token = await connector.getAccessTokenByCode(code);
        this.authorizationManager.saveCredentials('wechat', token);
        
        res.send(`<html><body><h1>微信授权成功！</h1><p>授权已完成，您可以关闭此页面并返回命令行继续执行。</p></body></html>`);
      } catch (error) {
        console.error('微信授权回调处理失败:', error);
        res.send(`<html><body><h1>微信授权失败！</h1><p>错误信息: ${error.message}</p></body></html>`);
      }
    });
    
    // GitHub授权回调
    this.app.get('/github/callback', async (req, res) => {
      const { code, state } = req.query;
      try {
        const connector = this.authorizationManager.getConnector('github');
        if (!connector) {
          return res.send('GitHub连接器未注册');
        }
        
        // 获取访问令牌
        const token = await connector.getAccessToken(code);
        this.authorizationManager.saveCredentials('github', token);
        
        res.send(`<html><body><h1>GitHub授权成功！</h1><p>授权已完成，您可以关闭此页面并返回命令行继续执行。</p></body></html>`);
      } catch (error) {
        console.error('GitHub授权回调处理失败:', error);
        res.send(`<html><body><h1>GitHub授权失败！</h1><p>错误信息: ${error.message}</p></body></html>`);
      }
    });
    
    // Google授权回调
    this.app.get('/google/callback', async (req, res) => {
      const { code, state } = req.query;
      try {
        const connector = this.authorizationManager.getConnector('google');
        if (!connector) {
          return res.send('Google连接器未注册');
        }
        
        // 获取访问令牌
        const token = await connector.getAccessToken(code);
        this.authorizationManager.saveCredentials('google', token);
        
        res.send(`<html><body><h1>Google授权成功！</h1><p>授权已完成，您可以关闭此页面并返回命令行继续执行。</p></body></html>`);
      } catch (error) {
        console.error('Google授权回调处理失败:', error);
        res.send(`<html><body><h1>Google授权失败！</h1><p>错误信息: ${error.message}</p></body></html>`);
      }
    });
    
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.send('授权回调服务器运行正常');
    });
  }

  /**
   * 启动服务器
   * @returns {Promise<void>}
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`\n授权回调服务器已启动`);
          console.log(`服务器地址: http://localhost:${this.port}`);
          console.log(`健康检查: http://localhost:${this.port}/health`);
          console.log(`微信回调: http://localhost:${this.port}/wechat/callback`);
          console.log(`GitHub回调: http://localhost:${this.port}/github/callback`);
          console.log(`Google回调: http://localhost:${this.port}/google/callback`);
          resolve();
        });
      } catch (error) {
        console.error('启动授权回调服务器失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   * @returns {Promise<void>}
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close((error) => {
        if (error) {
          console.error('停止授权回调服务器失败:', error);
          reject(error);
        } else {
          console.log('授权回调服务器已停止');
          resolve();
        }
      });
    });
  }

  /**
   * 保存待处理的工作流
   * @param {string} workflowName 工作流名称
   * @param {Object} context 工作流上下文
   * @returns {string} 状态标识
   */
  savePendingWorkflow(workflowName, context) {
    const state = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pendingWorkflows.set(state, { workflowName, context });
    return state;
  }

  /**
   * 获取待处理的工作流
   * @param {string} state 状态标识
   * @returns {Object|null} 工作流信息
   */
  getPendingWorkflow(state) {
    return this.pendingWorkflows.get(state);
  }

  /**
   * 移除待处理的工作流
   * @param {string} state 状态标识
   */
  removePendingWorkflow(state) {
    this.pendingWorkflows.delete(state);
  }
}

module.exports = CallbackServer;
