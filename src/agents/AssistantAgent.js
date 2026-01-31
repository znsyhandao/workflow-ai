/**
 * 助手代理 - 负责理解用户请求并协调工作流执行
 */
const { OpenAI } = require('openai');
const DeepSeekAgent = require('./DeepSeekAgent');
const HuaweiModelArtsDeepSeekAgent = require('./HuaweiModelArtsDeepSeekAgent');
const WechatTools = require('../tools/WechatTools');
const CodingAgent = require('./CodingAgent');
const CodingWorkflow = require('../workflows/CodingWorkflow');


class AssistantAgent {
  constructor(workflowEngine) {
    this.workflowEngine = workflowEngine;
    
    // 显式获取环境变量
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    
    console.log('AssistantAgent构造函数 - OPENAI_API_KEY存在:', !!openaiApiKey);
    console.log('AssistantAgent构造函数 - DEEPSEEK_API_KEY存在:', !!deepseekApiKey);
    
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 60000, // 全局API超时设置
      maxRetries: 0 // 让我们的自定义重试机制处理重试
    });
    
    this.deepSeekAgent = new DeepSeekAgent();
    this.huaweiModelArtsDeepSeekAgent = new HuaweiModelArtsDeepSeekAgent();
    this.wechatTools = new WechatTools();
    this.codingAgent = new CodingAgent();
    this.codingWorkflow = new CodingWorkflow();
    this.systemPrompt = this._getSystemPrompt();
  }

  /**
   * 处理用户请求
   * @param {string} request 用户请求
   * @returns {Promise<string>} 处理结果
   */
  async processRequest(request) {
    try {
      // 理解用户请求并确定需要执行的工作流
      const workflowSelection = await this._determineWorkflow(request);
      
      if (!workflowSelection.workflow) {
        return '抱歉，我无法理解您的请求或没有匹配的工作流。\n请尝试更明确地描述您的需求。';
      }

      console.log(`\n已选择工作流: ${workflowSelection.workflow}`);
      console.log(`理解的用户意图: ${workflowSelection.intent}`);
      
      // 执行工作流
      const executionResult = await this.workflowEngine.executeWorkflow(
        workflowSelection.workflow,
        { userRequest: request, intent: workflowSelection.intent }
      );
      
      // 生成最终响应
      return this._generateResponse(executionResult);
    } catch (error) {
      console.error('处理请求时出错:', error);
      return `处理请求时发生错误: ${error.message}`;
    }
  }

  /**
   * 确定用户请求需要执行的工作流
   * @param {string} request 用户请求
   * @returns {Promise<Object>} 包含工作流和意图的对象
   */
  /**
   * 安全地调用OpenAI API，带有重试机制
   * @param {Object} options API调用选项
   * @param {number} maxRetries 最大重试次数
   * @param {number} timeout 超时时间（毫秒）
   * @returns {Promise<Object>} API响应
   */
  async _callOpenAIAPI(options, maxRetries = 3, timeout = 60000) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`调用OpenAI API (尝试 ${retries + 1}/${maxRetries})...`);
        
        // 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`API调用超时 (${timeout}ms)`)), timeout);
        });
        
        const completion = await Promise.race([
          this.openai.chat.completions.create(options),
          timeoutPromise
        ]);
        
        console.log('OpenAI API调用成功');
        return completion;
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`API调用失败，已达到最大重试次数 ${maxRetries}`);
          throw error;
        }
        
        console.error(`API调用失败，正在重试 (${retries}/${maxRetries})...`);
        console.error('错误原因:', error.message);
        
        // 指数退避
        const delay = Math.pow(2, retries) * 1000;
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * 检查是否是编码请求
   * @param {string} request 用户请求
   * @returns {boolean} 是否是编码请求
   */
  _isCodingRequest(request) {
    const codingKeywords = [
      '写代码', '生成代码', '创建函数', '编写程序', '开发功能',
      '修改代码', '重构', '优化代码', '添加功能', '实现功能',
      'code', 'program', 'function', 'script', 'module',
      'generate code', 'write code', 'create function'
    ];
    
    const lowerRequest = request.toLowerCase();
    return codingKeywords.some(keyword => lowerRequest.includes(keyword));
  }

  /**
   * 本地意图识别 - 作为API调用失败时的备选方案
   * @param {string} request 用户请求
   * @param {Array} availableWorkflows 可用工作流列表
   * @returns {Object} 工作流选择结果
   */
_localIntentRecognition(request, availableWorkflows) {
  console.log('使用本地意图识别机制...');
  
  const lowerRequest = request.toLowerCase();
  
  // 微信公众号数据分析专门识别
  if (lowerRequest.includes('微信公众号') || lowerRequest.includes('公众号') || 
      lowerRequest.includes('浏览数据') || lowerRequest.includes('阅读数据')) {
    return {
      workflow: '微信公众号数据分析',
      intent: '分析微信公众号文章的浏览和阅读数据'
    };
  }
  
  // 编码相关识别（优先级最高）
  if (this._isCodingRequest(request)) {
    return {
      workflow: '智能编码助手',
      intent: '用户需求涉及代码生成或修改'
    };
  }
  
  // 简单的关键词匹配
  if (lowerRequest.includes('分析') || lowerRequest.includes('统计') || lowerRequest.includes('数据')) {
    return {
      workflow: '数据分析',
      intent: '分析数据并生成报告'
    };
  }
  
  if (lowerRequest.includes('文件') || lowerRequest.includes('读取') || lowerRequest.includes('写入') || lowerRequest.includes('处理')) {
    return {
      workflow: '文件处理',
      intent: '处理文件内容'
    };
  }
  
  // 默认返回
  return {
    workflow: null,
    intent: '无法理解的请求'
  };
}


  async _determineWorkflow(request) {
    const availableWorkflows = this.workflowEngine.getAvailableWorkflows();
    console.log('可用工作流:', availableWorkflows);
    
    // 强制检查编码请求（优先级最高）
    const lowerRequest = request.toLowerCase();
    const codingKeywords = [
      '写代码', '生成代码', '创建函数', '编写程序', '开发功能',
      '修改代码', '重构', '优化代码', '添加功能', '实现功能',
      '工具函数', '处理json', 'json工具', '数据处理', '数据工具',
      'code', 'program', 'function', 'script', 'module', 'json',
      'generate code', 'write code', 'create function', 'tool function',
      'json tool', 'data processing', 'utility function'
    ];
    
    const isCodingRequest = codingKeywords.some(keyword => lowerRequest.includes(keyword));
    
    if (isCodingRequest) {
      console.log('强制检测到编码需求，使用智能编码工作流');
      console.log('匹配的关键词:', codingKeywords.filter(keyword => lowerRequest.includes(keyword)));
      return {
        workflow: '智能编码助手',
        intent: '用户需求涉及代码生成或修改'
      };
    }
    
    try {
      // 确保可用工作流包含智能编码助手
      const allWorkflows = [...availableWorkflows, '智能编码助手'];
      
      // 尝试使用OpenAI API进行意图识别
      const prompt = `
用户请求: ${request}
可用工作流: ${allWorkflows.join(', ')}

特别说明：如果用户请求涉及代码生成、函数创建、工具开发等编码相关任务，请选择"智能编码助手"工作流。

请严格按照以下要求执行：
1. 分析用户请求
2. 从可用工作流中选择最匹配的一个
3. 清晰描述用户的具体意图
4. 仅返回JSON格式，不包含任何额外文本
5. JSON必须包含workflow和intent两个字段
6. 如果没有匹配的工作流，workflow字段设置为null

示例输出：
{"workflow":"数据分析","intent":"分析销售数据并生成报告"}

现在请输出JSON：
      `;
      
      const apiOptions = {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      };
      
      // 使用带重试机制的API调用
      const completion = await this._callOpenAIAPI(apiOptions, 3, 60000);

      console.log('OpenAI API响应:', JSON.stringify(completion, null, 2));
      
      // 检查响应结构
      if (!completion || !completion.choices || completion.choices.length === 0) {
        throw new Error('API响应结构错误：缺少choices字段');
      }
      
      const message = completion.choices[0].message;
      if (!message || !message.content) {
        throw new Error('API响应结构错误：缺少message.content字段');
      }
      
      const content = message.content.trim();
      console.log('AI返回的内容:', content);
      
      // 尝试解析JSON
      let result;
      try {
        result = JSON.parse(content);
        console.log('解析后的工作流选择:', result);
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError);
        
        // 尝试提取可能的JSON部分
        try {
          const jsonMatch = content.match(/\{[^}]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
            console.log('提取并解析后的JSON:', result);
          } else {
            throw new Error('无法从响应中提取JSON');
          }
        } catch (extractError) {
          console.error('JSON提取错误:', extractError);
          throw new Error('AI返回的内容不是有效的JSON格式');
        }
      }
      
      // 验证结果结构
      if (!result.workflow && result.workflow !== null) {
        throw new Error('返回的JSON缺少workflow字段');
      }
      
      if (!result.intent) {
        result.intent = '未明确的意图';
      }
      
      return result;
    } catch (error) {
      console.error('OpenAI API意图识别失败:', error);
      
      try {
        // 回退到DeepSeek AI
        console.log('回退到DeepSeek AI...');
        return await this.deepSeekAgent.determineWorkflow(request, availableWorkflows);
      } catch (deepSeekError) {
        console.error('DeepSeek AI意图识别失败:', deepSeekError);
        
        // 尝试华为ModelArts DeepSeek AI
        try {
          console.log('回退到华为ModelArts DeepSeek AI...');
          return await this.huaweiModelArtsDeepSeekAgent.determineWorkflow(request, availableWorkflows);
        } catch (huaweiError) {
          console.error('华为ModelArts DeepSeek AI意图识别失败:', huaweiError);
          
          // 最后回退到本地意图识别
          console.log('回退到本地意图识别...');
          return this._localIntentRecognition(request, availableWorkflows);
        }
      }
    } 
  }

  /**
   * 生成响应消息
   * @param {Object} executionResult 工作流执行结果
   * @returns {string} 格式化的响应
   */
  _generateResponse(executionResult) {
    // 检查是否是智能编码工作流的特殊格式
    if (executionResult.workflowName === '智能编码助手') {
      return this._generateCodingResponse(executionResult);
    }
    
    // 普通工作流格式处理
    if (!executionResult.finalResult) {
      return `工作流 "${executionResult.workflowName}" 执行完成，但未返回结果`;
    }
    
    if (executionResult.finalResult.status === 'error') {
      return `执行工作流时发生错误: ${executionResult.finalResult.message}`;
    }

    let response = `工作流 "${executionResult.workflowName}" 执行完成!\n\n执行步骤:`;
    
    executionResult.steps.forEach((step, index) => {
      response += `\n${index + 1}. ${step.stepName}: ${step.status}`;
      if (step.output) {
        response += ` - ${step.output}`;
      }
    });
    
    return response;
  }

  /**
   * 生成智能编码工作流的响应消息
   * @param {Object} executionResult 工作流执行结果
   * @returns {string} 格式化的响应
   */
  _generateCodingResponse(executionResult) {
    // 智能编码工作流可能有不同的返回格式
    // 情况1：标准工作流格式（包含finalResult）
    if (executionResult.finalResult) {
      if (executionResult.finalResult.status === 'error') {
        return `智能编码任务执行失败: ${executionResult.finalResult.message}`;
      }
      
      let response = `智能编码任务执行完成!\n\n${executionResult.finalResult.message}`;
      
      // 如果有数据结果，显示详细信息
      if (executionResult.finalResult.data) {
        const data = executionResult.finalResult.data;
        if (data.success) {
          response += `\n\n任务详情：`;
          if (data.stages) {
            response += `\n- 需求分析: ${data.stages.analysis ? '完成' : '失败'}`;
            response += `\n- 代码生成: ${data.stages.coding ? '完成' : '失败'}`;
            response += `\n- 测试验证: ${data.stages.testing ? '完成' : '失败'}`;
            response += `\n- 集成部署: ${data.stages.integration ? '完成' : '失败'}`;
          }
          if (data.summary) {
            response += `\n\n任务总结: ${data.summary}`;
          }
        } else {
          response += `\n\n错误信息: ${data.error}`;
          if (data.recommendation) {
            response += `\n建议: ${data.recommendation}`;
          }
        }
      }
      
      return response;
    }
    
    // 情况2：直接返回智能编码工作流结果
    if (executionResult.status === 'success') {
      let response = `智能编码任务执行完成!\n\n${executionResult.message}`;
      
      if (executionResult.data) {
        const data = executionResult.data;
        if (data.success) {
          response += `\n\n任务详情：`;
          if (data.stages) {
            response += `\n- 需求分析: ${data.stages.analysis ? '完成' : '失败'}`;
            response += `\n- 代码生成: ${data.stages.coding ? '完成' : '失败'}`;
            response += `\n- 测试验证: ${data.stages.testing ? '完成' : '失败'}`;
            response += `\n- 集成部署: ${data.stages.integration ? '完成' : '失败'}`;
          }
          if (data.summary) {
            response += `\n\n任务总结: ${data.summary}`;
          }
          
          // 显示生成的文件列表
          if (data.generatedFiles && data.generatedFiles.length > 0) {
            response += `\n\n生成的文件：`;
            data.generatedFiles.forEach(file => {
              response += `\n- ${file}`;
            });
          }
        } else {
          response += `\n\n错误信息: ${data.error}`;
          if (data.recommendation) {
            response += `\n建议: ${data.recommendation}`;
          }
        }
      }
      
      return response;
    }
    
    // 情况3：其他未知格式
    return `智能编码任务执行完成，但返回格式未知: ${JSON.stringify(executionResult, null, 2)}`;
  }

  /**
   * 获取系统提示词
   * @returns {string} 系统提示词
   */
  _getSystemPrompt() {
    return `你是一个工作流AI助手，负责理解用户请求并选择合适的工作流执行。

你的任务是:
1. 分析用户的自然语言请求
2. 从可用工作流中选择最匹配的一个
3. 清晰描述用户的具体意图
4. 严格按照要求的JSON格式输出结果

可用工作流：
- 微信公众号数据分析：分析微信公众号的浏览数据、用户行为等
- 数据分析：通用的数据分析任务
- 文件处理：文件读取、处理和保存
- 智能编码助手：基于AI的智能代码生成和修改

编码能力：
- 智能需求分析
- 自动代码生成（支持JavaScript、Python、JSON、Markdown）
- 语法验证和测试用例生成
- 部署指南生成`;
  }
}

module.exports = AssistantAgent;