# Workflow-AI

一个类似Clawdbot和Manus的工作流AI助手，基于SOP Engineering概念打造，能够生成任务SOP并按流程执行复杂任务。

## 功能特点

- **工作流引擎**：基于SOP（标准操作流程）的工作流管理系统
- **智能助手**：能够理解自然语言请求并自动选择合适的工作流
- **工具集成**：提供文件操作、系统信息等基础工具
- **可扩展性**：支持自定义工作流和工具
- **本地运行**：在本地设备上运行，保护数据隐私

## 项目结构

```
workflow-ai/
├── src/
│   ├── core/          # 核心组件
│   │   └── WorkflowEngine.js  # 工作流引擎
│   ├── agents/        # AI代理
│   │   └── AssistantAgent.js  # 助手代理
│   ├── tools/         # 工具模块
│   │   └── BasicTools.js      # 基础工具
│   ├── workflows/     # 工作流定义
│   ├── utils/         # 工具函数
│   │   └── helpers.js         # 辅助函数
│   └── index.js       # 主入口
├── config/            # 配置文件
│   └── .env           # 环境变量
├── tests/             # 测试文件
├── package.json       # 项目依赖
└── README.md          # 项目说明
```

## 安装和使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境配置示例文件并填写您的OpenAI API密钥：

```bash
cp config/.env.example config/.env
```

编辑 `config/.env` 文件，添加您的OpenAI API密钥：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 运行程序

```bash
npm start
```

### 4. 使用示例

```
Workflow-AI> 帮我分析一下销售数据

正在处理您的请求...

已选择工作流: 数据分析
理解的用户意图: 分析销售数据

执行步骤: 定义分析目标 - 明确数据分析的具体目标和范围
执行步骤: 收集数据 - 收集相关数据资源
执行步骤: 清洗数据 - 处理数据中的错误和缺失值
执行步骤: 分析数据 - 应用统计方法或机器学习算法进行分析
执行步骤: 可视化 - 将分析结果可视化展示
执行步骤: 生成报告 - 整理分析结果并生成专业报告

AI响应: 工作流 "数据分析" 执行完成!

执行步骤:
1. 定义分析目标 - completed
2. 收集数据 - completed
3. 清洗数据 - completed
4. 分析数据 - completed
5. 可视化 - completed
6. 生成报告 - completed

结果: 工作流 "数据分析" 执行完成
```

## 自定义工作流

您可以在 `WorkflowEngine.js` 中注册自定义工作流：

```javascript
// 示例：注册新工作流
workflowEngine.registerWorkflow('自定义工作流', [
  { id: 'step1', name: '步骤1', description: '第一步描述' },
  { id: 'step2', name: '步骤2', description: '第二步描述' },
  { id: 'step3', name: '步骤3', description: '第三步描述' }
]);
```

## 扩展工具

您可以在 `tools` 目录下创建新的工具模块：

```javascript
// 示例：创建新工具
class CustomTools {
  static customFunction() {
    // 实现自定义功能
  }
}

module.exports = CustomTools;
```

## 技术栈

- Node.js
- OpenAI API
- JavaScript

## 许可证

MIT