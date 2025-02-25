import url from 'url';
import { exec, spawn } from 'child_process';

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

// 执行系统命令 操作其他软件
export class SystemExec {

  // 打开网页
  async chromeUrl(url:string) {
    return await executeCommand(`start chrome ${url}`);
  }

  // 搜索
  async chromeBingSearch(keyword:string) {
    return await this.chromeUrl(`https://cn.bing.com/search?q=${keyword}`);
  }
  async chromeGoogleSearch(keyword:string) {
    return await this.chromeUrl(`https://www.google.com/search?q=${keyword}`);
  }
  async chromeZhihuSearch(keyword:string) {
    return await this.chromeUrl(`https://www.zhihu.com/search?q=${keyword}&type=content`);
  }
  async chromeBilibiliSearch(keyword:string) {
    return await this.chromeUrl(`https://search.bilibili.com/all?keyword=${keyword}`);
  }
}

// Steam 操作
export class SteamExec {
  async runApp(appId:string) {
    return await executeCommand(`start steam://rungameid/${appId}`);
  }

  async runDota2(){
    return await this.runApp('570');
  }
  async runPortal2(){
    return await this.runApp('620');
  }
  async runCS2(){
    return await this.runApp('730');
  }
  async runOBS(){
    return await this.runApp('1905180');
  }
  async runCeleste(){
    return await this.runApp('504230');
  }
  async runAnimalWell(){
    return await this.runApp('813230');
  }
  async runBalatro(){
    return await this.runApp('2379780');
  }
  async runWukong(){
    return await this.runApp('2358720');
  }
  async runGTA5(){
    return await this.runApp('271590');
  }
}

// 使用示例:
async function main() {
  try {
    // const systemExec = new SystemExec();
    // await systemExec.chromeUrl('cn.bing.com');
    // await systemExec.chromeBingSearch('苹果');

    const steamExec = new SteamExec();
    await steamExec.runPortal2();

    // Windows 示例
    // const result = await executeCommand('dir');
    // console.log(result);
    
    // macOS/Linux 示例
    // const unixResult = await executeCommand('ls -la');
    // console.log(unixResult);
  } catch (error) {
    console.error('执行命令失败:', error);
  }
}


if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  main();
}