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

    async fetchCompletion(model: string, messages: Message[]): Promise<string | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages,
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error('API Provider Error:', error);
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

if (isDirectlyExecuted()) {
  // 测试SiliconFlow
  // 输入key
  const key = getSiliconflowKey();
  const siliconflowUrl = 'https://api.siliconflow.cn/v1';
  const siliconflowProvider = new AIModelProvider(key, siliconflowUrl);
  const conversation = new ConversationManager(siliconflowProvider, 'deepseek-ai/DeepSeek-V3.2', 'You are a helpful assistant.');
  const response = await conversation.sendMessage('你好');
  console.log(response);
    
}