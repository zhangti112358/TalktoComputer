/*
判断文本相似度
*/
import { SiliconFlow, SiliconFlowKeyDefault } from './siliconflow.js';

class EmbeddingSimilarity {
    private siliconFlow: SiliconFlow;

    constructor() {
        this.siliconFlow = new SiliconFlow(SiliconFlowKeyDefault());
    }
}