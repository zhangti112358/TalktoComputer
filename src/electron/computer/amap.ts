/*
高德地图API使用
*/

import * as fs from 'fs';
import * as url from 'url';

function amapKey(){
  // data\tmp\key.json
  const data = fs.readFileSync('data/tmp/key.json', 'utf8');
  const json = JSON.parse(data);
  return json.amap;
}

export class Amap {
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 地理/逆地理编码
  /*
  地理编码
  地理编码 API 服务地址
  URL

  请求方式

  https://restapi.amap.com/v3/geocode/geo?parameters

  GET

  parameters 代表的参数包括必填参数和可选参数。所有参数均使用和号字符(&)进行分隔。下面的列表枚举了这些参数及其使用规则。
  请求参数
  参数名

  含义

  规则说明

  是否必须

  缺省值

  key

  高德Key

  用户在高德地图官网 申请 Web 服务 API 类型 Key

  必填

  无

  address

  结构化地址信息

  规则遵循：国家、省份、城市、区县、城镇、乡村、街道、门牌号码、屋邨、大厦，如：北京市朝阳区阜通东大街6号。

  必填

  无

  city

  指定查询的城市

  可选输入内容包括：指定城市的中文（如北京）、指定城市的中文全拼（beijing）、citycode（010）、adcode（110000），不支持县级市。当指定城市查询内容为空时，会进行全国范围内的地址转换检索。

  adcode 信息可参考 城市编码表 获取

  可选

  无，会进行全国范围内搜索

  sig

  数字签名

  请参考 数字签名获取和使用方法

  可选

  无

  output

  返回数据格式类型

  可选输入内容包括：JSON，XML。设置 JSON 返回结果数据将会以 JSON 结构构成；如果设置 XML 返回结果数据将以 XML 结构构成。

  可选

  JSON

  callback

  回调函数

  callback 值是用户定义的函数名称，此参数只在 output 参数设置为 JSON 时有效。

  可选

  无

  返回结果参数说明
  响应结果的格式可以通过请求参数 output 指定，默认为 JSON 形式。

  以下是返回参数说明：

  名称

  含义

  规则说明

  status

  返回结果状态值

  返回值为 0 或 1，0 表示请求失败；1 表示请求成功。

  count

  返回结果数目

  返回结果的个数。

  info

  返回状态说明

  当 status 为 0 时，info 会返回具体错误原因，否则返回“OK”。详情可以参阅 info 状态表

  geocodes

  地理编码信息列表

  结果对象列表，包括下述字段：


  country

  国家

  国内地址默认返回中国

  province

  地址所在的省份名

  例如：北京市。此处需要注意的是，中国的四大直辖市也算作省级单位。

  city

  地址所在的城市名

  例如：北京市

  citycode

  城市编码

  例如：010

  district

  地址所在的区

  例如：朝阳区

  street

  街道

  例如：阜通东大街

  number

  门牌

  例如：6号

  adcode

  区域编码

  例如：110101

  location

  坐标点

  经度，纬度

  level

  匹配级别

  参见下方的地理编码匹配级别列表


  提示
  部分返回值当返回值存在时，将以字符串类型返回；当返回值不存在时，则以数组类型返回。

  服务示例
  https://restapi.amap.com/v3/geocode/geo?address=北京市朝阳区阜通东大街6号&output=XML&key=<用户的key>
  参数

  值

  备注

  必选

  address

  北京市朝阳区阜通东大街6号
  填写结构化地址信息:省份＋城市＋区县＋城镇＋乡村＋街道＋门牌号码

  是

  city

  北京
  查询城市，可选：城市中文、中文全拼、citycode、adcode

  否

  运行
  示例说明
  address 是需要获取坐标的结构化地址，output（XML）用于指定返回数据的格式，Key 是用户请求数据的身份标识，详细可以参考上方的请求参数说明。
  */
  async geocode(address: string, city: string = ''): Promise<any> {
    // 构建请求URL
    const params = new URLSearchParams({
      key: this.apiKey,
      address: address,
    });
    if (city) {
      params.append('city', city);
    }
    const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;
    
    // 发送请求
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap geocode HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }
}

class AmapTest {
  async test() {
    const amap = new Amap();
    amap.setApiKey(amapKey());
    const result = await amap.geocode('北京市朝阳区阜通东大街6号');
    console.log(result);
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
  const test = new AmapTest();
  test.test();
}
