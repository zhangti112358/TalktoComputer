/*
判断文本相似度
*/
import url from 'url';
import * as math from 'mathjs';
import { SiliconFlow, SiliconFlowKeyDefault } from './siliconflow.js';

export class SentenceSimilarity {
  private siliconFlow: SiliconFlow;
  embdSize: number = 1024;
  textList: string[] = [];
  textEmbd: math.Matrix = math.matrix();

  constructor() {
    this.siliconFlow = new SiliconFlow(SiliconFlowKeyDefault());
  }

  async embedding(text: string): Promise<number[]> {
    return this.siliconFlow.embedding(text);
  }

  // 文本列表转embd列表
  async textList2Embd(textList: string[]): Promise<math.Matrix> {
    let embdList = [];
    for (let i = 0; i < textList.length; i++) {
      let sentence = textList[i];
      let embd = await this.embedding(sentence);
      embdList.push(embd);
    }
    let embdMatrix:math.Matrix = math.matrix(embdList);
    return embdMatrix;
  }

  // 相似度计算
  async embdSimilarity(embd1: math.Matrix, embd2: math.Matrix): Promise<math.Matrix> {
    return math.multiply(embd1, math.transpose(embd2));
  }

  async initFromSentenceList(textList: string[]) {
    this.textList = textList;
    this.textEmbd = await this.textList2Embd(textList);
  }

  async similarity(text:string) {
    let textList: string[] = [text];
    let embd1 = await this.textList2Embd(textList);
    let similarityMatrix = await this.embdSimilarity(embd1, this.textEmbd);
    return similarityMatrix;
  }
}

async function main() {
  const ss = new SentenceSimilarity();

  // 文字embd
  const textList = ['苹果', '梨', '香蕉', '橘子'];
  await ss.initFromSentenceList(textList);
  let similarityMatrix = await ss.similarity('苹果');
  console.log(similarityMatrix);

}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  main();
}