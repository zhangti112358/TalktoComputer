import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const DOUBAO_ASR_FLASH_URL =
  'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash'

type RecognizeResult = {
  audio_info?: {
    duration?: number
  }
  result?: {
    text?: string
    utterances?: Array<{
      start_time: number
      end_time: number
      text: string
      words?: Array<{
        text: string
        start_time: number
        end_time: number
        confidence: number
      }>
    }>
  }
}

function toBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

/**
 * 新版控制台：本地音频文件 -> 极速版识别
 * 需要环境变量：
 * - DOUBAO_API_KEY=你的X-Api-Key
 * - DOUBAO_UID=可选，业务侧自定义用户ID
 */
export async function recognizeFlashFromFile(filePath: string): Promise<RecognizeResult> {
  const apiKey = process.env.DOUBAO_API_KEY
  const uid = process.env.DOUBAO_UID ?? 'demo-user'

  if (!apiKey) {
    throw new Error('缺少环境变量 DOUBAO_API_KEY')
  }

  const audioBuffer = await readFile(filePath)
  const requestId = randomUUID()

  const body = {
    user: {
      uid,
    },
    audio: {
      data: toBase64(audioBuffer),
    },
    request: {
      model_name: 'bigmodel',
    },
  }

  const response = await fetch(DOUBAO_ASR_FLASH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Api-Resource-Id': 'volc.bigasr.auc_turbo',
      'X-Api-Request-Id': requestId,
      'X-Api-Sequence': '-1',
    },
    body: JSON.stringify(body),
  })

  const apiStatusCode = response.headers.get('X-Api-Status-Code')
  const apiMessage = response.headers.get('X-Api-Message')
  const logId = response.headers.get('X-Tt-Logid')

  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText}, X-Api-Status-Code=${apiStatusCode}, X-Api-Message=${apiMessage}, X-Tt-Logid=${logId}, body=${text}`,
    )
  }

  const data = JSON.parse(text) as RecognizeResult

  console.log('X-Api-Status-Code:', apiStatusCode)
  console.log('X-Api-Message:', apiMessage)
  console.log('X-Tt-Logid:', logId)
  console.log('识别文本:', data.result?.text ?? '')

  return data
}

/**
 * 新版控制台：音频URL -> 极速版识别
 */
export async function recognizeFlashFromUrl(audioUrl: string): Promise<RecognizeResult> {
  const apiKey = process.env.DOUBAO_API_KEY
  const uid = process.env.DOUBAO_UID ?? 'demo-user'

  if (!apiKey) {
    throw new Error('缺少环境变量 DOUBAO_API_KEY')
  }

  const requestId = randomUUID()

  const body = {
    user: {
      uid,
    },
    audio: {
      url: audioUrl,
    },
    request: {
      model_name: 'bigmodel',
    },
  }

  const response = await fetch(DOUBAO_ASR_FLASH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Api-Resource-Id': 'volc.bigasr.auc_turbo',
      'X-Api-Request-Id': requestId,
      'X-Api-Sequence': '-1',
    },
    body: JSON.stringify(body),
  })

  const apiStatusCode = response.headers.get('X-Api-Status-Code')
  const apiMessage = response.headers.get('X-Api-Message')
  const logId = response.headers.get('X-Tt-Logid')

  const text = await response.text()

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText}, X-Api-Status-Code=${apiStatusCode}, X-Api-Message=${apiMessage}, X-Tt-Logid=${logId}, body=${text}`,
    )
  }

  const data = JSON.parse(text) as RecognizeResult

  console.log('X-Api-Status-Code:', apiStatusCode)
  console.log('X-Api-Message:', apiMessage)
  console.log('X-Tt-Logid:', logId)
  console.log('识别文本:', data.result?.text ?? '')

  return data
}

// 本地调试示例
async function main() {
  // 方式1：识别本地文件
  await recognizeFlashFromFile('C:\\Users\\zhangti\\Documents\\GitHub\\TalktoComputer\\output.mp3')

  // 方式2：识别公网URL
  // await recognizeFlashFromUrl('https://example.com/test.wav')
}

if (require.main === module) {
  main().catch((error) => {
    console.error('调用失败:', error)
    process.exit(1)
  })
}