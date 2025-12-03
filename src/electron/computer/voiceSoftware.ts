/*
    语音软件实现
*/

// 说明
export abstract class Document {
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
export abstract class ParamDocument {
    public document: Document;
    public type: DataType;
    public optional: boolean;

    constructor(document: Document, type: DataType, optional: boolean = false) {
        this.document = document;
        this.type = type;
        this.optional = optional;
    }
    
}

// 函数
export abstract class Function {
    public document: Document;
    public paramDocument: ParamDocument[];
    public returnDocument: ParamDocument;

    constructor(document: Document, paramDocument: ParamDocument[], returnDocument: ParamDocument) {
        this.document = document;
        this.paramDocument = paramDocument;
        this.returnDocument = returnDocument;
    }

    abstract call(...args: any[]): any;
}




