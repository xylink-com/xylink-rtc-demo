/**
 * Tools lib
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-28 17:26:40
 */

import { ILayout } from '@xylink/xy-rtc-sdk';
import { TEMPLATE } from "./template";

export const transformTime = (timestamp: number = +new Date()) => {
  if (timestamp) {
    var time = new Date(timestamp);
    var y = time.getFullYear(); //getFullYear方法以四位数字返回年份
    var M = time.getMonth() + 1; // getMonth方法从 Date 对象返回月份 (0 ~ 11)，返回结果需要手动加一
    var d = time.getDate(); // getDate方法从 Date 对象返回一个月中的某一天 (1 ~ 31)
    var h = time.getHours(); // getHours方法返回 Date 对象的小时 (0 ~ 23)
    var m = time.getMinutes(); // getMinutes方法返回 Date 对象的分钟 (0 ~ 59)
    var s = time.getSeconds(); // getSeconds方法返回 Date 对象的秒数 (0 ~ 59)
    return y + "-" + M + "-" + d + " " + h + ":" + m + ":" + s;
  } else {
    return "";
  }
};

export const getErrorMsg = (err: any) => {
  return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
};

export const calculateBaseLayoutList = (
  orderLayoutList: ILayout[],
  rateWidth: number,
  rateHeight: number
) => {
  let positionStyle = { left: "0px", top: "0px", width: "0px", height: "0px" };
  // @ts-ignore
  const positionInfo = TEMPLATE.temp[orderLayoutList.length];

  const layoutList = orderLayoutList.map(
    (item: ILayout, index: number) => {
      const position = positionInfo[index].position;
      const [x, y, w, h] = position;
      let layoutX = Math.round(rateWidth * x);
      let layoutY = Math.round(rateHeight * y);
      let layoutWidth = Math.round(rateWidth * w);
      let layoutHeight = Math.round(rateHeight * h);

      positionStyle = {
        left: `${layoutX}px`,
        top: `${layoutY}px`,
        width: `${layoutWidth}px`,
        height: `${layoutHeight}px`,
      };

      const cachePositionInfo = {
        width: layoutWidth,
        height: layoutHeight,
      };

      return { ...item, positionStyle, positionInfo: cachePositionInfo };
    }
  );

  return layoutList;
};

/**
 * 通过旋转信息获取在layout中的位置
 *
 * @param pid peopleId
 * @param mediagroupid type类型，0: people画面，1: content画面
 */
export const getLayoutIndexByRotateInfo = (
  nextLayoutList: ILayout[],
  pid: number,
  mid: number
) => {
  let index = -1;
  let listLen = nextLayoutList.length;

  for (let i = 0; i < listLen; i++) {
    const item = nextLayoutList[i];
    const { isContent, participantId } = item.roster;
    // 是不是同一个人
    const isSamePid = participantId === pid;
    // mediagroupid： content/people设备标示，为0代表是people数据，为1代表是content数据
    const isContentOfRotateDevice = mid === 1;
    const match = isSamePid && isContentOfRotateDevice === isContent;

    if (match) {
      index = i;
    }
  }

  return index;
};

// CUSTOM 自定义布局时，需要自行计算Layout容器信息
// 此处使用CUSTOM 自定义布局实现一套SPEAKER演讲者模式的布局模式
// 具体布局形式可参考AUTO布局的SPEAKER演讲者模式
export const getScreenInfo = (
  elementId: string = "",
  nextTemplateRate: number
) => {
  const { clientHeight, clientWidth } =
    document.getElementById(elementId) || document.body;
  const rateHeight = Math.floor(clientWidth * nextTemplateRate);
  const rateWidth = Math.floor(clientHeight / nextTemplateRate);
  const screenInfoObj: {
    rateHeight: number;
    rateWidth: number;
  } = { rateHeight: 0, rateWidth: 0 };

  // 高充足，以屏幕宽计算高
  if (clientHeight > rateHeight) {
    screenInfoObj.rateHeight = rateHeight;
    screenInfoObj.rateWidth = clientWidth;
  } else {
    // 否则，以比例宽计算高
    screenInfoObj.rateHeight = clientHeight;
    screenInfoObj.rateWidth = rateWidth;
  }

  return screenInfoObj;
};
