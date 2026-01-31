const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// 加载环境变量
const dotenvPath = path.join(__dirname, 'config', '.env');
const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
dotenvContent.split('\n').forEach(line => {
  const [key, value] = line.split('=').map(item => item.trim());
  if (key && !key.startsWith('#')) {
    process.env[key] = value;
  }
});

// 测试DNS解析
const dns = require('dns');
console.log('测试DNS解析...');
dns.resolve('api.openai.com', (err, addresses) => {
  if (err) {
    console.error('DNS解析失败:', err.message);
  } else {
    console.log('DNS解析成功:', addresses);
  }
  
  // 测试网络连接
  const http = require('http');
  console.log('\n测试网络连接...');
  
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`HTTP状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);
    
    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });
  
  req.setTimeout(10000, () => {
    console.error('网络连接超时');
    req.destroy();
  });
  
  req.on('error', (error) => {
    console.error('网络连接错误:', error.message);
    
    // 根据错误类型提供建议
    if (error.code === 'ECONNREFUSED') {
      console.log('\n建议: 连接被拒绝，可能是网络限制或防火墙问题');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n建议: 连接超时，可能是网络不稳定或地区限制');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n建议: 域名未找到，可能是DNS解析问题');
    }
  });
  
  req.end();
  
  // 测试OpenAI SDK
  console.log('\n\n测试OpenAI SDK...');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  openai.models.list()
    .then(models => {
      console.log('SDK调用成功，可用模型数:', models.data.length);
    })
    .catch(error => {
      console.error('SDK调用失败:', error.message);
    });
});