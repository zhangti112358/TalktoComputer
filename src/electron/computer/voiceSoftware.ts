/*
    语音软件实现
*/

/*********************************************************************************************************************/
// 抽象类

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






