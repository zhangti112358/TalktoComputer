/*
判断文本相似度
*/
import * as url from 'url';
import * as math from 'mathjs';
import * as path from 'path';
import * as fs from 'fs';
import { exec, spawn } from 'child_process';
import robot from 'robotjs';
import { clipboard } from 'electron';

import { ShortcutCommandType, ShortcutCommand, TextAutoProcess } from './define.js';
import { FilePath, UserFileUtil, } from './defineElectron.js';
import { SiliconFlow } from './siliconflow.js';

// 模拟键盘操作
class KerboardOperator {

    /**
     * 模拟键盘执行复制操作 (Ctrl+C)
     * @returns Promise<boolean>
     */
    static async copy(): Promise<boolean> {
      try {
        if (process.platform === 'win32' || process.platform === 'linux') {
          robot.keyTap('c', ['control']);
        }
        else if (process.platform === 'darwin') {
          robot.keyTap('c', ['command']);
        }
        return true;
      } catch (error) {
        console.error('复制操作失败:', error);
        return false;
      }
    }
  
    /**
     * 模拟键盘执行粘贴操作 (Ctrl+V)
     * @returns Promise<boolean>
     */
    static async paste(): Promise<boolean> {
      try {
        // win 和 mac
        if (process.platform === 'win32' || process.platform === 'linux') {
          robot.keyTap('v', ['control']);
        }
        else if (process.platform === 'darwin') {
          robot.keyTap('v', ['command']);
        }
        return true;
      } catch (error) {
        console.error('粘贴操作失败:', error);
        return false;
      }
    }
  
    /**
     * 模拟键盘按下 Enter 键
     * @returns Promise<boolean>
     */
    static async enter(): Promise<boolean> {
      try {
        robot.keyTap('enter');
        return true;
      } catch (error) {
        console.error('Enter 键操作失败:', error);
        return false;
      }
    }
  
    /**
     * 模拟键盘输入文字
     * @param text 要输入的文字
     * @returns Promise<boolean>
     */
    static async type(text: string): Promise<boolean> {
      try {
        robot.typeString(text);
        return true;
      } catch (error) {
        console.error('键盘输入失败:', error);
        return false;
      }
    }
  
    /**
     * 模拟按下单个键
     * @param key 要按下的键
     * @returns Promise<boolean>
     */
    static async pressKey(key: string): Promise<boolean> {
      try {
        robot.keyTap(key);
        return true;
      } catch (error) {
        console.error(`按键 ${key} 操作失败:`, error);
        return false;
      }
    }
  
    /**
     * 模拟按下组合键
     * @param key 主键
     * @param modifiers 修饰键数组
     * @returns Promise<boolean>
     */
    static async pressKeyWithModifiers(key: string, modifiers: string[]): Promise<boolean> {
      try {
        // 按下所有修饰键
        for (const modifier of modifiers) {
          robot.keyToggle(modifier, 'down');
        }
        
        // 按下主键
        robot.keyTap(key);
        
        // 释放所有修饰键
        for (const modifier of modifiers) {
          robot.keyToggle(modifier, 'up');
        }
        
        return true;
      } catch (error) {
        console.error('组合键操作失败:', error);
        return false;
      }
    }
}

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
    this.siliconFlow = new SiliconFlow();
  }

  setApiKey(key: string) {
    this.siliconFlow.setApiKey(key);
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
    url = `"${url}"`; // 需要加引号 来支持带空格的url
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

// 操作系统 文字操作
class TextOprator {
  flagCopy: boolean = false;
  flagPaste: boolean = false;
  flagEnter: boolean = false;

  init(textAutoProcess: TextAutoProcess) {
    this.flagCopy = textAutoProcess.autoCopyFlag;
    this.flagPaste = textAutoProcess.autoPasteFlag;
    this.flagEnter = textAutoProcess.autoEnterFlag;
  }

  async execute(text: string) {
    if (this.flagCopy){
      clipboard.writeText(text);
      if (this.flagPaste){
        await KerboardOperator.paste();
        if (this.flagEnter){
          await KerboardOperator.enter();
        }
      }
    }
    return '';
  }
}

// 快捷指令 默认值存储在默认文件，用户修改后存储在另一个文件
export class ShortcutCommandUtil {
  static getDefaultCommandList(){
    let commandList:ShortcutCommand[] = [
      // 网页
      { name: '必应',         type: ShortcutCommandType.url, value: 'https://cn.bing.com', embedding: [] },
      { name: '谷歌',         type: ShortcutCommandType.url, value: 'https://www.google.com', embedding: [] },
      { name: '知乎',         type: ShortcutCommandType.url, value: 'https://www.zhihu.com', embedding: [] },
      { name: '哔哩哔哩',     type: ShortcutCommandType.url, value: 'https://www.bilibili.com', embedding: [] },
      { name: '小红书',       type: ShortcutCommandType.url, value: 'https://www.xiaohongshu.com', embedding: [] },
      { name: 'Github',       type: ShortcutCommandType.url, value: 'https://github.com', embedding: [] },
      { name: '给鲸鱼发消息',  type: ShortcutCommandType.url, value: 'https://chat.deepseek.com', embedding: [] },

      // 软件
      // { name: '打开vscode',    type: ShortcutCommandType.software, value: 'code', embedding: [] },
      // { name: '谷歌浏览器',    type: ShortcutCommandType.software, value: 'chrome', embedding: [] },

      // 游戏
      { name: '玩传送门',       type: ShortcutCommandType.steam, value: '620', embedding: [] },
      { name: '玩CS',           type: ShortcutCommandType.steam, value: '730', embedding: [] },
      { name: '玩dota2',        type: ShortcutCommandType.steam, value: '570', embedding: [] },
      { name: '玩GTA5',         type: ShortcutCommandType.steam, value: '271590', embedding: [] },
      { name: '玩蔚蓝',         type: ShortcutCommandType.steam, value: '504230', embedding: [] },
      { name: '玩黑神话悟空',    type: ShortcutCommandType.steam, value: '2358720', embedding: [] },
      { name: '玩动物井',       type: ShortcutCommandType.steam, value: '813230', embedding: [] },
    ];
    return commandList;
  }

  static init() {
    // 初始化快捷指令 如果default文件不存在 则写入默认值
    // 如果快捷指令文件不存在 则写入默认值
    // 非第一次使用情况直接读取这个文件
    const defaultCommandList = ShortcutCommandUtil.getDefaultCommandList();
    const defaultCommandPath = FilePath.appShortcutCommandFileDefault();
    const commandPath = FilePath.appShortcutCommandFile();
    if (fs.existsSync(defaultCommandPath) === false) {
      UserFileUtil.writeShortcutCommandFile(defaultCommandPath, defaultCommandList);
    }
    if (fs.existsSync(commandPath) === false) {
      UserFileUtil.writeShortcutCommandFile(commandPath, defaultCommandList);
    }

    // 读取快捷指令
    let commandList = UserFileUtil.readShortcutCommandFile(commandPath);
    return commandList;
  }

  static getCommandList() {
    const commandPath = FilePath.appShortcutCommandFile();
    let commandList = UserFileUtil.readShortcutCommandFile(commandPath);
    return commandList;
  }

  static updateCommandList(commandList: ShortcutCommand[]) {
    const commandPath = FilePath.appShortcutCommandFile();
    UserFileUtil.writeShortcutCommandFile(commandPath, commandList);
  }

  static command2op(command: ShortcutCommand) {
    let op: CommandOperator = new CommandOperator('unkown', '');
    if (command.type === ShortcutCommandType.url) {
      op = new ChromeUrlOperator(command.name, command.value);
    }
    else if (command.type === ShortcutCommandType.steam) {
      op = new SteamAppOperator(command.name, parseInt(command.value));
    }
    return op;
  }

  static commandList2opList(commandList: ShortcutCommand[]) {
    let opList: CommandOperator[] = [];
    for (let i = 0; i < commandList.length; i++) {
      let command = commandList[i];
      let op = ShortcutCommandUtil.command2op(command);
      opList.push(op);
    }
    return opList;
  }

  static getOpList() {
    let commandList = ShortcutCommandUtil.init();
    let opList = ShortcutCommandUtil.commandList2opList(commandList);
    return opList;
  }

}

// 理解需求和执行
export class ContextReasoner {
  // 操作列表和相似度计算
  opList: CommandOperator[] = [];
  opNameList: string[] = [];
  similarity: SentenceSimilarity = new SentenceSimilarity();
  embeddingMatix: math.Matrix = math.matrix();
  similarityThreshold: number = 0;

  // 搜索引擎
  opSearchList: ChromeSearchOperator[] = [];

  // 对文字进行操作
  textOperator: TextOprator = new TextOprator();

  // 返回结果
  result: string = '';

  setApiKey(key: string) {
    this.similarity.setApiKey(key);
  }

  async init(defaultSearchEngine: SearchEngine = SearchEngine.Bing, similarityThreshold: number = 0.6) {
    this.similarityThreshold = similarityThreshold;
    // 各种操作的集合
    this.opList = ShortcutCommandUtil.getOpList();

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

    // 文字操作
    this.textOperator.flagCopy = true;
    this.textOperator.flagPaste = false;
    this.textOperator.flagEnter = false;
    // this.textOperator.flagPaste = true;
    // this.textOperator.flagEnter = true;
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

    // 执行
    let executeResult = '';
    if (maxSimilarity > this.similarityThreshold) {
      executeResult = await op.execute();
      executeResult = `最相似（${(maxSimilarity * 100).toFixed(0)}%）：${op.name} 执行`;
    }
    else{
      executeResult = `最相似（${(maxSimilarity * 100).toFixed(0)}%）：${op.name} 不执行`;
    }
    // console.log(executeResult);
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
        // console.log(op.nameWithSearch, textSearch);
        await op.search(textSearch);
        flagSearch = true;

        this.result = `${op.nameWithSearch}`;
        break;
      }
    }

    return flagSearch;
  }

  async reason(text: string) {
    this.result = '';

    // 空字符串不处理
    if (text === '') {
      this.result = '空字符串 不处理';
    }
    else if (await this.isSearch(text)) {
      // isSearch 已经执行了搜索
    }
    else {
      this.result = await this.opSimilarity(text);
    }

    await this.textOperator.execute(text);

    return this.result;
  }
}

export class ComputerExecutor {
  flagInitSuccess: boolean = false;
  siliconflow: SiliconFlow = new SiliconFlow();
  reasoner: ContextReasoner;
  constructor() {
    this.reasoner = new ContextReasoner();
  }

  async initSiliconflowKey(key: string) {
    UserFileUtil.writeSiliconflowKey(key);
    this.init();
  }

  async getSiliconflowKey() {
    let key = UserFileUtil.readSiliconflowKey();
    return key;
  }

  async getSiliconflowBalance() {
    // 获取余额
    try {
      const [totalBalance, chargeBalance, balance] = await this.siliconflow.getBalance();
      const balanceStr = `总余额: ${totalBalance}, 充值余额: ${chargeBalance}, 赠送余额: ${balance}`;
      return balanceStr;
    }
    catch (error) {
      console.error('获取余额失败:', error);
      return '获取余额失败';
    }
  }

  async updateShortcutCommand(text: string) {
    // 更新快捷指令
    try {
      let commandList = JSON.parse(text);
      ShortcutCommandUtil.updateCommandList(commandList);
    }
    catch (error) {
      console.error('更新快捷指令失败:', error);
      return '更新快捷指令失败';
    }

    // 重新初始化
    this.reasoner.init();

    return '更新成功';
  }

  async getShortcutCommand() {
    // 获取快捷指令
    let commandList = ShortcutCommandUtil.getCommandList();
    return JSON.stringify(commandList);
  }

  async updateTextAutoProcess(text: string) {
    // 更新文字自动处理
    try {
      let textAutoProcess:TextAutoProcess = JSON.parse(text);
      this.reasoner.textOperator.init(textAutoProcess);
      // TODO
    }
    catch (error) {
      console.error('更新文字自动处理失败:', error);
      return '更新文字自动处理失败';
    }

    return '更新成功';
  }

  async openUrl(url: string) {
    // 打开网页
    let result = '';
    try {
      const op = new ChromeUrlOperator('打开网页', url);
      await op.execute();
      result = '打开网页成功';
    }
    catch (error) {
      console.error('打开网页失败:', error);
      result = '打开网页失败';
    }
    return result;
  }

  async init() {
    // 读取key
    let key = '';
    try {
      key = UserFileUtil.readSiliconflowKey();
      this.siliconflow = new SiliconFlow();
      this.siliconflow.setApiKey(key);
      const [totalBalance, chargeBalance, balance] = await this.siliconflow.getBalance();
      console.log('key ok. balance:', totalBalance);
    }
    catch (error) {
      console.error('读取key失败:', error);
      return;
    }

    // 推理单元初始化
    this.reasoner.setApiKey(key);
    await this.reasoner.init();

    this.flagInitSuccess = true;
  }

  async executeAudio(audioData: Buffer) {
    if (!this.flagInitSuccess) {
      console.error('未初始化，请检查输入key。');
      return;
    }
    // debug 
    // const audioPath ='./audio.wav';
    // await fs.promises.writeFile(audioPath, audioData);

    // 语音识别
    const textResult = await this.siliconflow.speechWavToText(audioData);

    // 判断需求并执行
    const reasonResult = await this.reasoner.reason(textResult);

    const result = `${textResult}\n${reasonResult}`;
    console.log(result);
    return result;
  }

  async executeText(text: string) {
    // 判断需求并执行
    await this.reasoner.reason(text);
  }

  
  async log() {
  }
}


/**
 * 计算机操作测试类
 * 用于测试 ContextReasoner 和 SentenceSimilarity 的功能
 */
class ComputerTest {
  /**
   * 测试上下文推理器功能
   */
  static async testContextReasoner() {
    console.log('=== 测试上下文推理器 ===');
    let reasoner = new ContextReasoner();
    await reasoner.init();
    
    // 测试网站访问
    // await reasoner.reason('给鲸鱼发消息');
    
    // 测试搜索功能
    await reasoner.reason('知乎搜索typescript');
    
    // 测试steam启动游戏
    // await reasoner.reason('玩传送门');
  }

  /**
   * 测试文本相似度功能
   */
  static async testSentenceSimilarity() {
    console.log('=== 测试文本相似度 ===');
    const ss = new SentenceSimilarity();

    // 文字embedding测试
    const textList = ['苹果', '梨', '香蕉', '橘子'];
    console.log(`初始化文本列表: ${textList.join(', ')}`);
    await ss.initFromSentenceList(textList);
    
    // 测试相似度计算
    const testText = '苹果';
    console.log(`测试文本: ${testText}`);
    let similarityMatrix = await ss.similarity(testText);
    console.log('相似度矩阵结果:');
    console.log(similarityMatrix);
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
  // 测试
  await ComputerTest.testContextReasoner();
}
