/**
 * webRTC config file
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-01-17 12:04:01
 */

import store from "./store";

// 默认第三方是prd环境
export const ENV: "PRE" | "PRD" | "TXDEV" = store.get("xy-sdk-env") || "PRD";
export const THIRD: boolean = true;

const SERVER_MAP: any = {
  TXDEV: {
    wssServer: "wss://testdevapi.xylink.com",
    httpServer: "https://testdevapi.xylink.com",
    baseServer: "https://testdev.xylink.com",
    logServer: "https://txdevlog.xylink.com",
  },
  PRE: {
    wssServer: "wss://cloudapi.xylink.com",
    httpServer: "https://cloudapi.xylink.com",
    baseServer: "https://cloud.xylink.com",
    logServer: "https://log.xylink.com",
  },
  PRD: {
    wssServer: "wss://cloudapi.xylink.com",
    httpServer: "https://cloudapi.xylink.com",
    baseServer: "https://cloud.xylink.com",
    logServer: "https://log.xylink.com",
  },
};

/**
 * 重要提示
 * 重要提示
 * 重要提示
 * PRODUCTION_ACCOUNT需要自行配置
 * 第三方登录，需要填写extId、clientId、clientSecret(1.3.4 版本以上，clientSecret不再使用，可不用配置)
 * 此值需要从对接负责人处获取
 * 重要提示
 * 重要提示
 * 重要提示
 */
const PRODUCTION_ACCOUNT = {
  extId: "ddbbb1b45ff2834056886746cb715fae5079d18c",
  clientId: "pV2w8Qs8PJkTJDjdO9zUsk2W",
  clientSecret: "38bmDdtinfKzNbrT1Pjer2hNXieUtjTr",
};

const THIRD_ACCOUNT_MAP = {
  TXDEV: {
    extId: "8bea008225dd82616e1f43dcc5c8e3bbbab0d9e5", // a8659e5d496283c5d5ed18b9b51f263bfeeebc79
    clientId: "Dx9AiLgQEOboyidOWxGoQRSi",
    clientSecret: "",
  },
  PRE: {
    extId: "8bea008225dd82616e1f43dcc5c8e3bbbab0d9e5",
    clientId: "jBSENo2jINkrlsqu1hJWeaXD",
    clientSecret: "IIhbtnReNE5pINFgV9NXYhLUlgLAx0HM",
  },
  PRD: PRODUCTION_ACCOUNT,
};

export const SERVER = (env: "PRE" | "PRD" | "TXDEV" = ENV) => SERVER_MAP[env];
export const ACCOUNT = (env: "PRE" | "PRD" | "TXDEV" = ENV) =>
  THIRD_ACCOUNT_MAP[env];
