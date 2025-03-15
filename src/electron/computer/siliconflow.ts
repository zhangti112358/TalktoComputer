/*
* 代码生成说明
* 代码中要包含详细的注释
*/

/*
这是一个调用SiliconFlow模型服务器的类
官网的api调用说明如下
# 文本系列
## 创建文本对话请求
### 输入
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"Qwen/QVQ-72B-Preview","messages":[{"role":"user","content":[{"type":"image_url","image_url":{"url":"https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/dog.png","detail":"auto"}}]}],"stream":false,"max_tokens":512,"stop":["null"],"temperature":0.7,"top_p":0.7,"top_k":50,"frequency_penalty":0.5,"n":1,"response_format":{"type":"text"}}'
};

fetch('https://api.siliconflow.cn/v1/chat/completions', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{
  "id": "<string>",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "<string>"
      },
      "finish_reason": "stop"
    }
  ],
  "tool_calls": [
    {
      "id": "<string>",
      "type": "function",
      "function": {
        "name": "<string>",
        "arguments": "<string>"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 123,
    "total_tokens": 123
  },
  "created": 123,
  "model": "<string>",
  "object": "chat.completion"
}
### 400
{
  "code": 20012,
  "message": "<string>",
  "data": "<string>"
}
### 401
"Invalid token"
### 404
"404 page not found"
### 429
{
  "message": "Request was rejected due to rate limiting. If you want more, please contact contact@siliconflow.cn. Details:TPM limit reached.",
  "data": "<string>"
}
### 503
{
  "code": 50505,
  "message": "Model service overloaded. Please try again later.",
  "data": "<string>"
}
### 504
"<string>"

## 嵌入
### 输入
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"BAAI/bge-large-zh-v1.5","input":"硅基流动embedding上线，多快好省的 embedding 服务，快来试试吧","encoding_format":"float"}'
};

fetch('https://api.siliconflow.cn/v1/embeddings', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{
  "model": "<string>",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        123
      ],
      "index": 123
    }
  ],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 123,
    "total_tokens": 123
  }
}

## 重排序
### 输入
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"BAAI/bge-reranker-v2-m3","query":"Apple","documents":["苹果","香蕉","水果","蔬菜"],"top_n":4,"return_documents":false,"max_chunks_per_doc":1024,"overlap_tokens":80}'
};

fetch('https://api.siliconflow.cn/v1/rerank', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{
  "id": "<string>",
  "results": [
    {
      "document": {
        "text": "<string>"
      },
      "index": 123,
      "relevance_score": 123
    }
  ],
  "tokens": {
    "input_tokens": 123,
    "output_tokens": 123
  }
}

## 语音转文本
### 输入
const form = new FormData();
form.append("file", "");
form.append("model", "FunAudioLLM/SenseVoiceSmall");

const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer ', 'Content-Type': 'multipart/form-data'}
};

options.body = form;

fetch('https://api.siliconflow.cn/v1/audio/transcriptions', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{"text":""}

## 文本转语音
### 输入
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"fishaudio/fish-speech-1.5","input":"The text to generate audio for","voice":"fishaudio/fish-speech-1.5:alex","response_format":"mp3","sample_rate":32000,"stream":true,"speed":1,"gain":0}'
};

fetch('https://api.siliconflow.cn/v1/audio/speech', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));

# 平台
## 获取用户模型列表
### 输入
const options = {method: 'GET', headers: {Authorization: 'Bearer <token>'}};

fetch('https://api.siliconflow.cn/v1/models', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{
  "object": "list",
  "data": [
    {
      "id": "stabilityai/stable-diffusion-xl-base-1.0",
      "object": "model",
      "created": 0,
      "owned_by": ""
    }
  ]
}
## 获取用户账户信息
### 输入
const options = {method: 'GET', headers: {Authorization: 'Bearer <token>'}};

fetch('https://api.siliconflow.cn/v1/user/info', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
### 返回结果 200
{
  "code": 20000,
  "message": "OK",
  "status": true,
  "data": {
    "id": "userid",
    "name": "username",
    "image": "user_avatar_image_url",
    "email": "user_email_address",
    "isAdmin": false,
    "balance": "0.88",
    "status": "normal",
    "introduction": "user_introduction",
    "role": "user_role",
    "chargeBalance": "88.00",
    "totalBalance": "88.88"
  }
}
*/

import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import { UserFileUtil } from './defineElectron.js';

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveMp3FromStream(response: Response, filePath: string) {
  // 从流中读取所有数据并保存到文件
  try {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to get reader from stream');

    const chunks: Uint8Array[] = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // 合并所有块
    const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    // 使用 fs 模块保存文件
    await fs.promises.writeFile(filePath, allChunks);
    console.log(`File saved to: ${filePath}`);

  } catch (error) {
    console.error('Error saving MP3:', error);
    throw error;
  }
}

// api调用类
export class SiliconFlow {
  private apiUrl: string = 'https://api.siliconflow.cn/v1';
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 获取用户账户信息
  async getUserInfo() {
    try {
      const options = {method: 'GET', headers: {Authorization: `Bearer ${this.apiKey}`}};
      const response = await fetch(`${this.apiUrl}/user/info`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      try {
          return JSON.parse(text);
        } catch (e) {
          console.error('JSON Parse Error:', text);
          throw e;
        }
    } catch (error) {
      console.error(error);
      throw error;
    }

  }

  // 获取余额
  async getBalance() {
    const userInfo = await this.getUserInfo();
    const totalBalance = userInfo['data']['totalBalance'];    // 总余额
    const chargeBalance = userInfo['data']['chargeBalance'];  // 充值余额
    const balance = userInfo['data']['balance'];              // 赠送余额
    return [totalBalance, chargeBalance, balance];
  }

  // 获取用户模型列表
  async getModels() {
    try {
      const options = {method: 'GET', headers: {Authorization: `Bearer ${this.apiKey}`}};
      const response = await fetch(`${this.apiUrl}/models`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      try {
          return JSON.parse(text);
        } catch (e) {
          console.error('JSON Parse Error:', text);
          throw e;
        }
    } catch (error) {
      console.error(error);
      throw error;
    }

  }

  // 文本转向量
  async embedding(text: string): Promise<number[]> {
    // 空字符串抛出异常 注：空字符串siliconflow会返回错误400
    if (text === '') {
      throw new Error('embedding Empty text');
    }
    try {
      const body = {
        model: 'BAAI/bge-large-zh-v1.5',
        input: text,
        encoding_format: 'float'
      }
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };
      
      const response = await fetch(`${this.apiUrl}/embeddings`, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const response_json = await response.json();
      // console.log(response_json);
      return response_json['data'][0]['embedding'];
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }

  // 文本转语音
  async textToSpeechFile(text: string, filePath: string) {
    try {
      const body = {
        model: 'fishaudio/fish-speech-1.5',
        input: text,
        voice: 'fishaudio/fish-speech-1.5:alex',
        response_format: 'mp3',
        sample_rate: 32000,
        stream: false,
        speed: 1,
        gain: 0
      }
      const options = {
        method: 'POST',
        headers: {Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      };
      
      const response = await fetch('https://api.siliconflow.cn/v1/audio/speech', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await saveMp3FromStream(response, filePath);
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }

  // 语音转文本 输入文件路径 mp3格式
  async speechMp3ToText(audioFile: string) {
    try {
      const fileData = await fs.promises.readFile(audioFile);
      const audioBlob = new Blob([fileData], { type: 'audio/mpeg' });
      const file = new File(
        [audioBlob], 
        "hello.mp3",
        { 
          type: "audio/mpeg",
        }
      );
      
      const form = new FormData();
      form.append("file", file);
      form.append("model", "FunAudioLLM/SenseVoiceSmall");

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // 'Content-Type': 'multipart/form-data' // 这里不能设置Content-Type，否则会报错
          // body是FormData时，header自动设置
        },
        body: form
      };

      
      const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const response_json = await response.json();
      // console.log(response_json);
      return response_json['text'];
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }

  // 语音转文本 输入音频数据 wav格式
  async speechWavToText(audioData: Buffer) {
    try {
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      const file = new File(
        [audioBlob], 
        "hello.wav",
        { 
          type: "audio/wav",
        }
      );
      
      const form = new FormData();
      form.append("file", file);
      form.append("model", "FunAudioLLM/SenseVoiceSmall");

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // 'Content-Type': 'multipart/form-data' // 这里不能设置Content-Type，否则会报错
          // body是FormData时，header自动设置
        },
        body: form
      };

      
      const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const response_json = await response.json();
      // console.log(response_json);
      return response_json['text'];
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }

}


// export function SiliconFlowKeyDefault(): string {
//   /*
//   从json中读取key
//   './user_root/key.json'
//   {
//     "siliconflow": {
//       "key": "sk-"
//     }
//   }
//   */
//   const keyFile = fs.readFileSync('./user_dir/key.json', 'utf-8');
//   const key = JSON.parse(keyFile).siliconflow.key;
//   return key;
// }

// 测试类
export class SiliconFlowTest {
  private siliconflow: SiliconFlow;
  constructor(key: string) {
    this.siliconflow = new SiliconFlow();
    this.siliconflow.setApiKey(key);
  }

  async testBasic() {
    // 获取用户账户信息
    const userInfo = await this.siliconflow.getUserInfo();
    // console.log(userInfo);
    // 获取余额
    const [totalBalance, chargeBalance, balance] = await this.siliconflow.getBalance();
    console.log(`总余额: ${totalBalance}, 充值余额: ${chargeBalance}, 赠送余额: ${balance}`);

    // 获取用户模型列表
    const models = await this.siliconflow.getModels();
    console.log(models);

    // 文本转语音
    const text_in = '你好。';
    const audioFile = './output.mp3';
    await this.siliconflow.textToSpeechFile(text_in, audioFile);

    // 语音转文本 把上面生成的音频文件作为输入
    const text_out = await this.siliconflow.speechMp3ToText(audioFile);
    console.log(text_out);
  }

  async testWav2Text() {
    // 语音转文本
    const audioFile = './audio.wav';
    const fileData = await fs.promises.readFile(audioFile);
    const text_out = await this.siliconflow.speechWavToText(fileData);
    console.log(text_out);
  }

  async test(){
    // 测试文本转向量
    const text = '你好。';
    // const text = '';
    const embedding = await this.siliconflow.embedding(text);
    console.log(embedding);
  }

}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  // 测试SiliconFlow
  // 输入key
  const key = UserFileUtil.readSiliconflowKey();

  // 测试
  const test = new SiliconFlowTest(key);
  await test.testBasic();
  // await test.test();
  // await test.testWav2Text();
}
