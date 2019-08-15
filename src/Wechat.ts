'use strict';

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { EventEmitter } from 'events';

let isAppRegistered = false;
const { WeChat } = NativeModules;
const WXEventEmitter = new NativeEventEmitter(WeChat);

interface BaseResponse {
  errCode: number;
  errStr?: string;
}

interface ShareResponse extends BaseResponse {
  lang: string;
  country: string;
}

interface PayResponse extends BaseResponse {
  returnKey: string;
}

interface AuthResponse extends BaseResponse {
  openId?: string;
  code?: string;
  url?: string;
  lang?: string;
  country?: string;
}

export interface ShareMetadata {
  type:
    | 'news'
    | 'text'
    | 'imageUrl'
    | 'imageFile'
    | 'imageResource'
    | 'video'
    | 'audio'
    | 'file';
  thumbImage?: string;
  description?: string;
  webpageUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  filePath?: string;
  fileExtension?: string;
}

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
export const registerApp = (appId: string) => {
  if (!WeChat.registerApp) {
    return Promise.reject('Native Module Lost');
  }

  if (isAppRegistered) {
    // FIXME(Yorkie): we ignore this error if AppRegistered is true.
    return Promise.resolve();
  }
  isAppRegistered = true;
  return new Promise((resolve, reject) => {
    WeChat.registerApp(appId, (error: any) => {
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
export const isWXAppInstalled = () =>
  wrapApi<boolean>(WeChat.isWXAppInstalled)();

/**
 * Return if the wechat application supports the api
 * @method isWXAppSupportApi
 * @return {Promise}
 */
export const isWXAppSupportApi = () =>
  wrapApi<boolean>(WeChat.isWXAppSupportApi)();

/**
 * Get the wechat app installed url
 * @method getWXAppInstallUrl
 * @return {String} the wechat app installed url
 */
export const getWXAppInstallUrl = () =>
  wrapApi<string>(WeChat.getWXAppInstallUrl)();

/**
 * Get the wechat api version
 * @method getApiVersion
 * @return {String} the api version string
 */
export const getApiVersion = () => wrapApi<string>(WeChat.getApiVersion)();

/**
 * Open wechat app
 * @method openWXApp
 * @return {Promise}
 */
export const openWXApp = () => wrapApi(WeChat.openWXApp)();

// wrap the APIs
const nativeShareToTimeline = wrapApi(WeChat.shareToTimeline);
const nativeShareToSession = wrapApi(WeChat.shareToSession);
const nativeShareToFavorite = wrapApi(WeChat.shareToFavorite);
const nativeSendAuthRequest = wrapApi(WeChat.sendAuthRequest);

export function sendAuthRequest(scopes: string, state?: string) {
  return new Promise<AuthResponse>((resolve, reject) => {
    WeChat.sendAuthRequest(scopes, state, () => {});
    emitter.once('SendAuth.Resp', resp => {
      if (resp.errCode === 0) {
        resolve(resp);
      } else {
        reject(new WechatError(resp));
      }
    });
  });
}

export function shareToTimeline(data: ShareMetadata) {
  return new Promise((resolve, reject) => {
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

export function shareToSession(data: ShareMetadata) {
  return new Promise((resolve, reject) => {
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

export function shareToFavorite(data: ShareMetadata) {
  return new Promise((resolve, reject) => {
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

export function pay(payload: PaymentLoad) {
  return new Promise<PayResponse>((resolve, reject) => {
    WeChat.pay(payload, (error?: string) => {
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
