import { NativeEventEmitter, NativeModules } from 'react-native';
import { EventEmitter } from 'events';

let isAppRegistered = false;
const { WeChat: NativeWeChat } = NativeModules;
const WXEventEmitter = new NativeEventEmitter(NativeWeChat);

export enum WXErrCode {
  /** 成功 */
  WXSuccess = 0,
  /** 普通错误类型 */
  WXErrCodeCommon = -1,
  /** 用户点击取消并返回 */
  WXErrCodeUserCancel = -2,
  /** 发送失败 */
  WXErrCodeSentFail = -3,
  /** 授权失败 */
  WXErrCodeAuthDeny = -4,
  /** 微信不支持 */
  WXErrCodeUnsupport = -5,
}

export interface BaseResponse {
  errCode: WXErrCode;
  errStr?: string;
}

export interface ShareResponse extends BaseResponse {
  lang: string;
  country: string;
}

export interface PayResponse extends BaseResponse {
  returnKey: string;
}

export interface AuthResponse extends BaseResponse {
  openId?: string;
  code?: string;
  url?: string;
  lang?: string;
  country?: string;
}

export type ShareMetadata =
  | {
      type: 'text';
      description: string;
    }
  | {
      type: 'news';
      title: string;
      description: string;
      webpageUrl: string;
    }
  | {
      type: 'audio';
      title: string;
      description: string;
      musicUrl: string;
    }
  | {
      type: 'imageUrl';
      title: string;
      description: string;
      imageUrl: string;
    }
  | {
      type: 'video';
      title: string;
      description: string;
      videoUrl: string;
    }
  | {
      type: 'file';
      title: string;
      description: string;
      filePath: string;
      fileExtension: string;
    };

// Event emitter to dispatch request and response from WeChat.
const emitter = new EventEmitter();

WXEventEmitter.addListener('WeChat_Resp', resp => {
  emitter.emit(resp.type, resp);
});

function wrapApi<T = void>(nativeFunc: (...args: any[]) => Promise<T>) {
  if (!nativeFunc) {
    return () => Promise.reject('Native Module Lost');
  }
  return (...args: any[]) => {
    if (!isAppRegistered) {
      return Promise.reject(new Error('registerApp required.'));
    }
    return new Promise<T>((resolve, reject) => {
      nativeFunc.apply(null, [
        ...args,
        (error: any, result: T) => {
          if (!error) {
            return resolve(result);
          }
          if (typeof error === 'string') {
            return reject(new Error(error));
          }
          reject(error);
        },
      ]);
    });
  };
}

/**
 * @method registerApp
 * @param {String} appId - the app id
 * @return {Promise}
 */
const registerApp = (appId: string) => {
  if (!NativeWeChat.registerApp) {
    return Promise.reject('Native Module Lost');
  }

  if (isAppRegistered) {
    // FIXME(Yorkie): we ignore this error if AppRegistered is true.
    return Promise.resolve();
  }
  isAppRegistered = true;
  return new Promise((resolve, reject) => {
    NativeWeChat.registerApp(appId, (error: any) => {
      if (!error) {
        return resolve();
      }
      if (typeof error === 'string') {
        return reject(new Error(error));
      }
      reject(error);
    });
  });
};

/**
 * Return if the wechat app is installed in the device.
 * @method isWXAppInstalled
 * @return {Promise}
 */
const isWXAppInstalled = () =>
  wrapApi<boolean>(NativeWeChat.isWXAppInstalled)();

/**
 * Return if the wechat application supports the api
 * @platform iOS
 * @method isWXAppSupportApi
 * @return {Promise}
 */
const isWXAppSupportApi = () =>
  wrapApi<boolean>(NativeWeChat.isWXAppSupportApi)();

/**
 * Get the wechat app installed url
 * @method getWXAppInstallUrl
 * @return {String} the wechat app installed url
 */
const getWXAppInstallUrl = () =>
  wrapApi<string>(NativeWeChat.getWXAppInstallUrl)();

/**
 * Get the wechat api version
 * @method getApiVersion
 * @return {String} the api version string
 */
const getApiVersion = () => wrapApi<string>(NativeWeChat.getApiVersion)();

/**
 * Open wechat app
 * @method openWXApp
 * @return {Promise}
 */
const openWXApp = () => wrapApi(NativeWeChat.openWXApp)();

// wrap the APIs
const nativeShareToTimeline = wrapApi(NativeWeChat.shareToTimeline);
const nativeShareToSession = wrapApi(NativeWeChat.shareToSession);
const nativeShareToFavorite = wrapApi(NativeWeChat.shareToFavorite);

function sendAuthRequest(scopes: string, state?: string) {
  return new Promise<AuthResponse>((resolve, reject) => {
    NativeWeChat.sendAuthRequest(scopes, state, () => {});
    emitter.once('SendAuth.Resp', resp => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

function shareToTimeline(data: ShareMetadata) {
  return new Promise<ShareResponse>((resolve, reject) => {
    nativeShareToTimeline(data);
    emitter.once('SendMessageToWX.Resp', resp => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

function shareToSession(data: ShareMetadata) {
  return new Promise<ShareResponse>((resolve, reject) => {
    nativeShareToSession(data);
    emitter.once('SendMessageToWX.Resp', resp => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

function shareToFavorite(data: ShareMetadata) {
  return new Promise<ShareResponse>((resolve, reject) => {
    nativeShareToFavorite(data);
    emitter.once('SendMessageToWX.Resp', resp => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

export interface PaymentLoad {
  partnerId: string;
  prepayId: string;
  nonceStr: string;
  timeStamp: string;
  package: string;
  sign: string;
}

function pay(payload: PaymentLoad) {
  return new Promise<PayResponse>((resolve, reject) => {
    NativeWeChat.pay(payload, (error?: string) => {
      if (error) reject(new Error(error));
    });
    emitter.once('PayReq.Resp', (resp: PayResponse) => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

/**
 * promises will reject with this error when API call finish with an errCode other than zero.
 */
export class WechatError extends Error {
  code: number;
  constructor(resp: BaseResponse) {
    const message = resp.errStr || resp.errCode.toString();
    super(message);
    this.name = 'WechatError';
    this.code = resp.errCode;

    Object.setPrototypeOf(this, WechatError.prototype);
  }
}

const Wechat = {
  pay,
  sendAuthRequest,
  shareToFavorite,
  shareToSession,
  shareToTimeline,
  registerApp,
  openWXApp,
  isWXAppInstalled,
  isWXAppSupportApi,
  getWXAppInstallUrl,
  getApiVersion,
};

export default Wechat;
