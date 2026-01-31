/**
 * DeepSeek AI代理 - 作为OpenAI的替代方案，使用国内的AI服务
 */
// 使用 axios 替代 node-fetch 来避免 ESM/CommonJS 兼容性问题
const axios = require('axios');

class DeepSeekAgent {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.systemPrompt = this._getSystemPrompt();
    
    // 检查API密钥是否配置
    if (!this.apiKey) {
      console.warn('警告: DEEPSEEK_API_KEY环境变量未设置');
    }
  }

  /**
   * 处理用户请求
   * @param {string} request 用户请求
   * @param {Array} availableWorkflows 可用工作流列表
   * @returns {Promise<Object>} 工作流选择结果
   */
  async determineWorkflow(request, availableWorkflows) {
    try {
      // 检查API密钥
      if (!this.apiKey) {
        throw new Error('DeepSeek API密钥未配置');
      }
      
      console.log('正在调用DeepSeek API...');
      
      // 创建提示词
      const prompt = `
用户请求: ${request}
可用工作流: ${availableWorkflows.join(', ')}

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
      
      console.log('发送给DeepSeek的提示词:', prompt);
      
      // 使用 axios 调用 DeepSeek API
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 30000
      });
      
      console.log('DeepSeek API响应状态码:', response.status);
      if (response.status !== 200) {
        throw new Error(`DeepSeek API错误: ${response.status} ${response.data?.error?.message || '未知错误'}`);
      }
      
      const data = response.data;
      console.log('DeepSeek API响应:', JSON.stringify(data, null, 2));
      
      // 检查响应结构
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API响应结构错误：缺少choices字段');
      }
      
      const message = data.choices[0].message;
      if (!message || !message.content) {
        throw new Error('API响应结构错误：缺少message.content字段');
      }
      
      const content = message.content.trim();
      console.log('DeepSeek返回的内容:', content);
      
      // 尝试解析JSON
      let result;
      try {
        result = JSON.parse(content);
        console.log('解析后的工作流选择:', result);
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError);
        throw new Error('AI返回的内容不是有效的JSON格式');
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
      console.error('DeepSeek AI意图识别出错:', error);
      throw error;
    }
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
4. 严格按照要求的JSON格式输出结果`;
  }
}

module.exports = DeepSeekAgent;
