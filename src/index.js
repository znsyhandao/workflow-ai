const readline = require('readline');
const path = require('path');
const WorkflowEngine = require('./core/WorkflowEngine');
const AssistantAgent = require('./agents/AssistantAgent');
const CallbackServer = require('./server/CallbackServer');
const WebServer = require('./server/WebServer');


// 确保dotenv路径正确
const dotenvPath = path.join(__dirname, '..', 'config', '.env');
require('dotenv').config({ path: dotenvPath });

// 检查环境变量是否正确加载
console.log('正在加载环境变量...');
console.log('OPENAI_API_KEY存在:', !!process.env.OPENAI_API_KEY);
console.log('DEEPSEEK_API_KEY存在:', !!process.env.DEEPSEEK_API_KEY);

if (!process.env.OPENAI_API_KEY) {
  console.error('错误: 未找到OPENAI_API_KEY环境变量');
  console.error('请确保在config/.env文件中配置了您的OpenAI API密钥');
  process.exit(1);
}

// 提醒用户配置DeepSeek API密钥，但不强制要求
if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.includes('your_deepseek_api_key_here')) {
  console.warn('警告: 未配置有效的DEEPSEEK_API_KEY');
  console.warn('请在config/.env文件中配置您的DeepSeek API密钥以使用国内AI服务');
  console.warn('当前将使用本地意图识别作为回退方案');
}

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Workflow-AI> '
});

// 初始化工作流引擎和助手
const workflowEngine = new WorkflowEngine();
const assistantAgent = new AssistantAgent(workflowEngine);


// 注册平台连接器
const WechatTools = require('./tools/WechatTools');
const wechatTools = new WechatTools();
workflowEngine.registerConnector('wechat', wechatTools);
workflowEngine.registerTool('wechat', wechatTools);

// 注册GitHub连接器
try {
  const GitHubConnector = require('./connectors/GitHubConnector');
  const githubConnector = new GitHubConnector();
  workflowEngine.registerConnector('github', githubConnector);
} catch (error) {
  console.warn('GitHub连接器未找到，跳过注册');
}

// 注册Google连接器
try {
  const GoogleConnector = require('./connectors/GoogleConnector');
  const googleConnector = new GoogleConnector();
  workflowEngine.registerConnector('google', googleConnector);
} catch (error) {
  console.warn('Google连接器未找到，跳过注册');
}

// 启动授权回调服务器
let callbackServer = null;
try {
  callbackServer = new CallbackServer(workflowEngine.authorizationManager, workflowEngine);
  callbackServer.start()
    .then(() => {
      console.log('授权回调服务器启动成功');
    })
    .catch((error) => {
      console.error('授权回调服务器启动失败:', error);
      console.error('授权功能将无法正常使用');
    });
} catch (error) {
  console.error('创建授权回调服务器失败:', error);
}

// 启动Web服务器
let webServer = null;
try {
  webServer = new WebServer(workflowEngine);
  webServer.start()
    .then(() => {
      console.log('Web服务器启动成功');
    })
    .catch((error) => {
      console.error('Web服务器启动失败:', error);
      console.error('Web界面将无法正常使用');
    });
} catch (error) {
  console.error('创建Web服务器失败:', error);
}

console.log('欢迎使用 Workflow-AI! 这是一个类似 Clawdbot 和 Manus 的工作流AI助手。');
console.log('您可以输入任何任务，AI将自动生成工作流并执行。');
console.log('输入 "exit" 或 "quit" 退出程序。\n');

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();
  
  if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
    rl.close();
    return;
  }
  
  try {
    console.log('\n正在处理您的请求...');
    const result = await assistantAgent.processRequest(input);
    console.log('\nAI响应:', result);
  } catch (error) {
    console.error('\n处理请求时出错:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    console.log();
    rl.prompt();
  }
});

rl.on('close', async () => {
  console.log('\n正在关闭授权回调服务器...');
  if (callbackServer) {
    try {
      await callbackServer.stop();
    } catch (error) {
      console.error('关闭授权回调服务器出错:', error);
    }
  }
  
  console.log('正在关闭Web服务器...');
  if (webServer) {
    try {
      await webServer.stop();
    } catch (error) {
      console.error('关闭Web服务器出错:', error);
    }
  }
  
  console.log('感谢使用 Workflow-AI! 再见!');
  process.exit(0);
});