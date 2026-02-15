/*
    语音软件实现
*/
import * as math from 'mathjs';
import * as url from 'url';
import { Amap, amapKey } from './amap.js';
import { MemoryManager, MemoryType } from './memory.js';

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
                    acc[p.name] = { 
                        type: p.type, 
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
    public name: string;
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
            schemas.push(func.toJSONSchema());
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
    private memory: MemoryManager;
    private apps: Map<string, IClass> = new Map();
    private similarity: SentenceSimilarity;

    constructor(embeddingFn: EmbeddingFunction) {
        this.memory = new MemoryManager();
        this.similarity = new SentenceSimilarity(embeddingFn);
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
        // 第一步：存入用户记忆
        this.memory.addSpokenWords(userInput);

        let finalResponse = "";
        let isFinished = false;

        // 维护一个局部变量来存放当前轮次的工具调用结果，用于喂给模型
        let toolOutputs: any[] = [];

        // 进入 Agent 决策循环
        while (!isFinished) {
            // STEP 2: 准备上下文 (组装 Prompt)
            const promptContext = this.prepareContext(userInput, toolOutputs);

            // STEP 3: 调用模型 (LLM)
            // TODO: 调用真正的 LLM API (如 DeepSeek)
            console.log("System: 正在思考并提取意图...");
            const llmResult = await this.callLLM(promptContext); 

            // STEP 4: 判断模型意图
            if (llmResult.type === 'text') {
                // 模型直接回复文字
                finalResponse = llmResult.content;
                this.memory.add(MemoryType.responseText, finalResponse);
                isFinished = true;
            } 
            else if (llmResult.type === 'tool_calls') {
                // 模型想要调用工具
                console.log(`System: 发现工具调用指令 - ${llmResult.calls.length} 个动作`);
                
                // STEP 5: 执行工具分发
                toolOutputs = await this.dispatchTools(llmResult.calls);
                
                // 记录计算机操作记忆
                toolOutputs.forEach(out => {
                    this.memory.addComputerAction(`执行了 ${out.funcName}, 结果: ${JSON.stringify(out.data)}`);
                });

                // 继续循环，将 toolOutputs 传给下一次 prepareContext，让模型进行下一步总结
            }
        }

        return finalResponse;
    }

    /**
     * 3. 组装上下文
     * 动态挑选相关的 App Schema、系统状态和历史记忆
     */
    private prepareContext(userInput: string, currentToolResults: any[] = []) {
        // TODO: 1. 从 memory 获取最近 N 条记录
        // TODO: 2. 根据 userInput 通过相似度挑出最相关的 App
        // TODO: 3. 合并所有 App 的 getStateSnapshot()
        
        console.log("System: 正在拼装上下文数据...");
        return {
            history: this.memory.getMemory(10),
            availableTools: Array.from(this.apps.values()).flatMap(app => app.getFunctionsSchema()),
            toolResults: currentToolResults
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
     * 5. LLM 通信层 (TODO)
     */
    private async callLLM(context: any): Promise<any> {
        // TODO: 对接 OpenAI / DeepSeek 的 SDK
        // 模拟返回
        return { type: 'text', content: "这是一个框架模拟回复。" };
    }
}

/*********************************************************************************************************************/
// ...existing code...


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
  const test = new IClassTest();
  test.test();
}
