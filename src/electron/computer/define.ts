import * as os from 'os';
import * as path from 'path';
import fs from 'fs';

// 程序名
export const APP_NAME = 'TalktoComputer';

// 快捷键
export const VOICE_INPUT_SHORTCUT = 'F4';

// 语音录制
export const WAV_SAMPLE_RATE = 16000;
export const WAV_BITS_PER_SAMPLE = 16;
export const WAV_CHANNELS = 1;

// 文本发送类型
export enum sendTextType {
  siliconflowKey = 'siliconflowKey',
  getSiliconflowBalance = 'getSiliconflowBalance',
  getSiliconflowKey = 'getSiliconflowKey',
}

// 程序使用的文件路径
export class FilePath {

  // 文档路径
  static rootDir(): string {
    // 根据操作系统构造相似路径
    let dir = '';
    const homeDir = os.homedir();
    const appName = APP_NAME;
    if (process.platform === 'win32') {
      // Windows: %APPDATA%\YourAppName
      dir = path.join(homeDir, 'AppData', 'Roaming', appName);
    } else if (process.platform === 'darwin') {
      // macOS: ~/Library/Application Support/YourAppName
      dir = path.join(homeDir, 'Library', 'Application Support', appName);
    } else {
      // Linux: ~/.config/YourAppName
      dir = path.join(homeDir, '.config', appName);
    }
    return dir;
  }

  // system
  static systemDir(): string {
    return path.join(this.rootDir(), 'system');
  }

  // key
  static keyFile(): string {
    return path.join(this.systemDir(), 'key.json');
  }
  
  // app
  static appDir(): string {
    return path.join(this.rootDir(), 'app');
  }
}

// 用户文件操作
export class UserFileUtil {
  static isKeyFileExist(): boolean {
    return fs.existsSync(FilePath.keyFile());
  }

  /*
  从json中读取key
  'key.json'
  {
    "siliconflow": {
      "key": "sk-"
    }
  }
  */
  static writeSiliconflowKey(key:string){
    // 确保目录存在
    const dirPath = FilePath.systemDir();
    fs.mkdirSync(dirPath, { recursive: true });
    
    // 如果文件存在 直接写入 如果不存在 创建文件
    const filePath = FilePath.keyFile();
    console.log('writeSiliconflowKey', filePath);
    if (fs.existsSync(filePath)) {
      // 读取json文件
      const data = fs.readFileSync(filePath, 'utf-8');
      const dataJson = JSON.parse(data);
      dataJson.siliconflow.key = key;
      fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2), 'utf-8');
    }
    else {
      const dataJson = {
        siliconflow: {
          key: key
        }
      };
      fs.writeFileSync(filePath, JSON.stringify(dataJson, null, 2), 'utf-8');
    }
  }

  static readSiliconflowKey(): string {
    let key: string = '';
    const filePath = FilePath.keyFile();
    if (fs.existsSync(filePath)) {
      // 读取json文件
      const data = fs.readFileSync(filePath, 'utf-8');
      const dataJson = JSON.parse(data);
      key = dataJson.siliconflow.key;
    }
    else {
      throw new Error('key.json not exist');
    }
    return key;
  }
}