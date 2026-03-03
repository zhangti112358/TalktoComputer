import OpenAI from 'openai';
import * as url from 'url';
import { getSiliconflowKey } from './defineElectron.js';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * 模型运营商类：负责底层通信配置
 * 支持自定义 baseURL 以兼容各种 OpenAI 格式的 API（如 DeepSeek, OneAPI 等）
 */
class AIModelProvider {
    private client: OpenAI;

    constructor(apiKey: string, baseURL: string = 'https://api.openai.com/v1') {
        this.client = new OpenAI({ 
            apiKey: apiKey,
            dangerouslyAllowBrowser: true, // 如果在 Electron 渲染进程中使用需要此项
            baseURL: baseURL 
        });
    }

    async fetchCompletion(model: string, messages: Message[], tools?: any[]): Promise<any | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages,
                tools: tools, // 传入工具定义
            });
            return response.choices[0].message; // 返回完整 message 对象以包含 tool_calls
        } catch (error) {
            console.error('API Provider Error:', error);
            throw error;
        }
    }

    async *fetchStreamingCompletion(model: string, messages: Message[]) {
        try {
            const stream = await this.client.chat.completions.create({
                model: model,
                messages: messages,
                stream: true,
            });
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            console.error('API Provider Streaming Error:', error);
            throw error;
        }
    }
}

/**
 * 对话管理类：负责业务逻辑、上下文维护和模型选择
 */
class ConversationManager {
    private messages: Message[] = [];
    private provider: AIModelProvider;
    private model: string;

    /**
     * @param provider 注入的服务提供商实例
     * @param model 指定该对话使用的模型（如 "gpt-4o" 或 "deepseek-chat"）
     */
    constructor(provider: AIModelProvider, model: string, systemPrompt: string = 'You are a helpful assistant.') {
        this.provider = provider;
        this.model = model;
        this.messages.push({ role: 'system', content: systemPrompt });
    }

    async sendMessage(userInput: string): Promise<string | null> {
        this.messages.push({ role: 'user', content: userInput });

        // 将模型名称从管理器传给提供商
        const assistantResponse = await this.provider.fetchCompletion(this.model, this.messages);

        if (assistantResponse) {
            this.messages.push({ role: 'assistant', content: assistantResponse });
        }

        return assistantResponse;
    }

    async *sendMessageStreaming(userInput: string) {
        this.messages.push({ role: 'user', content: userInput });

        let fullResponse = '';
        const stream = this.provider.fetchStreamingCompletion(this.model, this.messages);

        for await (const part of stream) {
            fullResponse += part;
            yield part;
        }

        if (fullResponse) {
            this.messages.push({ role: 'assistant', content: fullResponse });
        }
    }

    clearHistory(): void {
        const systemMsg = this.messages[0];
        this.messages = [systemMsg];
    }

    getHistory(): Message[] {
        return this.messages;
    }
}

// 安全地检查是否是直接运行此脚本
function isDirectlyExecuted() {
  try {
    // pathToFileURL(process.argv[1]) 在npm运行正常 编译后引发报错 所以使用 try catch
    return import.meta.url === url.pathToFileURL(process.argv[1]).href;
  } catch (error) {
    return false;
  }
}

class ModelTest {
    // 定义工具 Schema
    private tools = [
        {
            type: "function",
            function: {
                name: "get_travel_time",
                description: "获取两地之间的旅行时间",
                parameters: {
                    type: "object",
                    properties: {
                        origin: { type: "string", description: "起点" },
                        destination: { type: "string", description: "终点" }
                    },
                    required: ["origin", "destination"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "get_weather",
                description: "获取指定位置的天气",
                parameters: {
                    type: "object",
                    properties: {
                        location: { type: "string", description: "地名" }
                    },
                    required: ["location"]
                }
            }
        }
    ];

    // Mock 工具逻辑
    private handleToolMock(toolCall: any) {
        const args = JSON.parse(toolCall.function.arguments);
        if (toolCall.function.name === 'get_travel_time') {
            console.log(`[工具执行] 计算路径: ${args.origin} -> ${args.destination}`);
            return "大约需要 1 小时";
        }
        if (toolCall.function.name === 'get_weather') {
            console.log(`[工具执行] 查询天气: ${args.location}`);
            return "当前气温 10 度，天气晴朗";
        }
        return "未知工具调用";
    }

    async testToolCalls() {
        console.log('\n--- 开始工具调用 (Tool Calls) 测试 ---');
        const key = getSiliconflowKey();
        const provider = new AIModelProvider(key, 'https://api.siliconflow.cn/v1');
        const model = 'deepseek-ai/DeepSeek-V3';
        
        const messages: any[] = [
            { role: 'system', content: '你是一个全能助手。如果用户问路程或天气，请调用工具。' },
            { role: 'user', content: '我现在在【北京南站】，打算去【故宫博物院】看展览，请问打车大约要多久？顺便帮我查查故宫那边的天气。' }
        ];

        // 第一轮：发送消息和工具定义给模型
        // 模型会判断是否需要调用工具，若需要，它不返回 content，而是返回 tool_calls 数组
        const response: any = await provider.fetchCompletion(model, messages, this.tools);
        
        // 【核心：观察模型输出结构】
        console.log('--- 模型原始输出结构 (Raw Message Response) ---');
        console.log(JSON.stringify(response, null, 2));

        if (response.tool_calls && response.tool_calls.length > 0) {
            // 步骤 1: 必须将模型返回的包含 tool_calls 的 message 对象原样加入历史记录
            // 这是为了维持对话上下文，让模型知道它之前“提议”过这些调用
            messages.push(response);

            console.log('\n--- 开始本地解析并执行工具 ---');

            // 步骤 2: 遍历 tool_calls 列表
            // 每个 toolCall 包含: id (唯一标识), type (目前固定为 function), function (包含 name 和 arguments)
            for (const toolCall of response.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments); // 模型生成的参数是字符串，需要 JSON 反序列化

                console.log(`> 匹配到函数: ${functionName}, 提取参数:`, functionArgs);

                // 步骤 3: 根据函数名执行本地 Mock 逻辑
                const toolResult = this.handleToolMock(toolCall);
                
                // 步骤 4: 将工具执行的结果作为一个特殊的 'tool' 角色回复存入消息队列
                // 注意：必须关联相应的 tool_call_id，否则模型无法对应回复内容
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id, // 核心：必须对应 ID
                    content: toolResult       // 本地逻辑返回的结果字符串
                });
            }

            console.log('\n--- 所有工具执行完成，正在请求 AI 总结 ---');

            // 步骤 5: 将更新后的 messages 全量发给模型进行汇总（第二轮调用）
            // 此时 messages 包含了：[System, User, Assistant(tool_calls), Tool(result1), Tool(result2)]
            const finalResponse = await provider.fetchCompletion(model, messages);
            console.log('AI 最终总结回答:', finalResponse.content);
        } else {
            console.log('模型判断不需要调用工具或未支持。直接回答:', response.content);
        }
        console.log('\n--- 工具调用测试完成 ---');
    }

    async testSiliconflowSimple(){
    // 测试SiliconFlow
    const key = getSiliconflowKey();
    const siliconflowUrl = 'https://api.siliconflow.cn/v1';
    const siliconflowProvider = new AIModelProvider(key, siliconflowUrl);
    const conversation = new ConversationManager(siliconflowProvider, 'deepseek-ai/DeepSeek-V3', '你是一个乐于助人的助手。');

    console.log('--- 开始非流式测试 ---');
    const response = await conversation.sendMessage('你好');
    console.log('回答:', response);

    console.log('\n--- 开始流式测试 ---');
    const stream = conversation.sendMessageStreaming('请写一首关于编程的短诗。');
        
    console.log('AI 开始回答:');
    for await (const chunk of stream) {
      console.log(chunk); // 将 process.stdout.write 改为 console.log
    }

    // 输出所有回答内容
    console.log('\n--- 输出完整回答 ---');
    const fullResponse = conversation.getHistory()[conversation.getHistory().length - 1].content;
    console.log(fullResponse);
    console.log('\n测试完成。\n');

    }


    async test() {
        // 简单测试
        // await this.testSiliconflowSimple();

        // 测试工具调用功能
        await this.testToolCalls();
    }
}

if (isDirectlyExecuted()) {
    const tester = new ModelTest();
    tester.test(); // 修改为执行全部测试
}