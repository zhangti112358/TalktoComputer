import * as os from 'os';
import * as path from 'path';

// 程序名
export const APP_NAME = 'TalktoComputer';

// 快捷键
export const VOICE_INPUT_SHORTCUT = 'F4';

// 语音录制
export const WAV_SAMPLE_RATE = 16000;
export const WAV_BITS_PER_SAMPLE = 16;
export const WAV_CHANNELS = 1;

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