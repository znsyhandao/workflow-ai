/**
 * 测试新添加的功能：DeepSeek AI和微信公众号工具
 */
const path = require('path');
const fs = require('fs');

// 加载环境变量
const dotenvPath = path.join(__dirname, 'config', '.env');
if (fs.existsSync(dotenvPath)) {
  const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
  dotenvContent.split('\n').forEach(line => {
    const [key, value] = line.split('=').map(item => item.trim());
    if (key && !key.startsWith('#')) {
      process.env[key] = value;
    }
  });
}

// 测试DeepSeek AI
async function testDeepSeek() {
  console.log('\n=== 测试DeepSeek AI ===');
  try {
    const DeepSeekAgent = require('./src/agents/DeepSeekAgent');
    const agent = new DeepSeekAgent();
    
    const request = '帮我分析一下微信公众号的浏览数据';
    const availableWorkflows = ['数据分析', '文件处理', '微信公众号数据分析'];
    
    const result = await agent.determineWorkflow(request, availableWorkflows);
    console.log('DeepSeek AI意图识别结果:', result);
    
    return true;
  } catch (error) {
    console.error('DeepSeek AI测试失败:', error.message);
    return false;
  }
}

// 测试微信公众号工具
async function testWechatTools() {
  console.log('\n=== 测试微信公众号工具 ===');
  try {
    const WechatTools = require('./src/tools/WechatTools');
    const wechatTools = new WechatTools();
    
    // 测试搜索功能
    console.log('测试文章搜索功能...');
    const searchResult = await wechatTools.searchArticles('AI生命算法研究');
    console.log('文章搜索结果:', searchResult);
    
    return true;
  } catch (error) {
    console.error('微信公众号工具测试失败:', error.message);
    return false;
  }
}

// 测试工作流引擎
async function testWorkflowEngine() {
  console.log('\n=== 测试工作流引擎 ===');
  try {
    const WorkflowEngine = require('./src/core/WorkflowEngine');
    const engine = new WorkflowEngine();
    
    // 测试微信公众号数据分析工作流
    const workflow = engine.loadWorkflow('微信公众号数据分析');
    console.log('微信公众号数据分析工作流:', workflow);
    
    return true;
  } catch (error) {
    console.error('工作流引擎测试失败:', error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试新添加的功能...');
  
  const deepSeekTest = await testDeepSeek();
  const wechatTest = await testWechatTools();
  const workflowTest = await testWorkflowEngine();
  
  console.log('\n=== 测试结果 ===');
  console.log('DeepSeek AI:', deepSeekTest ? '✅ 成功' : '❌ 失败');
  console.log('微信公众号工具:', wechatTest ? '✅ 成功' : '❌ 失败');
  console.log('工作流引擎:', workflowTest ? '✅ 成功' : '❌ 失败');
  
  if (deepSeekTest && wechatTest && workflowTest) {
    console.log('\n🎉 所有测试都通过了！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置和网络连接。');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});