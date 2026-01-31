/**
 * Web服务器 - 提供工作流管理的Web界面
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

class WebServer {
  constructor(workflowEngine, port = 8080) {
    this.app = express();
    this.port = port;
    this.workflowEngine = workflowEngine;
    this.setupStaticFiles();
    this.setupRoutes();
  }

  /**
   * 设置静态文件服务
   */
  setupStaticFiles() {
    // 设置静态文件目录
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // 设置API路由
    this.app.use('/api', this.setupApiRoutes());
  }

  /**
   * 设置API路由
   */
  setupApiRoutes() {
    const router = express.Router();
    
    // 获取所有工作流
    router.get('/workflows', (req, res) => {
      const workflows = Array.from(this.workflowEngine.workflows.entries())
        .map(([name, workflow]) => ({
          name,
          steps: workflow.steps,
          authorizations: workflow.authorizations || []
        }));
      res.json({ workflows });
    });
    
    // 获取工作流执行历史
    router.get('/execution-history', (req, res) => {
      // 这里可以添加执行历史的存储和获取逻辑
      res.json({ history: [] });
    });
    
    // 执行工作流
    router.post('/execute-workflow', express.json(), async (req, res) => {
      const { workflowName, context } = req.body;
      try {
        const result = await this.workflowEngine.executeWorkflow(workflowName, context);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // 系统状态
    router.get('/status', (req, res) => {
      res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        workflows: this.workflowEngine.workflows.size
      });
    });
    
    return router;
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // 首页（使用sendFile的方式）
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
    
    // 404处理（放在最后）
    this.app.use((req, res) => {
      res.status(404).json({ error: 'API端点未找到', status: 404 });
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
          console.log(`\nWeb服务器已启动`);
          console.log(`访问地址: http://localhost:${this.port}`);
          console.log(`API地址: http://localhost:${this.port}/api`);
          resolve();
        });
      } catch (error) {
        console.error('启动Web服务器失败:', error);
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
          console.error('停止Web服务器失败:', error);
          reject(error);
        } else {
          console.log('Web服务器已停止');
          resolve();
        }
      });
    });
  }
}

module.exports = WebServer;