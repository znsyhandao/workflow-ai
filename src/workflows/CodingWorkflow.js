/**
 * 编码工作流 - 集成CodingAgent的智能编码能力
 */
const CodingAgent = require('../agents/CodingAgent');
const fs = require('fs').promises;
const path = require('path');

class CodingWorkflow {
  constructor() {
    this.name = '智能编码助手';
    this.description = '基于AI的智能代码生成和修改工作流';
    this.codingAgent = new CodingAgent();
  }

  /**
   * 执行编码工作流
   * @param {string} requirement 用户需求
   * @param {Object} context 上下文信息
   * @returns {Promise<Object>} 执行结果
   */
  async execute(requirement, context = {}) {
    try {
      console.log('开始执行智能编码工作流...');
      
      // 1. 需求分析阶段
      console.log('阶段1: 需求分析');
      const analysisResult = await this.analyzeRequirement(requirement);
      
      // 2. 代码生成阶段
      console.log('阶段2: 代码生成');
      const codingResult = await this.generateCode(analysisResult);
      
      // 3. 测试验证阶段
      console.log('阶段3: 测试验证');
      const testResult = await this.validateCode(codingResult);
      
      // 4. 集成部署阶段
      console.log('阶段4: 集成部署');
      const integrationResult = await this.integrateCode(codingResult, testResult);
      
      return {
        success: true,
        stages: {
          analysis: analysisResult,
          coding: codingResult,
          testing: testResult,
          integration: integrationResult
        },
        summary: this.generateSummary(requirement, codingResult)
      };
      
    } catch (error) {
      console.error('编码工作流执行失败:', error);
      return {
        success: false,
        error: error.message,
        recommendation: '请检查需求描述是否清晰，或联系技术支持'
      };
    }
  }

  /**
   * 分析用户需求
   * @param {string} requirement 需求描述
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeRequirement(requirement) {
    try {
      const plan = await this.codingAgent.analyzeRequirement(requirement);
      
      return {
        status: 'completed',
        plan: plan,
        complexity: plan.complexity,
        estimatedTime: plan.estimated_time,
        risks: plan.risks
      };
    } catch (error) {
      throw new Error(`需求分析失败: ${error.message}`);
    }
  }

  /**
   * 生成代码
   * @param {Object} analysisResult 分析结果
   * @returns {Promise<Object>} 代码生成结果
   */
  async generateCode(analysisResult) {
    try {
      const requirement = analysisResult.plan.task_description;
      const codingResult = await this.codingAgent.processCodingTask(requirement);
      
      return {
        status: codingResult.success ? 'completed' : 'failed',
        files: codingResult.results,
        workspace: codingResult.workspace,
        plan: codingResult.plan
      };
    } catch (error) {
      throw new Error(`代码生成失败: ${error.message}`);
    }
  }

  /**
   * 验证代码
   * @param {Object} codingResult 代码生成结果
   * @returns {Promise<Object>} 验证结果
   */
  async validateCode(codingResult) {
    try {
      const testResults = [];
      
      // 对每个生成的文件进行基础验证
      for (const file of codingResult.files) {
        if (file.status === 'success') {
          const filePath = path.join(codingResult.workspace, file.file);
          const code = await fs.readFile(filePath, 'utf8');
          
          // 基础语法验证
          const syntaxValid = await this.validateSyntax(code, file.file);
          
          // 生成测试用例
          const testCode = await this.codingAgent.generateTests(
            code, 
            codingResult.plan.task_description
          );
          
          testResults.push({
            file: file.file,
            syntaxValid: syntaxValid,
            testCode: testCode,
            hasTests: !!testCode
          });
        }
      }
      
      return {
        status: 'completed',
        testResults: testResults,
        overallValid: testResults.every(r => r.syntaxValid)
      };
    } catch (error) {
      console.warn('代码验证阶段出现警告:', error.message);
      return {
        status: 'warning',
        warning: error.message,
        overallValid: false
      };
    }
  }

  /**
   * 集成代码
   * @param {Object} codingResult 代码生成结果
   * @param {Object} testResult 测试结果
   * @returns {Promise<Object>} 集成结果
   */
  async integrateCode(codingResult, testResult) {
    try {
      // 生成集成报告
      const integrationReport = {
        timestamp: new Date().toISOString(),
        totalFiles: codingResult.files.length,
        successfulFiles: codingResult.files.filter(f => f.status === 'success').length,
        syntaxValid: testResult.overallValid,
        hasTests: testResult.testResults.some(r => r.hasTests)
      };
      
      // 生成部署说明
      const deploymentGuide = await this.generateDeploymentGuide(codingResult, testResult);
      
      return {
        status: 'completed',
        integrationReport: integrationReport,
        deploymentGuide: deploymentGuide,
        nextSteps: this.getNextSteps(codingResult, testResult)
      };
    } catch (error) {
      throw new Error(`代码集成失败: ${error.message}`);
    }
  }

  /**
   * 验证代码语法
   * @param {string} code 代码
   * @param {string} fileName 文件名
   * @returns {Promise<boolean>} 语法是否有效
   */
  async validateSyntax(code, fileName) {
    try {
      const ext = path.extname(fileName);
      
      if (ext === '.js') {
        // 简单的JavaScript语法检查
        try {
          // 使用Node.js的语法检查
          const { parse } = require('acorn');
          parse(code, { ecmaVersion: 2020 });
          return true;
        } catch {
          return false;
        }
      }
      
      // 其他文件类型默认通过
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成部署指南
   * @param {Object} codingResult 代码生成结果
   * @param {Object} testResult 测试结果
   * @returns {Promise<string>} 部署指南
   */
  async generateDeploymentGuide(codingResult, testResult) {
    const prompt = `根据以下代码生成结果，生成部署指南：

生成的文件：${JSON.stringify(codingResult.files, null, 2)}
测试结果：${JSON.stringify(testResult, null, 2)}

请提供详细的部署步骤和使用说明：`;

    return await this.codingAgent.callAI(prompt);
  }

  /**
   * 获取下一步建议
   * @param {Object} codingResult 代码生成结果
   * @param {Object} testResult 测试结果
   * @returns {Array} 下一步建议
   */
  getNextSteps(codingResult, testResult) {
    const steps = [];
    
    if (!testResult.overallValid) {
      steps.push('检查并修复语法错误');
    }
    
    if (codingResult.files.some(f => f.status === 'error')) {
      steps.push('重新生成失败的文件');
    }
    
    steps.push('在测试环境中验证功能');
    steps.push('进行代码审查');
    steps.push('部署到生产环境');
    
    return steps;
  }

  /**
   * 生成执行摘要
   * @param {string} requirement 原始需求
   * @param {Object} codingResult 代码生成结果
   * @returns {string} 摘要
   */
  generateSummary(requirement, codingResult) {
    const successfulFiles = codingResult.files.filter(f => f.status === 'success');
    const failedFiles = codingResult.files.filter(f => f.status === 'error');
    
    return `编码任务完成总结：
- 原始需求: ${requirement}
- 成功生成文件: ${successfulFiles.length} 个
- 失败文件: ${failedFiles.length} 个
- 工作目录: ${codingResult.workspace}
- 建议: ${failedFiles.length > 0 ? '需要检查失败文件并重新生成' : '可以开始测试和部署'}`;
  }

  /**
   * 获取工作流信息
   * @returns {Object} 工作流信息
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      capabilities: [
        '智能需求分析',
        '自动代码生成',
        '语法验证',
        '测试用例生成',
        '部署指南生成'
      ],
      supportedLanguages: ['JavaScript', 'Python', 'JSON', 'Markdown']
    };
  }
}

module.exports = CodingWorkflow;
