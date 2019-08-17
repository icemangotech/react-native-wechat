import { NativeEventEmitter, NativeModules } from 'react-native';
import { EventEmitter } from 'events';
let isAppRegistered = false;
const { WeChat: NativeWeChat } = NativeModules;
const WXEventEmitter = new NativeEventEmitter(NativeWeChat);
export var WXErrCode;
(function (WXErrCode) {
    /** 成功 */
    WXErrCode[WXErrCode["WXSuccess"] = 0] = "WXSuccess";
    /** 普通错误类型 */
    WXErrCode[WXErrCode["WXErrCodeCommon"] = -1] = "WXErrCodeCommon";
    /** 用户点击取消并返回 */
    WXErrCode[WXErrCode["WXErrCodeUserCancel"] = -2] = "WXErrCodeUserCancel";
    /** 发送失败 */
    WXErrCode[WXErrCode["WXErrCodeSentFail"] = -3] = "WXErrCodeSentFail";
    /** 授权失败 */
    WXErrCode[WXErrCode["WXErrCodeAuthDeny"] = -4] = "WXErrCodeAuthDeny";
    /** 微信不支持 */
    WXErrCode[WXErrCode["WXErrCodeUnsupport"] = -5] = "WXErrCodeUnsupport";
})(WXErrCode || (WXErrCode = {}));
// Event emitter to dispatch request and response from WeChat.
const emitter = new EventEmitter();
WXEventEmitter.addListener('WeChat_Resp', resp => {
    emitter.emit(resp.type, resp);
});
function wrapApi(nativeFunc) {
    if (!nativeFunc) {
        return () => Promise.reject('Native Module Lost');
    }
    return (...args) => {
        if (!isAppRegistered) {
            return Promise.reject(new Error('registerApp required.'));
        }
        return new Promise((resolve, reject) => {
            nativeFunc.apply(null, [
                ...args,
                (error, result) => {
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
const registerApp = (appId) => {
    if (!NativeWeChat.registerApp) {
        return Promise.reject('Native Module Lost');
    }
    if (isAppRegistered) {
        // FIXME(Yorkie): we ignore this error if AppRegistered is true.
        return Promise.resolve();
    }
    isAppRegistered = true;
    return new Promise((resolve, reject) => {
        NativeWeChat.registerApp(appId, (error) => {
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
const isWXAppInstalled = () => wrapApi(NativeWeChat.isWXAppInstalled)();
/**
 * Return if the wechat application supports the api
 * @platform iOS
 * @method isWXAppSupportApi
 * @return {Promise}
 */
const isWXAppSupportApi = () => wrapApi(NativeWeChat.isWXAppSupportApi)();
/**
 * Get the wechat app installed url
 * @method getWXAppInstallUrl
 * @return {String} the wechat app installed url
 */
const getWXAppInstallUrl = () => wrapApi(NativeWeChat.getWXAppInstallUrl)();
/**
 * Get the wechat api version
 * @method getApiVersion
 * @return {String} the api version string
 */
const getApiVersion = () => wrapApi(NativeWeChat.getApiVersion)();
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
function sendAuthRequest(scopes, state) {
    return new Promise((resolve, reject) => {
        NativeWeChat.sendAuthRequest(scopes, state, () => { });
        emitter.once('SendAuth.Resp', resp => {
            if (resp.errCode === 0) {
                resolve(resp);
            }
            else {
                reject(new WechatError(resp));
            }
        });
    });
}
function shareToTimeline(data) {
    return new Promise((resolve, reject) => {
        nativeShareToTimeline(data);
        emitter.once('SendMessageToWX.Resp', resp => {
            if (resp.errCode === 0) {
                resolve(resp);
            }
            else {
                reject(new WechatError(resp));
            }
        });
    });
}
function shareToSession(data) {
    return new Promise((resolve, reject) => {
        nativeShareToSession(data);
        emitter.once('SendMessageToWX.Resp', resp => {
            if (resp.errCode === 0) {
                resolve(resp);
            }
            else {
                reject(new WechatError(resp));
            }
        });
    });
}
function shareToFavorite(data) {
    return new Promise((resolve, reject) => {
        nativeShareToFavorite(data);
        emitter.once('SendMessageToWX.Resp', resp => {
            if (resp.errCode === 0) {
                resolve(resp);
            }
            else {
                reject(new WechatError(resp));
            }
        });
    });
}
function pay(payload) {
    return new Promise((resolve, reject) => {
        NativeWeChat.pay(payload, (error) => {
            if (error)
                reject(new Error(error));
        });
        emitter.once('PayReq.Resp', (resp) => {
            if (resp.errCode === 0) {
                resolve(resp);
            }
            else {
                reject(new WechatError(resp));
            }
        });
    });
}
/**
 * promises will reject with this error when API call finish with an errCode other than zero.
 */
export class WechatError extends Error {
    constructor(resp) {
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
