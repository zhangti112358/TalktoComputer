/*
高德地图API使用
*/

import * as fs from 'fs';
import * as url from 'url';

export function amapKey(){
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

  // 地理编码/逆地理编码（REST）
  // 接口：GET https://restapi.amap.com/v3/geocode/geo
  // 必填：key, address
  // 可选：city（中文/拼音/citycode/adcode）、sig、output（JSON|XML，默认JSON）、callback（仅JSON）
  // 返回：status(0|1)、count、info、geocodes[ { country, province, city, citycode, district, street, number, adcode, location(经度,纬度), level } ]
  // 示例：address=北京市朝阳区阜通东大街6号&city=北京&key=YOUR_KEY
  async geocode(address: string, city: string = ''): Promise<any> {
    const params = new URLSearchParams({
      key: this.apiKey,
      address: address,
    });
    if (city) {
      params.append('city', city);
    }
    const url = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap geocode HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }

  // 逆地理编码（REST）接口说明
  // 接口：GET https://restapi.amap.com/v3/geocode/regeo
  // 必填：key、location（经度在前，纬度在后，最多6位小数）
  // 可选：extensions（base: 基础信息，all: 包含 POI/路网/路口）、radius（0~3000m）、poitype、roadlevel、sig、output（默认JSON）、callback、homeorcorp
  // 返回：status、info、infocode、regeocode 对象。regeocode 包含 addressComponent（country/province/city/citycode/district/adcode/township/towncode）、建物、街道号、businessAreas、roads、roadinters、pois、aois 等丰富结构。
  // 可通过 extensions=all 获取道路、路口、POI 与 AOI 详情，homeorcorp 可优化 POI 顺序，roadlevel 可控制主干道过滤。
  async regeo(location: string, extensions: string = 'base'): Promise<any> {
    const params = new URLSearchParams({
      key: this.apiKey,
      location: location,
      extensions: extensions,
    });
    const url = `https://restapi.amap.com/v3/geocode/regeo?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap regeo HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }

  // 

  // 路径规划2.0
  // 驾车路线规划（REST）
  // 接口：GET https://restapi.amap.com/v5/direction/driving
  // 必填参数：
  // - key: 高德 Key（需在高德地图官网申请 Web 服务 API 类型 Key）
  // - origin: 起点经纬度（经度在前，纬度在后，逗号分隔；小数点后不超过6位），示例：116.481028,39.989643
  // - destination: 目的地经纬度（经度在前，纬度在后，逗号分隔；小数点后不超过6位），示例：116.434446,39.90816
  //
  // 可选参数：
  // - destination_type: 终点的 POI 类别（当用户知道终点 POI 类别时建议填充，可提升准确性）
  // - origin_id: 起点 POI ID（起点为 POI 时建议填充，可提升准确性）
  // - destination_id: 目的地 POI ID（目的地为 POI 时建议填充，可提升准确性）
  // - strategy: 驾车算路策略（默认 32）
  //     0：速度优先（仅一条路线，可能不是最短距离）
  //     1：费用优先（仅一条路线，不走收费路段，且耗时最少）
  //     2：常规最快（仅一条路线，综合距离/耗时）
  //     32：默认，高德推荐（同高德地图APP默认）
  //     33：躲避拥堵
  //     34：高速优先
  //     35：不走高速
  //     36：少收费
  //     37：大路优先
  //     38：速度最快
  //     39：躲避拥堵＋高速优先
  //     40：躲避拥堵＋不走高速
  //     41：躲避拥堵＋少收费
  //     42：少收费＋不走高速
  //     43：躲避拥堵＋少收费＋不走高速
  //     44：躲避拥堵＋大路优先
  //     45：躲避拥堵＋速度最快
  // - waypoints: 途经点坐标串（按顺序以英文分号“;”分隔，默认支持1个，最多16个）
  //     示例：lng1,lat1;lng2,lat2;...
  // - avoidpolygons: 避让区域（每个区域最多16个顶点；多个区域以“|”分隔；最大支持32个区域；每个区域不超过81平方公里）
  //     示例：lng1,lat1;lng2,lat2;lng3,lat3|lng4,lat4;lng5,lat5;...
  // - plate: 车牌号码（如“京AHA322”，支持6位传统与7位新能源，用于限行判断）
  // - cartype: 车辆类型（默认 0）
  //     0：普通燃油汽车
  //     1：纯电动汽车
  //     2：插电式混动汽车
  // - ferry: 是否使用轮渡（默认 0）
  //     0：使用渡轮
  //     1：不使用渡轮
  // - show_fields: 返回结果控制（逗号分隔的字段筛选；未设置仅返回基础信息类字段）
  // - sig: 数字签名（参见数字签名获取和使用方法）
  // - output: 返回格式类型（可选值：JSON；默认 json）
  // - callback: 回调函数名（仅在 output=JSON 时有效）
  //
  // 返回结果：参考官方文档（可依据 show_fields 控制可选字段返回）
  //
  // 返回结果字段说明（driving v5）：
  // 顶层：
  // - status: string，本次 API 访问状态；成功为 "1"，失败为 "0"
  // - info: string，访问状态说明；成功为 "ok"，失败为具体错误原因（见错误码说明）
  // - infocode: string，返回码；"10000" 代表正确（见 info 状态表）
  // - count: string，路径规划方案总数
  // - route: object，规划方案集合
  //
  // route 对象：
  // - origin: string，起点经纬度（lng,lat）
  // - destination: string，终点经纬度（lng,lat）
  // - taxi_cost: string，预计出租车费用（单位：元）
  // - paths: 算路方案详情（列表/对象集合）
  //
  // paths（每条方案）：
  // - distance: string，方案总距离（单位：米）
  // - restriction: string，限行规避标记；"0" 表示已规避或未限行，"1" 表示存在无法规避的限行路段
  // - steps: 路线分段（列表）
  //
  // steps（每个分段）：
  // - instruction: string，行驶指示（导航语句）
  // - orientation: string，进入道路方向
  // - road_name: string，分段道路名称
  // - step_distance: string，分段距离（单位：米）
  // - step_time: string，分段时间（单位：秒）
  // - action: string，动作指令（如：左转、右转、直行等）
  // - traffic_lights: string，交通信号灯状态（如：绿灯、红灯等）
  // - tolls: string，途经收费站信息
  // - areas: 途经区域信息
  // - pois: 途经的兴趣点信息
  // - distance_to_next: string，驶入下一分段的距离（单位：米）
  // - time_to_next: string，驶入下一分段的时间（单位：秒）
  // - action_to_next: string，驶入下一分段的动作指令
  // - traffic_lights_to_next: string，驶入下一分段的交通信号灯状态
  // - tolls_to_next: string，驶入下一分段的途经收费站信息
  // - areas_to_next: string，驶入下一分段的途经区域信息
  // - pois_to_next: string，驶入下一分段的途经兴趣点信息
  //
  // 注意：以下字段需设置 show_fields 后才会出现在响应中（可使用逗号组合多个，如 show_fields=cost,tmcs,navi,cities,polyline）：
  //
  // show_fields: string，可选差异化结果返回，用于选择返回以下可选字段类
  //
  // cost（对象）：设置后返回方案时间与费用相关信息
  // - duration: string，线路耗时（单位：秒），包含各 step 的耗时
  // - tolls: string，此路线道路收费（单位：元），包含分段信息
  // - toll_distance: string，收费路段里程（单位：米），包含分段信息
  // - toll_road: string，主要收费道路
  // - traffic_lights: string，方案中红绿灯个数（单位：个）
  //
  // tmcs（对象）：设置后返回分段路况详情
  // - tmc_status: string，路况信息（未知/畅通/缓行/拥堵/严重拥堵）
  // - tmc_distance: string，从当前坐标点开始在该 step 中相同路况的距离
  // - tmc_polyline: string，此段路况涉及的道路坐标点串，点间用“,”分隔
  //
  // navi（对象）：设置后返回详细导航动作指令
  // - action: string，导航主要动作指令
  // - assistant_action: string，导航辅助动作指令
  //
  // cities（对象）：设置后返回分段途径城市信息
  // - adcode: string，途径区域编码
  // - citycode: string，途径城市编码
  // - city: string，途径城市名称
  // - district（对象）：途径区县信息
  //     - name: string，途径区县名称
  //     - adcode: string，途径区县 adcode
  //
  // polyline: string，设置后返回分路段坐标点串，两点间用“;”分隔
  //
  async directionDriving(origin: string, destination: string, destination_id?: string, raw_output?: boolean) {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
    });
    if (destination_id) {
      params.append('destination_id', destination_id);
    }

    const url = `https://restapi.amap.com/v5/direction/driving?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap directionDriving HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPaths = data?.route?.paths ?? [];
    return {
      status: data?.status,
      info: data?.info,
      infocode: data?.infocode,
      route: {
        origin: data?.route?.origin,
        destination: data?.route?.destination,
        taxi_cost: data?.route?.taxi_cost,
        paths: simplifiedPaths.map((path: any) => ({
          distance: path.distance,
          duration: path.duration,
          restriction: path.restriction,
          steps: Array.isArray(path.steps)
            ? path.steps.map((step: any) => ({
                instruction: step.instruction,
                road_name: step.road_name,
                step_distance: step.step_distance,
                step_time: step.step_time,
              }))
            : [],
        })),
      },
    };
  }

  // 步行路线规划（REST）
  // 接口文档：https://restapi.amap.com/v5/direction/walking
  // 必填：
  // - key：高德 Key（需在高德地图官网申请 Web 服务 API 类型 Key）
  // - origin：起点经纬度（经度在前、纬度在后，逗号分隔，小数点后不超过6位）
  // - destination：目的地经纬度（经度在前，纬度在后，逗号分隔，小数点后不超过6位）
  //
  // 可选参数：
  // - origin_id：起点 POI ID（起点为 POI 时建议填充，可提升算路精度）
  // - destination_id：目的地 POI ID（目的地为 POI 时建议填充，可提升算路精度）
  // - alternative_route：返回路线条数，1/2/3 可分别返回首条、前两条、前三条方案
  // - show_fields：返回结果控制，逗号分隔字段类别（例如 cost、navi、polyline 等）；不设置则仅返回基础信息
  // - isindoor：是否需要室内算路（0：不需要；1：需要，默认为 0）
  // - sig：数字签名（参见数字签名获取与使用）
  // - output：输出格式（目前仅支持 json）
  // - callback：回调函数，仅在 output=json 且需要 JSONP 时有效
  //
  // 返回结构说明：
  // 顶层字段 status/info/infocode 表示请求状态；
  // route.origin/route.destination 为起终点经纬度；
  // route.paths 为方案列表，每条方案包含：
  // - distance：路线总距离（单位米）；
  // - steps：分段数组，每段含 instruction、road_name、step_distance ；如需 duration、taxi 等字段需通过 show_fields 请求；
  // show_fields 可以组合返回 cost（duration、taxi）、navi（action、assistant_action）、polyline（分段坐标串）等扩展字段。
  async directionWalking(
    origin: string,
    destination: string,
    options: {
      origin_id?: string;
      destination_id?: string;
      alternative_route?: 1 | 2 | 3;
      show_fields?: string;
      isindoor?: 0 | 1;
    } = {},
    raw_output?: boolean,
  ) {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
      isindoor: options.isindoor !== undefined ? String(options.isindoor) : '0',
    });

    if (options.origin_id) {
      params.append('origin_id', options.origin_id);
    }
    if (options.destination_id) {
      params.append('destination_id', options.destination_id);
    }
    if (options.alternative_route) {
      params.append('alternative_route', String(options.alternative_route));
    }
    if (options.show_fields) {
      params.append('show_fields', options.show_fields);
    }

    const url = `https://restapi.amap.com/v5/direction/walking?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap directionWalking HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPaths = data?.route?.paths ?? [];
    return {
      status: data?.status,
      info: data?.info,
      infocode: data?.infocode,
      route: {
        origin: data?.route?.origin,
        destination: data?.route?.destination,
        paths: simplifiedPaths.map((path: any) => ({
          distance: path.distance,
          steps: Array.isArray(path.steps)
            ? path.steps.map((step: any) => ({
                instruction: step.instruction,
                road_name: step.road_name,
                step_distance: step.step_distance,
              }))
            : [],
        })),
      },
    };
  }

  // 骑行路线规划（REST）
  // 接口文档：https://restapi.amap.com/v5/direction/bicycling
  // 请求方式：GET https://restapi.amap.com/v5/direction/bicycling?parameters
  // 所有参数均使用&分隔。
  //
  // 必填参数：
  // - key：高德 Web 服务 API 类型 Key
  // - origin：起点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  // - destination：终点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  //
  // 可选参数：
  // - show_fields：返回结果控制，使用逗号分隔多个字段；不传仅返回基础信息。
  // - alternative_route：返回方案条数（1|2|3，对应前1~3条路线）
  // - sig：数字签名（参见数字签名获取和使用方法）
  // - output：返回格式（当前仅支持 JSON）
  // - callback：回调函数名，仅 output=JSON 时有效
  //
  // 示例请求：
  // https://restapi.amap.com/v5/direction/bicycling?origin=116.466485,39.995197&destination=116.46424,40.020642&key=<用户的key>
  //
  // 返回结构（show_fields 未设置时只返回基础信息）：
  // status/info/infocode/count：请求状态及说明，成功时 status=1、info=ok、infocode=10000；
  // route：规划方案对象，包含 origin/destination、paths 数组；
  // paths：方案详情，每项包含 distance（总距离）、steps（分段数组）；
  // steps：每段包含 instruction（骑行指示）、orientation（进入方向）、road_name（道路名）、step_distance（路段距离）。
  //
  // 通过 show_fields 可以额外请求：
  // - cost：返回 duration（线路耗时）、step 中的耗时，以及 taxi 等费用信息；
  // - navi：返回 action（主要动作）、assistant_action（辅助动作）；
  // - walk_type：道路类型，取值范围参考官方枚举；
  // - polyline：分路段坐标串，用“,”分隔点坐标，用“;”分隔段；
  // - duration：线路总耗时（秒）、step 中耗时等；
  // - 其他细化字段详见官方文档。
  //
  async directionBicycling(
    origin: string,
    destination: string,
    options: {
      show_fields?: string;
      alternative_route?: 1 | 2 | 3;
    } = {},
    raw_output?: boolean,
  ) {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
    });

    if (options.show_fields) {
      params.append('show_fields', options.show_fields);
    }
    if (options.alternative_route) {
      params.append('alternative_route', String(options.alternative_route));
    }

    const url = `https://restapi.amap.com/v5/direction/bicycling?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap directionBicycling HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPaths = data?.route?.paths ?? [];
    return {
      status: data?.status,
      info: data?.info,
      infocode: data?.infocode,
      route: {
        origin: data?.route?.origin,
        destination: data?.route?.destination,
        paths: simplifiedPaths.map((path: any) => ({
          distance: path.distance,
          steps: Array.isArray(path.steps)
            ? path.steps.map((step: any) => ({
                instruction: step.instruction,
                orientation: step.orientation,
                road_name: step.road_name,
                step_distance: step.step_distance,
              }))
            : [],
        })),
      },
    };
  }

  // 电动车（骑行）路线规划（REST）
  // 接口文档：https://restapi.amap.com/v5/direction/electrobike
  // 请求方式：GET https://restapi.amap.com/v5/direction/electrobike?parameters
  // 所有参数均使用&分隔。
  //
  // 必填参数：
  // - key：高德 Web 服务 API 类型 Key
  // - origin：起点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  // - destination：终点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  //
  // 可选参数：
  // - show_fields：返回结果控制，使用逗号分隔多个字段；不传仅返回基础信息。
  // - alternative_route：返回方案条数（1|2|3，对应前1~3条路线）
  // - sig：数字签名（参见数字签名获取和使用方法）
  // - output：返回格式（当前仅支持 JSON）
  // - callback：回调函数名，仅 output=JSON 时有效
  //
  // 示例请求：
  // https://restapi.amap.com/v5/direction/electrobike?origin=116.466485,39.995197&destination=116.46424,40.020642&key=<用户的key>
  //
  // 返回结构（show_fields 未设置时只返回基础信息）：
  // status/info/infocode/count：请求状态及说明，成功时 status=1、info=ok、infocode=10000；
  // route：规划方案对象，包含 origin/destination、paths 数组；
  // paths：方案详情，每项包含 distance（总距离）、steps（分段数组）；
  // steps：每段包含 instruction（骑行指示）、orientation（进入方向）、road_name（道路名）、step_distance（路段距离）。
  //
  // 通过 show_fields 可以额外请求：
  // - cost：返回 duration（线路耗时）、step 中的耗时，以及 taxi 等费用信息；
  // - navi：返回 action（主要动作）、assistant_action（辅助动作）；
  // - walk_type：道路类型，取值范围参考官方枚举；
  // - polyline：分路段坐标串，用“,”分隔点坐标，用“;”分隔段；
  // - duration：线路总耗时（秒）、step 中耗时等；
  // - 其他细化字段详见官方文档。
  //
  async directionElectrobike(
    origin: string,
    destination: string,
    options: {
      show_fields?: string;
      alternative_route?: 1 | 2 | 3;
    } = {},
    raw_output?: boolean,
  ) {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
    });

    if (options.show_fields) {
      params.append('show_fields', options.show_fields);
    }
    if (options.alternative_route) {
      params.append('alternative_route', String(options.alternative_route));
    }

    const url = `https://restapi.amap.com/v5/direction/electrobike?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap directionElectrobike HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPaths = data?.route?.paths ?? [];
    return {
      status: data?.status,
      info: data?.info,
      infocode: data?.infocode,
      route: {
        origin: data?.route?.origin,
        destination: data?.route?.destination,
        paths: simplifiedPaths.map((path: any) => ({
          distance: path.distance,
          steps: Array.isArray(path.steps)
            ? path.steps.map((step: any) => ({
                instruction: step.instruction,
                orientation: step.orientation,
                road_name: step.road_name,
                step_distance: step.step_distance,
              }))
            : [],
        })),
      },
    };
  }


  // 关键字搜索（REST）
  // 接口文档：https://restapi.amap.com/v5/place/text
  // 请求方式：GET https://restapi.amap.com/v5/place/text?parameters
  //
  // 必填参数（keywords 或 types 二选一必填）：
  // - key：高德 Key（需在高德地图官网申请 Web 服务 API 类型 Key）
  // - keywords：地点关键字（如“北京大学”），只支持一个关键字，长度<80字符
  // - types：指定地点类型（POI分类码），多个用“|”分隔。
  //
  // 可选参数：
  // - region：搜索区划（citycode/adcode/cityname），如“北京市”。增加指定区域内数据召回权重。
  // - city_limit：是否限制在 region 内召回（true/false），默认 false。为 true 时，仅召回 region 对应区域内数据。
  // - show_fields：返回结果控制（children,business,indoor,navi,photos），逗号分隔。
  // - page_size：每页条数（1-25），默认 10。
  // - page_num：当前页码，默认 1。
  // - sig：数字签名。
  // - output：返回格式，默认 JSON。
  // - callback：回调函数。
  //
  // 返回结构：
  // status/info/infocode/count：状态及总数
  // pois：POI 数组，包含 name, id, location, type, address, cityname 等基础信息
  // 通过 show_fields 可获取 children（子POI）、business（营业时间/评分/人均等）、indoor（室内）、navi（入口）、photos（图片）等。
  async searchPlaceText(
    keywords: string,
    types: string = '',
    options: {
      region?: string;
      city_limit?: boolean;
      show_fields?: string;
      page_size?: number;
      page_num?: number;
    } = {},
    raw_output?: boolean,
  ) {
    if (!keywords && !types) {
      throw new Error('Amap placeText error: keywords or types must be provided.');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
    });

    if (keywords) params.append('keywords', keywords);
    if (types) params.append('types', types);
    if (options.region) params.append('region', options.region);
    if (options.city_limit !== undefined) params.append('city_limit', String(options.city_limit));
    if (options.show_fields) params.append('show_fields', options.show_fields);
    if (options.page_size) params.append('page_size', String(options.page_size));
    if (options.page_num) params.append('page_num', String(options.page_num));

    const url = `https://restapi.amap.com/v5/place/text?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap placeText HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPois = data?.pois ?? [];
    return {
      status: data?.status,
      info: data?.info,
      count: data?.count,
      pois: simplifiedPois.map((poi: any) => ({
        name: poi.name,
        id: poi.id,
        location: poi.location,
        address: poi.address,
        pname: poi.pname,
        cityname: poi.cityname,
        adname: poi.adname,
        type: poi.type,
        // 尝试提取常用扩展字段（如果 show_fields 请求了 business 等）
        tel: poi.tel,
        rating: poi.business?.rating,
        cost: poi.business?.cost,
        opentime: poi.business?.opentime_week || poi.business?.opentime_today,
      })),
    };
  }


  // 周边搜索（REST）
  // 接口文档：https://restapi.amap.com/v5/place/around
  // 请求方式：GET https://restapi.amap.com/v5/place/around?parameters
  //
  // 必填参数：
  // - key：高德 Key
  // - location：中心点坐标（经度,纬度），如 "116.473168,39.993015"
  //
  // 可选参数：
  // - keywords：地点关键字
  // - types：指定地点类型（POI分类码），多个用“|”分隔
  // - radius：搜索半径，范围 0-50000，默认 5000（米）
  // - sortrule：排序规则，distance（距离排序，默认）| weight（综合排序）
  // - region：搜索区划
  // - city_limit：是否限制在 region 内召回
  // - show_fields：返回结果控制（children,business,indoor,navi,photos），逗号分隔
  // - page_size：每页条数（1-25），默认 10
  // - page_num：当前页码，默认 1
  // - sig：数字签名
  // - output：返回格式，默认 JSON
  //
  // 返回结构：
  // status/info/infocode/count：状态及总数
  // pois：POI 数组，包含 name, id, location, distance, type, address 等
  async searchPlaceAround(
    location: string,
    keywords: string = '',
    types: string = '',
    options: {
      radius?: number;
      sortrule?: 'distance' | 'weight';
      region?: string;
      city_limit?: boolean;
      show_fields?: string;
      page_size?: number;
      page_num?: number;
    } = {},
    raw_output?: boolean,
  ) {
    if (!location) {
      throw new Error('Amap placeAround error: location must be provided.');
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      location: location,
    });

    if (keywords) params.append('keywords', keywords);
    if (types) params.append('types', types);
    if (options.radius) params.append('radius', String(options.radius));
    if (options.sortrule) params.append('sortrule', options.sortrule);
    if (options.region) params.append('region', options.region);
    if (options.city_limit !== undefined) params.append('city_limit', String(options.city_limit));
    if (options.show_fields) params.append('show_fields', options.show_fields);
    if (options.page_size) params.append('page_size', String(options.page_size));
    if (options.page_num) params.append('page_num', String(options.page_num));

    const url = `https://restapi.amap.com/v5/place/around?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap placeAround HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedPois = data?.pois ?? [];
    return {
      status: data?.status,
      info: data?.info,
      count: data?.count,
      pois: simplifiedPois.map((poi: any) => ({
        name: poi.name,
        id: poi.id,
        location: poi.location,
        distance: poi.distance, // 周边搜索特有字段：离中心点距离
        address: poi.address,
        pname: poi.pname,
        cityname: poi.cityname,
        adname: poi.adname,
        type: poi.type,
        // 尝试提取常用扩展字段
        tel: poi.tel,
        rating: poi.business?.rating,
        cost: poi.business?.cost,
        opentime: poi.business?.opentime_week || poi.business?.opentime_today,
        photos: poi.photos,
      })),
    };
  }
  

  /*天气查询
  所有参数均使用和号字符(&)进行分隔
  https://restapi.amap.com/v3/weather/weatherInfo?parameters
  */
  async weather(city: string): Promise<any> {
    const extention = 'base'; // base: 实时天气, all: 预报天气
    const output = 'JSON';

    const baseUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';

    const url = `${baseUrl}?key=${this.apiKey}&city=${city}&extensions=${extention}&output=${output}`;

    // 发送请求
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap weather HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }

  // 公交路线规划（REST，集成版）
  // 接口文档：https://restapi.amap.com/v5/direction/transit/integrated
  // 请求方式：GET https://restapi.amap.com/v5/direction/transit/integrated?parameters
  // 所有参数均使用&分隔。
  //
  // 必填参数：
  // - key：高德 Web 服务 API 类型 Key
  // - origin：起点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  // - destination：终点经纬度，格式 lng,lat（经度在前、纬度在后），小数不超过6位
  // - city1：起点所在城市 citycode（跨城时不等于 city2）
  // - city2：终点所在城市 citycode
  //
  // 其他可选参数：originpoi、destinationpoi（配对使用）、ad1、ad2、strategy（换乘策略 0~8）、AlternativeRoute（返回方案数 1~10）、multiexport（地铁出入口）、nightflag、date、time、show_fields、sig、output、callback 等。
  //
  // 示例请求：
  // https://restapi.amap.com/v5/direction/transit/integrated?origin=116.466485,39.995197&destination=116.46424,40.020642&city1=010&city2=010&key=<用户的key>
  //
  // 返回结构（show_fields 未设置时返回基础信息）：
  // status/info/infocode/count：请求状态及说明；
  // route：规划方案对象，包含 origin/destination、transits 数组；
  // transits：公交方案列表，每条包含 distance（米）、nightflag（是否夜班）、segments（分段）等；
  // segments：由 walking、bus、railway 等分段组成，步行/公交/火车各自对应旧 v3 接口结构；
  // 通过 show_fields 可额外请求 cost（duration/taxi_fee/transit_fee）、navi（action/assistant_action）、walk_type、polyline、taxi（打车费用/时间/距离/坐标）等扩展字段。
  async directionTransitIntegrated(
    origin: string,
    destination: string,
    city1: string,
    city2: string,
    options: {
      originpoi?: string;
      destinationpoi?: string;
      ad1?: string;
      ad2?: string;
      strategy?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      AlternativeRoute?: number;
      multiexport?: 0 | 1;
      nightflag?: 0 | 1;
      date?: string;
      time?: string;
      show_fields?: string;
    } = {},
    raw_output?: boolean,
  ) {
    const params = new URLSearchParams({
      key: this.apiKey,
      origin,
      destination,
      city1,
      city2,
    });

    if (options.originpoi) params.append('originpoi', options.originpoi);
    if (options.destinationpoi) params.append('destinationpoi', options.destinationpoi);
    if (options.ad1) params.append('ad1', options.ad1);
    if (options.ad2) params.append('ad2', options.ad2);
    if (options.strategy !== undefined) params.append('strategy', String(options.strategy));
    if (options.AlternativeRoute) params.append('AlternativeRoute', String(options.AlternativeRoute));
    if (options.multiexport !== undefined) params.append('multiexport', String(options.multiexport));
    if (options.nightflag !== undefined) params.append('nightflag', String(options.nightflag));
    if (options.date) params.append('date', options.date);
    if (options.time) params.append('time', options.time);
    if (options.show_fields) params.append('show_fields', options.show_fields);

    const url = `https://restapi.amap.com/v5/direction/transit/integrated?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Amap directionTransitIntegrated HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (raw_output) {
      return data;
    }

    const simplifiedTransits = data?.route?.transits ?? [];
    return {
      status: data?.status,
      info: data?.info,
      infocode: data?.infocode,
      route: {
        origin: data?.route?.origin,
        destination: data?.route?.destination,
        transits: simplifiedTransits.map((transit: any) => ({
          distance: transit.distance,
          nightflag: transit.nightflag,
          segments: Array.isArray(transit.segments)
            ? transit.segments.map((segment: any) => ({
                type: segment.type,
                walking: segment.walking,
                bus: segment.bus,
                railway: segment.railway,
              }))
            : [],
        })),
      },
    };
  }
}

class AmapTest {
  async test() {
    const amap = new Amap();
    amap.setApiKey(amapKey());
    
    // 测试地理编码
    // const result = await amap.geocode('北京市朝阳区阜通东大街6号');
    // console.log(result);

    // 测试逆地理编码
    // const regeoResult = await amap.regeo('116.481028,39.989643');
    // console.log(regeoResult);

    // 测试开车路径规划
    // const directionResult = await amap.directionDriving('116.481028,39.989643', '116.434446,39.90816');
    // console.log(directionResult);
    // 测试步行路线规划
    // const walkingResult = await amap.directionWalking('116.481028,39.989643', '116.434446,39.90816');
    // console.log(walkingResult);
    // // 测试骑行路线规划
    // const bicyclingResult = await amap.directionBicycling('116.481028,39.989643', '116.434446,39.90816');
    // console.log(bicyclingResult);
    // // 测试电动车路线规划
    // const electrobikeResult = await amap.directionElectrobike('116.481028,39.989643', '116.434446,39.90816');
    // console.log(electrobikeResult);
    // // 测试公交路线规划
    // const transitResult = await amap.directionTransitIntegrated('116.481028,39.989643', '116.434446,39.90816', '010', '010');
    // console.log(transitResult);

    // 测试关键字搜索
    const placeResult = await amap.searchPlaceText('北京大学', '', { region: '北京市', city_limit: true, page_size: 5 });
    console.log(placeResult);
    // 测试周边搜索
    const aroundResult = await amap.searchPlaceAround('116.481028,39.989643', '餐饮', '', { radius: 1000, sortrule: 'distance', page_size: 5 });
    console.log(aroundResult);

    // 测试天气查询
    // const weatherResult = await amap.weather('110101'); // 北京市东城区的adcode
    // console.log(weatherResult);
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
