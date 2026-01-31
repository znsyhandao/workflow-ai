/**
 * 编码代理 - 具备代码生成和修改能力的智能Agent
 * 核心能力：用户需求 → 分析规划 → 生成代码 → 安全验证 → 集成部署
 */
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const https = require('https');

const execAsync = util.promisify(exec);

class CodingAgent {
  constructor(aiProvider = 'huawei_modelarts') {
    this.aiProvider = aiProvider;
    this.apiKey = process.env.MAAS_API_KEY;
    this.baseUrl = 'https://api.modelarts-maas.com/v1';
    this.model = 'DeepSeek-V3';
    
    // 工作目录
    this.workspaceDir = path.join(__dirname, '..', '..', 'coding_workspace');
    
    // 代码规范配置
    this.codeStyle = {
      indent: 2,
      quote: 'single',
      semicolon: true
    };
    
    // 安全限制
    this.securityRules = {
      forbiddenKeywords: [
        'eval', 'Function', 'exec', 'spawn', 'fork', 'require',
        'fs.writeFileSync', 'fs.unlinkSync', 'rm -rf', 'del',
        'process.exit', 'child_process'
      ],
      allowedExtensions: ['.js', '.py', '.json', '.md', '.txt'],
      maxFileSize: 1024 * 1024 // 1MB
    };
  }

  /**
   * 分析用户需求并生成开发计划
   * @param {string} requirement 用户需求描述
   * @returns {Promise<Object>} 开发计划
   */
  async analyzeRequirement(requirement) {
    const prompt = `你是一个专业的软件开发AI助手。请分析以下用户需求，并生成详细的开发计划：

用户需求：${requirement}

请按照以下格式返回JSON：
{
  "task_description": "任务描述",
  "complexity": "简单/中等/复杂",
  "estimated_time": "预估开发时间",
  "required_files": ["需要创建或修改的文件列表"],
  "dependencies": ["需要的依赖包"],
  "test_cases": ["测试用例描述"],
  "risks": ["潜在风险"],
  "steps": ["开发步骤"]
}`;

    const response = await this.callAI(prompt);
    
    // 处理可能的JSON代码块格式
    let jsonContent = response.trim();
    
    // 移除JSON代码块标记
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.substring(7); // 移除 ```json
    }
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.substring(3); // 移除 ```
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.substring(0, jsonContent.length - 3); // 移除结尾的```
    }
    
    return JSON.parse(jsonContent.trim());
  }

  /**
   * 生成代码文件
   * @param {string} filePath 文件路径
   * @param {string} requirement 需求描述
   * @param {Object} context 上下文信息
   * @returns {Promise<string>} 生成的代码
   */
  async generateCode(filePath, requirement, context = {}) {
    const fileExtension = path.extname(filePath);
    const fileName = path.basename(filePath);
    
    const prompt = `你是一个专业的${this.getLanguageName(fileExtension)}程序员。请根据以下需求生成代码：

文件：${fileName}
需求：${requirement}
上下文：${JSON.stringify(context, null, 2)}

代码要求：
1. 遵循最佳实践和代码规范
2. 包含必要的注释
3. 考虑错误处理
4. 保持代码简洁易读

请只返回代码，不要包含其他说明：`;

    const code = await this.callAI(prompt);
    
    // 安全检查
    await this.securityCheck(code, filePath);
    
    return code;
  }

  /**
   * 修改现有代码
   * @param {string} filePath 文件路径
   * @param {string} requirement 修改需求
   * @param {string} existingCode 现有代码
   * @returns {Promise<string>} 修改后的代码
   */
  async modifyCode(filePath, requirement, existingCode) {
    const prompt = `请修改以下代码以满足新的需求：

文件：${filePath}
现有代码：
\`\`\`
${existingCode}
\`\`\`

修改需求：${requirement}

要求：
1. 保持原有代码结构和风格
2. 最小化改动，只修改必要的部分
3. 确保向后兼容性
4. 添加必要的注释说明修改原因

请返回完整的修改后代码：`;

    const modifiedCode = await this.callAI(prompt);
    
    // 安全检查
    await this.securityCheck(modifiedCode, filePath);
    
    return modifiedCode;
  }

  /**
   * 调用AI服务
   * @param {string} prompt 提示词
   * @returns {Promise<string>} AI响应
   */
  async callAI(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的软件开发AI助手，专注于生成高质量、安全的代码。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false // 忽略SSL证书验证
          })
        }
      );

      if (response.status === 200) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error(`AI服务调用失败: ${response.statusText}`);
      }
    } catch (error) {
      console.error('AI调用错误:', error);
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }

  /**
   * 代码安全检查
   * @param {string} code 代码内容
   * @param {string} filePath 文件路径
   */
  async securityCheck(code, filePath) {
    // 检查文件扩展名
    const ext = path.extname(filePath);
    if (!this.securityRules.allowedExtensions.includes(ext)) {
      throw new Error(`不允许的文件类型: ${ext}`);
    }

    // 检查文件大小
    if (code.length > this.securityRules.maxFileSize) {
      throw new Error('文件大小超过限制');
    }

    // 检查危险关键词
    for (const keyword of this.securityRules.forbiddenKeywords) {
      if (code.includes(keyword)) {
        throw new Error(`检测到危险操作: ${keyword}`);
      }
    }

    // 检查代码语法（基础验证）
    await this.validateSyntax(code, ext);
  }

  /**
   * 验证代码语法
   * @param {string} code 代码
   * @param {string} extension 文件扩展名
   */
  async validateSyntax(code, extension) {
    try {
      if (extension === '.js') {
        // JavaScript语法检查
        const { parse } = require('acorn');
        parse(code, { ecmaVersion: 2020 });
      } else if (extension === '.json') {
        // JSON语法检查
        JSON.parse(code);
      }
      // 其他语言可以继续扩展
    } catch (error) {
      throw new Error(`语法检查失败: ${error.message}`);
    }
  }

  /**
   * 获取编程语言名称
   * @param {string} extension 文件扩展名
   * @returns {string} 语言名称
   */
  getLanguageName(extension) {
    const languageMap = {
      '.js': 'JavaScript',
      '.py': 'Python',
      '.json': 'JSON',
      '.md': 'Markdown',
      '.txt': 'Text'
    };
    return languageMap[extension] || 'Unknown';
  }

  /**
   * 在沙箱中执行代码
   * @param {string} code 代码
   * @param {string} language 语言
   * @returns {Promise<Object>} 执行结果
   */
  async executeInSandbox(code, language = 'javascript') {
    // 创建临时文件
    const tempFile = path.join(this.workspaceDir, `temp_${Date.now()}.${this.getFileExtension(language)}`);
    
    try {
      await fs.writeFile(tempFile, code, 'utf8');
      
      let command;
      switch (language) {
        case 'javascript':
          command = `node ${tempFile}`;
          break;
        case 'python':
          command = `python ${tempFile}`;
          break;
        default:
          throw new Error(`不支持的语言: ${language}`);
      }

      const { stdout, stderr } = await execAsync(command, { 
        timeout: 10000,
        cwd: this.workspaceDir 
      });

      return {
        success: true,
        stdout: stdout,
        stderr: stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: '',
        stderr: error.stderr || ''
      };
    } finally {
      // 清理临时文件
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError);
      }
    }
  }

  /**
   * 获取文件扩展名
   * @param {string} language 语言
   * @returns {string} 扩展名
   */
  getFileExtension(language) {
    const extensionMap = {
      'javascript': 'js',
      'python': 'py'
    };
    return extensionMap[language] || 'txt';
  }

  /**
   * 生成测试用例
   * @param {string} code 代码
   * @param {string} requirement 需求
   * @returns {Promise<string>} 测试代码
   */
  async generateTests(code, requirement) {
    const prompt = `请为以下代码生成单元测试：

需求：${requirement}

代码：
\`\`\`
${code}
\`\`\`

要求：
1. 覆盖主要功能
2. 包含边界情况
3. 使用适当的测试框架
4. 测试代码要简洁有效

请返回测试代码：`;

    return await this.callAI(prompt);
  }

  /**
   * 处理完整的编码任务
   * @param {string} requirement 用户需求
   * @returns {Promise<Object>} 执行结果
   */
  async processCodingTask(requirement) {
    try {
      console.log('开始处理编码任务...');
      
      // 1. 分析需求
      const plan = await this.analyzeRequirement(requirement);
      console.log('需求分析完成:', plan);
      
      // 2. 生成代码
      const results = [];
      for (const file of plan.required_files) {
        console.log(`生成文件: ${file}`);
        
        let code;
        try {
          // 检查文件是否已存在
          const fullPath = path.join(this.workspaceDir, file);
          const exists = await this.fileExists(fullPath);
          
          if (exists) {
            // 修改现有文件
            const existingCode = await fs.readFile(fullPath, 'utf8');
            code = await this.modifyCode(file, requirement, existingCode);
          } else {
            // 创建新文件
            code = await this.generateCode(file, requirement, { project: 'workflow-ai' });
          }
          
          // 保存文件
          await this.ensureDirectoryExists(path.dirname(fullPath));
          await fs.writeFile(fullPath, code, 'utf8');
          
          results.push({
            file: file,
            status: 'success',
            action: exists ? 'modified' : 'created'
          });
          
        } catch (error) {
          results.push({
            file: file,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        plan: plan,
        results: results,
        workspace: this.workspaceDir
      };
      
    } catch (error) {
      console.error('编码任务处理失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath 文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 确保目录存在
   * @param {string} dirPath 目录路径
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

module.exports = CodingAgent;