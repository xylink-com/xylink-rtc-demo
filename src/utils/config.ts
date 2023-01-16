/**
 * webRTC config file
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-01-17 12:04:01
 */

export const THIRD: boolean = true;

export const SERVER = {
  wssServer: "wss://cloudapi.xylink.com",
  httpServer: "https://cloudapi.xylink.com",
  logServer: "https://log.xylink.com",
};

// ************************此处配置您的开发者账号信息******************************
// 默认提供了一组测试企业账号信息：
// extId: '0142901e3d83e0a1e225ef92b8663fcaebda7242'
// clientId: 'BR1e5cptJgyC1aFRtiXfmdg3'
// clientSecret: 'I2aQ80XuXcrMTemfgwzm0zYvEyWpdqb0'
// 测试企业账号信息仅限于测试Demo呼叫，有资源限制！！！
// ************************！！！第三方正式环境，需要替换对应自己企业的信息！！！***********************
export const ACCOUNT = {
  extId: "0142901e3d83e0a1e225ef92b8663fcaebda7242",
  clientId: "BR1e5cptJgyC1aFRtiXfmdg3",
  clientSecret: "I2aQ80XuXcrMTemfgwzm0zYvEyWpdqb0",
};
