/**
 * 工作流引擎 - 负责创建和执行任务工作流
 * 基于SOP Engineering概念，能够生成任务SOP并按流程执行复杂任务
 */
const AuthorizationManager = require('./AuthorizationManager');
const QRCodeTool = require('../tools/QRCodeTool');

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.authorizationManager = new AuthorizationManager();
    this.qrCodeTool = new QRCodeTool();
    this.tools = new Map(); // 工具管理器
    this.connectors = new Map(); // 连接器管理器
    // 开发模式配置
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.loadDefaultWorkflows();
  }

  /**
   * 加载默认工作流
   */
  loadDefaultWorkflows() {
    // 示例工作流：数据分析任务
    this.registerWorkflow('数据分析', [
      { id: 'define_goal', name: '定义分析目标', description: '明确数据分析的具体目标和范围' },
      { id: 'collect_data', name: '收集数据', description: '收集相关数据资源' },
      { id: 'clean_data', name: '清洗数据', description: '处理数据中的错误和缺失值' },
      { id: 'analyze_data', name: '分析数据', description: '应用统计方法或机器学习算法进行分析' },
      { id: 'visualize', name: '可视化', description: '将分析结果可视化展示' },
      { id: 'report', name: '生成报告', description: '整理分析结果并生成专业报告' }
    ]);

    // 示例工作流：文件处理任务
    this.registerWorkflow('文件处理', [
      { id: 'select_files', name: '选择文件', description: '选择需要处理的文件' },
      { id: 'read_content', name: '读取内容', description: '读取文件的内容' },
      { id: 'process_content', name: '处理内容', description: '根据需求处理文件内容' },
      { id: 'save_result', name: '保存结果', description: '将处理结果保存到文件' }
    ]);
  
      // 微信公众号数据分析工作流
    this.registerWorkflow('微信公众号数据分析', [
      { id: 'get_account_info', name: '获取公众号信息', description: '获取目标公众号的基本信息' },
      { id: 'get_article_list', name: '获取文章列表', description: '获取公众号发布的文章列表' },
      { id: 'get_read_stats', name: '获取阅读数据', description: '获取文章的阅读量、点赞量等数据' },
      { id: 'analyze_trends', name: '分析数据趋势', description: '分析文章数据的时间趋势和模式' },
      { id: 'generate_report', name: '生成分析报告', description: '根据分析结果生成完整报告' }
    ], [
      { platform: 'wechat', permissions: ['article_data', 'user_statistics'] }
    ]);

    // 示例工作流：GitHub仓库分析 - 需要GitHub授权
    this.registerWorkflow('GitHub仓库分析', [
      { id: 'get_repo_info', name: '获取仓库信息', description: '获取GitHub仓库的基本信息' },
      { id: 'get_contributors', name: '获取贡献者列表', description: '获取仓库的贡献者信息' },
      { id: 'analyze_contributions', name: '分析贡献数据', description: '分析贡献者的贡献情况' },
      { id: 'generate_report', name: '生成报告', description: '生成仓库分析报告' }
    ], [
      { platform: 'github', permissions: ['repo', 'user'] }
    ]);

    // 示例工作流：Google数据分析 - 需要Google授权
    this.registerWorkflow('Google数据分析', [
      { id: 'connect_google', name: '连接Google账户', description: '连接用户的Google账户' },
      { id: 'get_google_data', name: '获取Google数据', description: '从Google获取分析数据' },
      { id: 'analyze_google_data', name: '分析数据', description: '分析Google数据' },
      { id: 'generate_report', name: '生成报告', description: '生成数据分析报告' }
    ], [
      { platform: 'google', permissions: ['profile', 'email'] }
    ]);

    // 智能编码助手工作流
    this.registerWorkflow('智能编码助手', [
      { id: 'analyze_requirement', name: '需求分析', description: '分析用户需求并制定开发计划' },
      { id: 'generate_code', name: '代码生成', description: '根据需求生成或修改代码' },
      { id: 'validate_code', name: '代码验证', description: '验证代码语法和安全性' },
      { id: 'generate_tests', name: '生成测试', description: '生成单元测试用例' },
      { id: 'integration', name: '集成部署', description: '生成部署指南和集成说明' }
    ]);

  }
  /**
   * 注册新工作流
   * @param {string} name 工作流名称
   * @param {Array} steps 工作流步骤数组
   * @param {Array} authorizations 所需授权列表
   */
  registerWorkflow(name, steps, authorizations = []) {
    this.workflows.set(name, {
      steps: steps,
      authorizations: authorizations
    });
  }

  /**
   * 注册平台连接器
   * @param {string} platform 平台名称
   * @param {Object} connector 连接器实例
   */
  registerConnector(platform, connector) {
    this.authorizationManager.registerConnector(platform, connector);
    this.connectors.set(platform, connector);
  }

  /**
   * 注册工具
   * @param {string} name 工具名称
   * @param {Object} tool 工具实例
   */
  registerTool(name, tool) {
    this.tools.set(name, tool);
  }

  /**
   * 加载指定工作流
   * @param {string} name 工作流名称
   * @returns {Object|null} 工作流信息
   */
  loadWorkflow(name) {
    return this.workflows.get(name) || null;
  }

  /**
 * 执行工作流
 * @param {string} workflowName 工作流名称
 * @param {Object} context 执行上下文
 * @returns {Promise<Object>} 执行结果
 */
async executeWorkflow(workflowName, context = {}) {
    console.log(`\n开始执行工作流: ${workflowName}`);
    console.log(`执行上下文: ${JSON.stringify(context)}`);
    
    // 特殊处理智能编码工作流
    if (workflowName === '智能编码助手') {
      return await this._executeCodingWorkflow(context);
    }
    
    const workflow = this.loadWorkflow(workflowName);
    if (!workflow) {
      const error = new Error(`工作流 "${workflowName}" 不存在`);
      console.error('工作流执行错误:', error);
      throw error;
    }

    // 检查工作流所需的授权
    if (workflow.authorizations && workflow.authorizations.length > 0) {
      console.log(`工作流需要 ${workflow.authorizations.length} 项授权`);
      
      // 始终执行授权检查，不区分开发模式和生产模式
      for (const auth of workflow.authorizations) {
        const authStatus = await this.authorizationManager.checkAuthorization(
          auth.platform, 
          auth.permissions
        );
        
        if (authStatus.needAuthorization) {
          // 生成二维码显示授权链接
          if (authStatus.authorizationUrl) {
            await this.qrCodeTool.generateTerminalQRCode(authStatus.authorizationUrl);
          }
          throw new Error(`工作流 ${workflowName} 需要 ${auth.platform} 平台授权:\n${authStatus.message}`);
        }
      }
    }


    // 确保workflow.steps存在（处理旧格式兼容性）
    const steps = workflow.steps || workflow;
    console.log(`工作流步骤数: ${steps.length}`);
    console.log('工作流步骤:', JSON.stringify(steps.map(step => step.name)));

    const result = {
      workflowName,
      steps: [],
      finalResult: null
    };

    try {
      // 按步骤执行工作流
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`\n执行步骤 ${i+1}/${workflow.steps.length}: ${step.name} - ${step.description}`);
        
        let stepResult;
        
        // 根据工作流名称和步骤ID，调用相应的工具或连接器方法
        try {
          switch (workflowName) {
            case '微信公众号数据分析':
              stepResult = await this.executeWechatAnalysisStep(step, context);
              break;
            case 'GitHub仓库分析':
              stepResult = await this.executeGitHubAnalysisStep(step, context);
              break;
            case 'Google数据分析':
              stepResult = await this.executeGoogleAnalysisStep(step, context);
              break;
            default:
              // 默认模拟执行
              stepResult = {
                stepId: step.id,
                stepName: step.name,
                status: 'completed',
                output: `步骤 "${step.name}" 执行成功`,
                timestamp: new Date().toISOString()
              };
          }
        } catch (stepError) {
          console.error(`步骤 ${step.name} 执行出错:`, stepError);
          stepResult = {
            stepId: step.id,
            stepName: step.name,
            status: 'error',
            output: `步骤 "${step.name}" 执行失败: ${stepError.message}`,
            error: stepError.message,
            timestamp: new Date().toISOString()
          };
        }
        
        result.steps.push(stepResult);
        console.log(`步骤 ${i+1} 执行完成:`, JSON.stringify(stepResult));
        
        // 如果步骤执行失败，终止工作流
        if (stepResult.status === 'error') {
          throw new Error(`步骤 "${step.name}" 执行失败: ${stepResult.error}`);
        }
        
        // 将步骤结果添加到上下文
        context[step.id] = stepResult;
        
        // 模拟执行延迟
        await this.delay(500);
      }

      result.finalResult = {
        status: 'success',
        message: `工作流 "${workflowName}" 执行完成`,
        context: context,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('工作流执行过程中发生错误:', error);
      result.finalResult = {
        status: 'error',
        message: error.message,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    console.log('工作流执行结果:', JSON.stringify(result));
    return result;
  }

  /**
   * 执行智能编码工作流
   * @param {Object} context 执行上下文
   * @returns {Promise<Object>} 执行结果
   */
  async _executeCodingWorkflow(context) {
    try {
      const CodingWorkflow = require('../workflows/CodingWorkflow');
      const codingWorkflow = new CodingWorkflow();
      
      console.log('开始执行真正的智能编码任务...');
      const result = await codingWorkflow.execute(context.userRequest, context);
      
      // 返回智能编码工作流的专用格式
      return {
        workflowName: '智能编码助手',
        status: 'success',
        message: '智能编码任务执行完成',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('智能编码工作流执行失败:', error);
      return {
        workflowName: '智能编码助手',
        status: 'error',
        message: `智能编码任务执行失败: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取所有可用工作流
   * @returns {Array} 工作流列表
   */
  getAvailableWorkflows() {
    return Array.from(this.workflows.keys());
  }

  /**
   * 执行微信公众号数据分析步骤
   * @param {Object} step 步骤信息
   * @param {Object} context 执行上下文
   * @returns {Promise<Object>} 步骤执行结果
   */
  async executeWechatAnalysisStep(step, context) {
    const wechatTool = this.tools.get('wechat');
    if (!wechatTool) {
      throw new Error('微信工具未注册');
    }

    const stepResult = {
      stepId: step.id,
      stepName: step.name,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    try {
      let output;
      switch (step.id) {
        case 'get_account_info':
          // 获取公众号信息
          output = await wechatTool.getAccountInfo();
          stepResult.output = `成功获取公众号信息: ${JSON.stringify(output)}`;
          stepResult.data = output;
          break;
        case 'get_article_list':
          // 获取文章列表
          output = await wechatTool.getArticleList();
          stepResult.output = `成功获取文章列表，共 ${output.total_count} 篇文章`;
          stepResult.data = output;
          break;
        case 'get_read_stats':
          // 获取阅读数据
          const articleId = context.get_article_list?.data?.item?.[0]?.content?.news_item?.[0]?.media_id || 'mock_article_id';
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const endDate = new Date().toISOString().split('T')[0];
          output = await wechatTool.getArticleStatistics(articleId, startDate, endDate);
          stepResult.output = `成功获取文章阅读数据: ${JSON.stringify(output)}`;
          stepResult.data = output;
          break;
        case 'analyze_trends':
          // 分析数据趋势
          const articleStats = context.get_read_stats?.data;
          if (articleStats) {
            // 简单的趋势分析
            const totalReads = articleStats.list.reduce((sum, item) => sum + item.int_page_read_count, 0);
            const totalShares = articleStats.list.reduce((sum, item) => sum + item.share_count, 0);
            output = {
              totalReads,
              totalShares,
              avgReads: totalReads / articleStats.list.length,
              avgShares: totalShares / articleStats.list.length
            };
            stepResult.output = `成功分析数据趋势: 总阅读量 ${totalReads}，总分享量 ${totalShares}`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法分析数据趋势: 缺少文章统计数据';
          }
          break;
        case 'generate_report':
          // 生成分析报告
          const trendAnalysis = context.analyze_trends?.data;
          if (trendAnalysis) {
            output = {
              title: '微信公众号数据分析报告',
              date: new Date().toISOString(),
              summary: `总阅读量: ${trendAnalysis.totalReads}, 总分享量: ${trendAnalysis.totalShares}, 平均阅读量: ${Math.round(trendAnalysis.avgReads)}, 平均分享量: ${Math.round(trendAnalysis.avgShares)}`,
              detailedData: context
            };
            stepResult.output = `成功生成分析报告`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法生成分析报告: 缺少趋势分析数据';
          }
          break;
        default:
          stepResult.output = `步骤 "${step.name}" 执行成功`;
      }
    } catch (error) {
      stepResult.status = 'error';
      stepResult.output = `步骤 "${step.name}" 执行失败: ${error.message}`;
      stepResult.error = error.message;
    }

    return stepResult;
  }

  /**
   * 执行GitHub仓库分析步骤
   * @param {Object} step 步骤信息
   * @param {Object} context 执行上下文
   * @returns {Promise<Object>} 步骤执行结果
   */
  async executeGitHubAnalysisStep(step, context) {
    const githubConnector = this.connectors.get('github');
    if (!githubConnector) {
      throw new Error('GitHub连接器未注册');
    }

    // 获取凭证
    const credentials = await this.authorizationManager.getCredentials('github');
    if (!credentials) {
      throw new Error('缺少GitHub授权凭证');
    }

    const stepResult = {
      stepId: step.id,
      stepName: step.name,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    try {
      let output;
      // 假设分析目标仓库为用户的第一个仓库
      const owner = 'sample-owner'; // 应该从用户信息中获取
      const repo = 'sample-repo';   // 应该从用户仓库列表中获取

      switch (step.id) {
        case 'get_repo_info':
          // 获取仓库信息
          output = await githubConnector.getRepositoryInfo(credentials, owner, repo);
          stepResult.output = `成功获取仓库信息: ${output.name}`;
          stepResult.data = output;
          break;
        case 'get_contributors':
          // 获取贡献者列表
          output = await githubConnector.getContributors(credentials, owner, repo);
          stepResult.output = `成功获取贡献者列表，共 ${output.length} 位贡献者`;
          stepResult.data = output;
          break;
        case 'analyze_contributions':
          // 分析贡献数据
          const contributors = context.get_contributors?.data;
          if (contributors) {
            // 简单的贡献分析
            const totalContributions = contributors.reduce((sum, contributor) => sum + contributor.contributions, 0);
            output = {
              totalContributors: contributors.length,
              totalContributions,
              topContributor: contributors[0]?.login || 'Unknown',
              avgContributionsPerContributor: Math.round(totalContributions / contributors.length)
            };
            stepResult.output = `成功分析贡献数据: 总贡献数 ${totalContributions}，主要贡献者 ${output.topContributor}`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法分析贡献数据: 缺少贡献者信息';
          }
          break;
        case 'generate_report':
          // 生成分析报告
          const repoInfo = context.get_repo_info?.data;
          const contributionAnalysis = context.analyze_contributions?.data;
          if (repoInfo && contributionAnalysis) {
            output = {
              title: 'GitHub仓库分析报告',
              date: new Date().toISOString(),
              repoName: repoInfo.name,
              summary: `仓库 ${repoInfo.name} 共有 ${contributionAnalysis.totalContributors} 位贡献者，总贡献数 ${contributionAnalysis.totalContributions}，主要贡献者 ${contributionAnalysis.topContributor}`,
              detailedData: context
            };
            stepResult.output = `成功生成分析报告`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法生成分析报告: 缺少仓库或贡献者数据';
          }
          break;
        default:
          stepResult.output = `步骤 "${step.name}" 执行成功`;
      }
    } catch (error) {
      stepResult.status = 'error';
      stepResult.output = `步骤 "${step.name}" 执行失败: ${error.message}`;
      stepResult.error = error.message;
    }

    return stepResult;
  }

  /**
   * 执行Google数据分析步骤
   * @param {Object} step 步骤信息
   * @param {Object} context 执行上下文
   * @returns {Promise<Object>} 步骤执行结果
   */
  async executeGoogleAnalysisStep(step, context) {
    const googleConnector = this.connectors.get('google');
    if (!googleConnector) {
      throw new Error('Google连接器未注册');
    }

    // 获取凭证
    const credentials = await this.authorizationManager.getCredentials('google');
    if (!credentials) {
      throw new Error('缺少Google授权凭证');
    }

    const stepResult = {
      stepId: step.id,
      stepName: step.name,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    try {
      let output;

      switch (step.id) {
        case 'connect_google':
          // 连接Google账户（验证凭证有效性）
          const isAuthorized = await googleConnector.checkPermissions(credentials, ['profile', 'email']);
          if (isAuthorized) {
            const userInfo = await googleConnector.getUserInfo(credentials);
            output = {
              connected: true,
              user: userInfo
            };
            stepResult.output = `成功连接到Google账户: ${userInfo.name}`;
            stepResult.data = output;
          } else {
            throw new Error('Google账户连接失败');
          }
          break;
        case 'get_google_data':
          // 获取Google数据（这里可以扩展到具体的Google服务数据）
          const userInfo = await googleConnector.getUserInfo(credentials);
          output = {
            userData: userInfo,
            // 在实际应用中，这里可以获取Google Analytics、Google Sheets等数据
            analyticsData: {
              // 模拟Analytics数据
              totalUsers: 1000,
              activeUsers: 500,
              pageViews: 2000
            }
          };
          stepResult.output = `成功获取Google数据`;
          stepResult.data = output;
          break;
        case 'analyze_google_data':
          // 分析Google数据
          const googleData = context.get_google_data?.data;
          if (googleData) {
            const analytics = googleData.analyticsData;
            output = {
              analysis: `用户 ${googleData.userData.name} 的Google Analytics数据显示，总用户数 ${analytics.totalUsers}，活跃用户数 ${analytics.activeUsers}，页面浏览量 ${analytics.pageViews}`,
              engagementRate: analytics.activeUsers / analytics.totalUsers
            };
            stepResult.output = `成功分析Google数据: 活跃度 ${Math.round(output.engagementRate * 100)}%`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法分析Google数据: 缺少数据';
          }
          break;
        case 'generate_report':
          // 生成分析报告
          const reportGoogleData = context.get_google_data?.data;
          const analysis = context.analyze_google_data?.data;
          if (reportGoogleData && analysis) {
            output = {
              title: 'Google数据分析报告',
              date: new Date().toISOString(),
              user: reportGoogleData.userData.name,
              summary: `总用户数: ${reportGoogleData.analyticsData.totalUsers}, 活跃用户数: ${reportGoogleData.analyticsData.activeUsers}, 页面浏览量: ${reportGoogleData.analyticsData.pageViews}, 活跃度: ${Math.round(analysis.engagementRate * 100)}%`,
              detailedData: context
            };
            stepResult.output = `成功生成分析报告`;
            stepResult.data = output;
          } else {
            stepResult.output = '无法生成分析报告: 缺少数据或分析结果';
          }
          break;
        default:
          stepResult.output = `步骤 "${step.name}" 执行成功`;
      }
    } catch (error) {
      stepResult.status = 'error';
      stepResult.output = `步骤 "${step.name}" 执行失败: ${error.message}`;
      stepResult.error = error.message;
    }

    return stepResult;
  }

  /**
   * 辅助函数：延迟执行
   * @param {number} ms 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取所有可用工作流
   * @returns {Array} 工作流列表
   */
  getAvailableWorkflows() {
    const workflows = Array.from(this.workflows.keys());
    console.log('当前可用工作流:', workflows);
    return workflows;
  }
}

module.exports = WorkflowEngine;