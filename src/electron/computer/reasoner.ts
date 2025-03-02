/*
判断文本相似度
*/
import * as url from 'url';
import * as math from 'mathjs';
import { exec, spawn } from 'child_process';

import { SiliconFlow, SiliconFlowKeyDefault } from './siliconflow.js';

// 使用 exec 执行命令
export function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}


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

// 运行命令行
export class CommandOperator {
  name: string;
  cmd: string;
  constructor(name: string, cmd: string) {
    this.name = name;
    this.cmd = cmd;
  }

  execute() {
    return executeCommand(this.cmd);
  }
}

// 运行

// 打开网页
export class ChromeUrlOperator extends CommandOperator {
  url: string;
  constructor(name: string, url: string) {
    const cmd = ChromeUrlOperator.url2cmd(url);
    super(name, cmd);
    this.url = url;
  }

  static url2cmd(url:string) {
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = `start chrome ${url}`;
    } else if (process.platform === 'darwin') {
      cmd = `open ${url}`;
    } else if (process.platform === 'linux') {
      cmd = `xdg-open ${url}`;  // 自动生成 未测试
    }
    return cmd;
  }
}

// 搜索
export enum SearchEngine {
  Bing,
  Google,
  Zhihu,
  Bilibili,
  Xiaohongshu,
}


export class ChromeSearchOperator extends ChromeUrlOperator {
  nameWithSearch: string; // eg: 必应搜索
  engine: SearchEngine;
  keyword: string;
  constructor(engine: SearchEngine, keyword?: string) {
    let engineName = ChromeSearchOperator.engine2name(engine);
    if (keyword === undefined) {
      keyword = '';
    }
    
    let url = ChromeSearchOperator.keyword2url(engine, keyword);

    const name = engineName;
    super(name, url);
    this.nameWithSearch = `${name}搜索`;
    this.engine = engine;
    this.keyword = keyword;
  }

  search(keyword: string) {
    let url = ChromeSearchOperator.keyword2url(this.engine, keyword);
    this.url = url;
    this.cmd = ChromeUrlOperator.url2cmd(url);
    return this.execute();
  }

  static engine2name(engine: SearchEngine) {
    let name = '';
    if (engine === SearchEngine.Bing) {
      name = '必应';
    }
    else if (engine === SearchEngine.Google) {
      name = '谷歌';
    }
    else if (engine === SearchEngine.Zhihu) {
      name = '知乎';
    }
    else if (engine === SearchEngine.Bilibili) {
      name = '哔哩哔哩';
    }
    else if (engine === SearchEngine.Xiaohongshu) {
      name = '小红书';
    }
    return name;
  }

  static keyword2url(engine: SearchEngine, keyword: string) {
    let url = '';
    if (engine === SearchEngine.Bing) {
      url = `https://cn.bing.com/search?q=${keyword}`;
    }
    else if (engine === SearchEngine.Google) {
      url = `https://www.google.com/search?q=${keyword}`;
    }
    else if (engine === SearchEngine.Zhihu) {
      url = `https://www.zhihu.com/search?q=${keyword}&type=content`;
    }
    else if (engine === SearchEngine.Bilibili) {
      url = `https://search.bilibili.com/all?keyword=${keyword}`;
    }
    else if (engine === SearchEngine.Xiaohongshu) {
      url = `https://www.xiaohongshu.com/search_result/?keyword=${keyword}`;
    }
    return url;
  }

}

// steam
export class SteamAppOperator extends CommandOperator {
  appid: number;
  constructor(name: string, appid: number) {
    let cmd = SteamAppOperator.appId2cmd(appid);
    super(name, cmd);
    this.appid = appid;
  }

  static appId2cmd(appId:number) {
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = `start steam://rungameid/${appId}`;
    } else if (process.platform === 'darwin') {
      cmd = `open steam://rungameid/${appId}`;
    } else if (process.platform === 'linux') {
      cmd = `xdg-open steam://rungameid/${appId}`;  // 自动生成 未测试
    }
    return cmd;
  }
}

class KerboardOperator {
  flagCopy: boolean = false;
  flagPaste: boolean = false;
  flagEnter: boolean = false;

  // async copy() {
  //   // 模拟键盘操作

  // }

  // async execute() {
  //   // 模拟键盘操作
}

// 理解需求和执行
export class ContextReasoner {
  // 操作列表
  opList: CommandOperator[] = [];
  opNameList: string[] = [];
  similarity: SentenceSimilarity = new SentenceSimilarity();
  embeddingMatix: math.Matrix = math.matrix();
  similarityThreshold: number = 0;

  // 搜索引擎
  opSearchList: ChromeSearchOperator[] = [];

  async init(defaultSearchEngine: SearchEngine = SearchEngine.Bing, similarityThreshold: number = 0.6) {
    this.similarityThreshold = similarityThreshold;
    // 各种操作的集合
    this.opList = [
      // 网页
      new ChromeUrlOperator('必应', 'https://cn.bing.com'),
      new ChromeUrlOperator('谷歌', 'https://www.google.com'),
      new ChromeUrlOperator('知乎', 'https://www.zhihu.com'),
      new ChromeUrlOperator('哔哩哔哩', 'https://www.bilibili.com'),
      new ChromeUrlOperator('小红书', 'https://www.xiaohongshu.com'),
      new ChromeUrlOperator('Github', 'https://github.com'),
      new ChromeUrlOperator('给鲸鱼发消息', 'https://chat.deepseek.com'),

      // 游戏
      new SteamAppOperator('玩传送门', 620),
      new SteamAppOperator('玩CS', 730),
      new SteamAppOperator('玩dota', 570),
      new SteamAppOperator('玩GTA5', 271590),
      new SteamAppOperator('玩蔚蓝', 504230),
      new SteamAppOperator('玩黑神话悟空', 2358720),
    ];

    this.opNameList = this.opList.map(op => op.name);

    // 计算相似度
    this.embeddingMatix = await this.similarity.textList2Embd(this.opNameList);

    // 搜索
    this.opSearchList = [
      new ChromeSearchOperator(SearchEngine.Bing),
      new ChromeSearchOperator(SearchEngine.Google),
      new ChromeSearchOperator(SearchEngine.Zhihu),
      new ChromeSearchOperator(SearchEngine.Bilibili),
      new ChromeSearchOperator(SearchEngine.Xiaohongshu),
    ];
    const defaultSearchOperator = new ChromeSearchOperator(defaultSearchEngine);
    defaultSearchOperator.name = '';
    defaultSearchOperator.nameWithSearch = '搜索';
    this.opSearchList.push(defaultSearchOperator);
  }

  async opSimilarity(text: string) {
    // 计算此文本 和 所有可执行操作的相似度
    const textListThis = [text];
    const embeddingMatix_this = await this.similarity.textList2Embd(textListThis);
    const similarityMatrix    = await this.similarity.embdSimilarity(this.embeddingMatix, embeddingMatix_this);
    
    // 找到最相似的操作
    let maxIndex = 0;
    let maxSimilarity = similarityMatrix.get([0, 0]);
    for (let i = 1; i < this.opNameList.length; i++) {
      let similarity = similarityMatrix.get([i, 0]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        maxIndex = i;
      }
    }
    let op = this.opList[maxIndex];
    console.log(`最相似的操作是：${op.name}，相似度：${maxSimilarity}`);

    // 执行
    let executeResult = '';
    if (maxSimilarity > this.similarityThreshold) {
      executeResult = await op.execute();
    }
    else{
      console.log('未匹配');
    }
    return executeResult;
  }

  async isSearch(text: string): Promise<boolean> {
    let flagSearch = false;
    for (let i = 0; i < this.opSearchList.length; i++) {
      let op = this.opSearchList[i];
      // 判断标准是如果以 xx搜索开头
      if (text.startsWith(op.nameWithSearch)) {
        // 把搜索关键词提取出来
        let textSearch = text.slice(op.nameWithSearch.length);
        console.log(op.nameWithSearch, textSearch);
        await op.search(textSearch);
        flagSearch = true;
        break;
      }
    }

    return flagSearch;
  }

  async reason(text: string) {
    if (await this.isSearch(text)) {
      // isSearch 已经执行了搜索
    }
    else {
      await this.opSimilarity(text);
    }
  }
}

async function main() {
  let reasoner = new ContextReasoner();
  await reasoner.init();
  // await reasoner.reason('给鲸鱼发消息');
  await reasoner.reason('知乎搜索typescript');
  // await reasoner.reason('玩传送门');


  // const ss = new SentenceSimilarity();

  // // 文字embd
  // const textList = ['苹果', '梨', '香蕉', '橘子'];
  // await ss.initFromSentenceList(textList);
  // let similarityMatrix = await ss.similarity('苹果');
  // console.log(similarityMatrix);

}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  main();
}

function runPortal2() {
  throw new Error('Function not implemented.');
}
