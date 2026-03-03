/*
    语音软件实现
*/
import * as math from 'mathjs';
import * as url from 'url';
import OpenAI from 'openai';

import { Amap, amapKey } from './amap.js';
import { MemoryManager, MemoryType } from './memory.js';
import { getSiliconflowKey } from './defineElectron.js';

/*********************************************************************************************************************/
// 基础抽象类

// 说明
export class Information {
    public content: string = '';

    constructor(content: string) {
        this.content = content;
    }
}

export enum DataType {
    String = 'string',
    Number = 'number',
    Boolean = 'bool',
}

export enum BoolType {
    True = 'true',
    False = 'false',
}

// 参数说明
export class IParam {
    public name: string;
    public information: Information;
    public type: DataType;
    public optional: boolean;

    constructor(name: string, information: Information, type: DataType, optional: boolean = false) {
        this.name = name;
        this.information = information;
        this.type = type;
        this.optional = optional;
    }
    
}

// 函数
export class IFunction {
    public name: string;
    public information: Information;
    public param: IParam[];
    public return: IParam;
    private executor: (...args: any[]) => Promise<any>;

    constructor(
        name: string, 
        information: Information, 
        param: IParam[], 
        returnParam: IParam,
        executor: (...args: any[]) => Promise<any>
    ) {
        this.name = name;
        this.information = information;
        this.param = param;
        this.return = returnParam;
        this.executor = executor;
    }

    // 自动转换为 LLM 需要的 JSON Schema 格式
    public toJSONSchema() {
        return {
            name: this.name,
            description: this.information.content,
            parameters: {
                type: "object",
                properties: this.param.reduce((acc: any, p) => {
                    // 确保类型映射到 JSON Schema 标准 (bool -> boolean)
                    const typeMap: any = { 'string': 'string', 'number': 'number', 'bool': 'boolean' };
                    acc[p.name] = { 
                        type: typeMap[p.type] || 'string', 
                        description: p.information.content 
                    };
                    return acc;
                }, {}),
                required: this.param.filter(p => !p.optional).map(p => p.name)
            }
        };
    }

    async call(...args: any[]): Promise<any> {
        return await this.executor(...args);
    }
}

// 变量
export abstract class IVariable {
    public name: string;
    public information: Information;
    public type: DataType;
    public value: any;

    constructor(name: string, information: Information, type: DataType, value: any) {
        this.name = name;
        this.information = information;
        this.type = type;
        this.value = value;
    }
}

// 类
export abstract class IClass {
    public name: string; // 例如 "AmapApp"
    public information: Information;
    public functions: Map<string, IFunction> = new Map();
    public variables: Map<string, IVariable> = new Map();

    constructor(name: string, information: Information) {
        this.name = name;
        this.information = information;
    }

    // 1. 暴露所有函数接口，供 LLM 的 tools 参数使用
    public getFunctionsSchema(): any[] {
        const schemas: any[] = [];
        this.functions.forEach((func) => {
            const schema = func.toJSONSchema();
            // 核心修改：将函数名改为 "App名__函数名"
            schema.name = `${this.name}__${func.name}`;
            schemas.push(schema);
        });
        return schemas;
    }

    // 2. 暴露所有变量状态，供 LLM 了解当前 App 的运行环境
    public getStateSnapshot(): any {
        const state: any = {};
        this.variables.forEach((variable) => {
            state[variable.name] = {
                value: variable.value,
                description: variable.information.content,
                type: variable.type
            };
        });
        return {
            appName: this.name,
            appDescription: this.information.content,
            state: state
        };
    }

    // 统一执行函数入口
    public async callFunction(name: string, args: any): Promise<any> {
        const func = this.functions.get(name);
        if (!func) throw new Error(`Function ${name} not found in ${this.name}`);
        // 这里可以根据参数名进行简单映射转换
        const orderedArgs = func.param.map(p => args[p.name]);
        return await func.call(...orderedArgs);
    }
}

/*********************************************************************************************************************/
// 选择和使用辅助
export type EmbeddingFunction = (text: string) => number[];

// function embeddingCommon(text: string): number[] {
//     return [1, 2, 3];
// }

export class SentenceSimilarity {
    embeddingFunction: EmbeddingFunction;
    sentenceList: string[] = [];
    embeddingMatrix: math.Matrix = math.matrix([]);
    embeddingList: number[][] = [];    // 维护纯 number[][] 列表以便安全追加行

    constructor(embeddingFunction: EmbeddingFunction) {
        this.embeddingFunction = embeddingFunction;

    }

    clear() {
        this.sentenceList = [];
        this.embeddingList = [];
        this.embeddingMatrix = math.matrix([]);
    }

    addSentence(sentence: string) {
        this.sentenceList.push(sentence);
        const embed = this.embeddingFunction(sentence);
        this.embeddingList.push(embed);
        this.embeddingMatrix = math.matrix(this.embeddingList);
    }

    addSentenceList(sentenceList: string[]) {
        for (const sentence of sentenceList) {
            this.sentenceList.push(sentence);
            const embed = this.embeddingFunction(sentence);
            this.embeddingList.push(embed);
        }
        this.embeddingMatrix = math.matrix(this.embeddingList);
    }

    // 对比相似度
    cosineSimilarity(matrixA: math.Matrix, matrixB: math.Matrix): math.Matrix {
        // A: 1xN B: LxN -> 1xL
        return math.multiply(matrixA, math.transpose(matrixB));
    }

    sortOneRowMatrix(similarMatrix: math.Matrix): { indices: number[]; values: number[]; } {
        // 转成原生数组，兼容 [v1, v2, ...] 或 [[v1, v2, ...]] 形式
        const arr = (similarMatrix as any).toArray();
        const row: number[] = Array.isArray(arr[0]) ? arr[0] : arr;

        // 生成索引数组并按对应值降序排序
        const indices = row.map((_, i) => i);
        indices.sort((i, j) => {
            const vi = row[i] ?? 0;
            const vj = row[j] ?? 0;
            return vj - vi; // 降序
        });

        const values = indices.map(i => row[i]);

        return { indices, values };
    }

    similarityMatrix2topKIndexes(similarityMatrix: math.Matrix, k: number): { indices: number[]; values: number[]; } {
        const sorted = this.sortOneRowMatrix(similarityMatrix);
        return {
            indices: sorted.indices.slice(0, k),
            values: sorted.values.slice(0, k),
        };
    }

    topKSimilarSentences(query: string, k: number): number[] {
        // 计算相似度分数
        const query_embed = this.embeddingFunction(query);
        const query_matrix = math.matrix(query_embed);
        const scores = this.cosineSimilarity(query_matrix, this.embeddingMatrix);

        // 排序并取前K
        const sorted = this.similarityMatrix2topKIndexes(scores, k);
        return sorted.indices.slice(0, k);
    }
}




/*********************************************************************************************************************/
// 实际的App实现

/**
 * 符合 IClass 规范的高德地图 App 封装
 */
export class AmapApp extends IClass {
    // 真正的逻辑实现类（私有，不暴露给外部/模型）
    private _amap: Amap;

    constructor(apiKey: string) {
        super('AmapApp', new Information('提供高德地图完整的地理信息服务，包括天气、搜索、路径规划等'));
        
        this._amap = new Amap();
        this._amap.setApiKey(apiKey);

        // 初始化所有功能并注册
        this.initFunctions();
    }

    private initFunctions() {
        // 1. 地理编码
        this.functions.set('geocode', new IFunction(
            'geocode',
            new Information('地址转坐标：将结构化地址转换为经纬度'),
            [new IParam('address', new Information('地址'), DataType.String)],
            new IParam('res', new Information('结果'), DataType.String),
            async (address: string) => this._amap.geocode(address)
        ));

        // 2. 逆地理编码
        this.functions.set('regeo', new IFunction(
            'regeo',
            new Information('坐标转地址：将经纬度转换为详细地址'),
            [new IParam('location', new Information('经纬度，逗号隔开'), DataType.String)],
            new IParam('res', new Information('结果'), DataType.String),
            async (loc: string) => this._amap.regeo(loc)
        ));

        // 3. 驾车规划
        this.functions.set('directionDriving', new IFunction(
            'directionDriving',
            new Information('查询两点间的驾车路线'),
            [
                new IParam('origin', new Information('起点坐标'), DataType.String),
                new IParam('destination', new Information('终点坐标'), DataType.String)
            ],
            new IParam('res', new Information('路线'), DataType.String),
            async (o, d) => this._amap.directionDriving(o, d)
        ));

        // 4. 步行规划
        this.functions.set('directionWalking', new IFunction(
          'directionWalking',
          new Information('查询两点间的步行路线'),
          [
            new IParam('origin', new Information('起点坐标'), DataType.String),
            new IParam('destination', new Information('终点坐标'), DataType.String)
          ],
          new IParam('res', new Information('路线'), DataType.String),
          async (o, d) => this._amap.directionWalking(o, d)
        ));

        // 5. 关键字搜索
        this.functions.set('searchPlaceText', new IFunction(
          'searchPlaceText',
          new Information('关键字搜索地点（POI）'),
          [new IParam('keywords', new Information('关键字'), DataType.String)],
          new IParam('res', new Information('地点列表'), DataType.String),
          async (k) => this._amap.searchPlaceText(k)
        ));

        // 6. 天气查询
        this.functions.set('weather', new IFunction(
            'weather',
            new Information('获取实时天气信息'),
            [new IParam('city', new Information('城市 adcode'), DataType.String)],
            new IParam('res', new Information('天气'), DataType.String),
            async (city) => this._amap.weather(city)
        ));
    }
}


/*********************************************************************************************************************/
// 系统功能实现


/**
 * System 类：操作系统的内核调度器
 * 负责：App 注册、记忆管理、上下文组装、LLM 任务循环
 */
export class System {
    private client: OpenAI;
    private model: string;
    private memory: MemoryManager;
    private apps: Map<string, IClass> = new Map();
    private similarity: SentenceSimilarity;
    public debug: boolean = false; // 控制日志输出的开关

    constructor(apiKey: string, baseURL: string = 'https://api.siliconflow.cn/v1', model: string = 'deepseek-ai/DeepSeek-V3', debug: boolean = false) {
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL,
            dangerouslyAllowBrowser: true // 适配 Electron 进程
        });
        this.model = model;
        this.debug = debug;
        this.memory = new MemoryManager();
        this.similarity = new SentenceSimilarity((text) => [0]); // 暂时的占位
    }

    private log(module: string, message: any) {
        if (!this.debug) return;
        const msg = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
        console.log(`[${module}] ${new Date().toLocaleTimeString()}: ${msg}`);
    }

    /**
     * 1. 注册应用程序
     * 将高德、飞书等 App 实例加入系统
     */
    public registerApp(app: IClass) {
        this.apps.set(app.name, app);
        // TODO: 将 App 的描述加入相似度计算列表，以便后续按需加载
        this.similarity.addSentence(app.information.content);
    }

    /**
     * 2. 核心交互接口
     * 用户输入一句话，系统进行 思考 -> 行动 -> 观察 的循环
     */
    public async talk(userInput: string): Promise<string> {
        this.log("TALK", `User: ${userInput}`);
        
        // 核心：维护本轮对话的临时工具链状态
        let roundMessages: any[] = []; 
        let isFinished = false;
        let finalText = "";

        while (!isFinished) {
            // 准备上下文（包含：系统提示、长期记忆、以及本轮已产生的 roundMessages）
            const context = this.prepareContext(userInput, roundMessages);
            const result = await this.callLLM(context);

            if (result.type === 'text') {
                finalText = result.content;
                this.memory.add(MemoryType.responseText, finalText);
                isFinished = true;
            } else if (result.type === 'tool_calls') {
                // 1. 记录模型发出的 tool_calls 原型（必须传回，否则报错）
                roundMessages.push(result.rawMessage); 

                // 2. 分发并执行工具
                const toolOutputs = await this.dispatchTools(result.calls);

                // 3. 记录工具执行的结果
                for (const output of toolOutputs) {
                    roundMessages.push({
                        role: 'tool',
                        tool_call_id: output.callId,
                        content: JSON.stringify(output.data)
                    });
                }
                // 继续循环，让模型基于这些结果产生回答
            }
        }
        return finalText;
    }

    /**
     * 3. 组装上下文
     * 动态挑选相关的 App Schema、系统状态和历史记忆
     */
    private prepareContext(userInput: string, currentToolResults: any[] = []) {
        // 加强对工具使用的引导
        const systemPrompt = `你是一个全能的计算机助手。你可以通过调用工具来执行现实世界的任务。
如果用户的问题可以由工具解决（如查天气、搜地图），请务必调用对应的函数，不要只用文字回答。
当前可用的应用包括：${Array.from(this.apps.keys()).join(', ')}。`;

        return {
            systemPrompt: systemPrompt,
            history: this.memory.getMemory(10), 
            availableTools: Array.from(this.apps.values()).flatMap(app => 
                app.getFunctionsSchema() // 记得在 getFunctionsSchema 里给函数名加 App 前缀
            ),
            currentToolResults: currentToolResults // id, name, data
        };
    }

    /**
     * 4. 工具分发器
     * 根据模型返回的 JSON，找到对应的 IClass 并执行函数
     */
    private async dispatchTools(calls: any[]): Promise<any[]> {
        const results = [];
        for (const call of calls) {
            // call 结构通常如: { appName: 'AmapApp', functionName: 'weather', args: { city: '110000' } }
            const app = this.apps.get(call.appName);
            if (app) {
                const data = await app.callFunction(call.functionName, call.args);
                results.push({
                    callId: call.id,
                    funcName: call.functionName,
                    data: data
                });
            }
        }
        return results;
    }

    /**
     * 5. LLM 通信层 (精简实现)
     */
    private async callLLM(context: any): Promise<any> {
        // 修改：确保这里的 messages 构造逻辑与 talk 中的 roundMessages 一致
        const messages: any[] = [
            { role: 'system', content: context.systemPrompt },
            ...context.history.map((m: any) => ({
                role: m.type === 'spokenWords' ? 'user' : 'assistant',
                content: m.content
            })),
            ...context.currentToolResults // 这是 talk 传进来的 roundMessages
        ];

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages,
            tools: context.availableTools.map((t: any) => ({ type: 'function', function: t }))
        });

        const msg = response.choices[0].message;

        if (msg.tool_calls) {
            return {
                type: 'tool_calls',
                rawMessage: msg,
                calls: msg.tool_calls.map((c: any) => {
                    // 修复 ts(2339) 错误：增加类型判断
                    if (c.type === 'function') {
                        // 解析 AppName__FunctionName 结构
                        const fullMethodName = c.function.name;
                        const [appName, functionName] = fullMethodName.includes('__') 
                            ? fullMethodName.split('__') 
                            : [null, fullMethodName];

                        return {
                            id: c.id,
                            appName: appName,
                            functionName: functionName,
                            args: JSON.parse(c.function.arguments)
                        };
                    }
                    return null;
                }).filter((c: any) => c !== null)
            };
        }
        return { type: 'text', content: msg.content };
    }
}


/*********************************************************************************************************************/
// 测试

export class IClassTest {
    public async test() {
        console.log('--- AmapApp 接口暴露测试 ---');
        const apiKey = amapKey();  // 从文件安全读取 API Key
        const myAmap = new AmapApp(apiKey);

        // 输出 Schema，检查是否已经自动包含了所有函数，且没有 apiKey 参数
        const tools = myAmap.getFunctionsSchema();
        console.log(`已成功封装 ${tools.length} 个高德功能到 Schema。`);
        console.log(JSON.stringify(tools, null, 2));
    }
}

export class SystemTest {
    public async test() {
        // 1. 配置参数 (请替换为您自己的有效 Key)
        const MY_API_KEY = getSiliconflowKey();
        const BASE_URL = "https://api.siliconflow.cn/v1";
        const MODEL = "deepseek-ai/DeepSeek-V3";

        console.log("=== [TEST] 正在初始化系统 ===");
        
        // 2. 初始化 System (开启 DEBUG 模式)
        // 构造函数参数顺序: apiKey, baseURL, model, debug
        const mySystem = new System(MY_API_KEY, BASE_URL, MODEL, true);

        // 3. 注册 App
        const amap = new AmapApp(amapKey());
        mySystem.registerApp(amap);
        console.log(`=== [TEST] 已注册应用: ${amap.name} ===`);

        try {
            console.log("\n--- [场景1: 基础对话测试] ---");
            const res1 = await mySystem.talk("你好，请记住我是一个开发者。");
            console.log(">>> 最终回复1:", res1);

            console.log("\n--- [场景2: 工具调用测试] ---");
            // 这里会触发 AppName__FunctionName 逻辑
            const res2 = await mySystem.talk("帮我查一下上海的天气怎么样？");
            console.log(">>> 最终回复2:", res2);

        } catch (error) {
            console.error("测试过程中发生错误:", error);
        }
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
//   const test = new IClassTest();
//   test.test();

  // system 测试
    const systemTest = new SystemTest();
    systemTest.test();
}
