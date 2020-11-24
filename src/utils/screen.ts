/**
 * xylink fullscreen lib
 *
 * @summary fscreen
 * @author jinghui-Luo
 *
 * Created at     : 2020-11-24 14:10:00
 * Last modified  : 2020-11-24 14:10:36
 */

const browser = function () {
  const browserList = [
    [
      "requestFullscreen",
      "exitFullscreen",
      "fullscreenElement",
      "fullscreenchange",
      "fullscreenEnabled",
    ],
    [
      "webkitRequestFullscreen",
      "webkitExitFullscreen",
      "webkitFullscreenElement",
      "webkitfullscreenchange",
      "webkitFullscreenEnabled",
      "webkitCancelFullScreen",
    ],
    [
      "mozRequestFullScreen",
      "mozCancelFullScreen",
      "mozFullScreenElement",
      "mozfullscreenchange",
      "mozFullScreenEnabled",
    ],
    [
      "msRequestFullscreen",
      "msExitFullscreen",
      "msFullscreenElement",
      "MSFullscreenChange",
      "msFullscreenEnabled",
    ],
  ];

  const browserLen = browserList.length;
  let val;
  let result = {};

  for (let i = 0; i < browserLen; i++) {
    val = browserList[i];

    if (val && val[1] in document) {
      val.forEach((item, index) => {
        // @ts-ignore
        result[browserList[0][index]] = item;
      });

      break;
    }
  }

  return result;
};

class FScreen {
  browser: any;
  eles: any;
  isInit: boolean;

  constructor() {
    this.browser = browser();
    this.eles = new Map();
    this.isInit = false;

    this.fullscreenChangeCallback = this.fullscreenChangeCallback.bind(this);
  }

  public is() {
    // @ts-ignore
    return Boolean(document[this.browser.fullscreenElement]);
  }

  public ele() {
    // @ts-ignore
    return document[this.browser.fullscreenElement];
  }

  public getEles() {
    return this.eles;
  }

  /**
   * config fscreen params
   *
   * @param ele request full screen'ele
   * @param cb ele status change callback function
   */
  public init(ele: any, cb?: (status: any) => void) {
    this.eles.set(ele, { ele, cb, isFullScreen: false });

    if (!this.isInit) {
      this.initEventListener();
    }
  }

  private fullscreenChangeCallback(e: any) {
    const fullscreenEle = this.ele();
    const currentEle = e.target;

    if (fullscreenEle === null) {
      // 没有全屏元素，则更新所有ele的全屏状态
      this.eles.forEach((eleObj: any) => {
        eleObj.isFullScreen = false;

        eleObj.cb(eleObj);
      });
    } else if (fullscreenEle !== null && currentEle !== fullscreenEle) {
      // 连续请求全屏，依次退出时回调
      // safari不会调用此回调，因为无法连续请求全屏api
      const currentEle = e.target;

      if (this.eles.has(currentEle)) {
        const eleObj = this.eles.get(currentEle);

        eleObj.isFullScreen = false;

        eleObj.cb(eleObj);
      }
    } else if (fullscreenEle !== null) {
      // 全屏时回调
      const eleObj = this.eles.get(currentEle);

      eleObj.isFullScreen = true;

      this.eles.set(currentEle, eleObj);

      eleObj.cb(eleObj);
    }
  }

  private initEventListener() {
    document.addEventListener(
      this.browser.fullscreenchange,
      this.fullscreenChangeCallback
    );
  }

  private removeEventListener() {
    document.removeEventListener(
      this.browser.fullscreenchange,
      this.fullscreenChangeCallback
    );
  }

  public clear(ele: any) {
    if (this.eles.has(ele)) {
      const eleObj = this.eles.get(ele);

      eleObj.isFullScreen = false;

      if (this.eles.size <= 1) {
        this.removeEventListener();

        this.isInit = false;
      }

      this.eles.delete(ele);
    }
  }

  public clearAll() {
    this.removeEventListener();

    this.eles = new Map();
    this.isInit = false;
  }

  public request(ele: any) {
    if (this.eles.has(ele)) {
      const eleObj = this.eles.get(ele);

      eleObj.ele[this.browser.requestFullscreen]();
    } else {
      this.init(ele);

      this.request(ele);
    }
  }

  public exit(ele: any) {
    if (this.eles.has(ele)) {
      // @ts-ignore
      document[this.browser.exitFullscreen]();
    }
  }
}

const fscreen = new FScreen();

export { fscreen };
