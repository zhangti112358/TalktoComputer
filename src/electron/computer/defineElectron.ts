import * as os from 'os';
import * as path from 'path';
import fs from 'fs';

import { APP_NAME, ShortcutCommand } from './define.js';

// 电脑系统路径
export class SystemPathUtil {
  static getDocumentsPath() {
    return path.join(os.homedir(), 'Documents');
  }
  static getDesktopPath() {
    return path.join(os.homedir(), 'Desktop');
  }
  static getDownloadsPath() {
    return path.join(os.homedir(), 'Downloads');
  }
}


// 此程序使用的文件路径
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
  
      // 放在computer文件夹 appName/computer
      const dir_computer = path.join(dir, 'computer');
      return dir_computer;
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
  
    // app shortcut
    static appShortcutDir(): string {
      return path.join(this.appDir(), 'shortcut');
    }
  
    static appShortcutCommandFile(): string {
      return path.join(this.appShortcutDir(), 'shortcut.json');         // 用户调整后的快捷指令
    }
    static appShortcutCommandFileDefault(): string {
      return path.join(this.appShortcutDir(), 'shortcut_default.json'); // 默认快捷指令
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
  
    static readShortcutCommandFile(filePath:string): ShortcutCommand[] {
      let commands: ShortcutCommand[] = [];
      // 读取json文件
      const data = fs.readFileSync(filePath, 'utf-8');
      const dataJson = JSON.parse(data);
      commands = dataJson;
      return commands;
    }
  
    static writeShortcutCommandFile(filePath:string, commands: ShortcutCommand[]) {
      // 确保目录存在
      const dirPath = path.dirname(filePath);
      fs.mkdirSync(dirPath, { recursive: true });
  
      fs.writeFileSync(filePath, JSON.stringify(commands, null, 2), 'utf-8');
    }
  
  }