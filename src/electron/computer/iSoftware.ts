/*
    语音软件实现
*/
import * as math from 'mathjs';

/*********************************************************************************************************************/
// 基础抽象类

// 说明
export abstract class Information {
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
export abstract class IParam {
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
export abstract class IFunction {
    public name: string;
    public information: Information;
    public param: IParam[];
    public return: IParam;

    constructor(name: string, information: Information, param: IParam[], returnParam: IParam) {
        this.name = name;
        this.information = information;
        this.param = param;
        this.return = returnParam;
    }

    abstract call(...args: any[]): any;
}

// 变量
export abstract class IVariable {
    public name: string;
    public information: Information;
    public type: DataType;

    constructor(name: string, information: Information, type: DataType) {
        this.name = name;
        this.information = information;
        this.type = type;
    }
}

// 类
export abstract class IClass {
    public name: string;
    public information: Information;
    public variable_map: Map<string, IVariable>;
    public function_map: Map<string, IFunction>;
    constructor(name: string, information: Information, functions: IFunction[], variables: IVariable[]) {
        this.name = name;
        this.information = information;
        this.function_map = new Map(functions.map(func => [func.name, func]));
        this.variable_map = new Map(variables.map(variable => [variable.name, variable]));
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







