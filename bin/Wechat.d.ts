export declare enum WXErrCode {
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
    WXErrCodeUnsupport = -5
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
export interface ShareMetadata {
    type: 'news' | 'text' | 'imageUrl' | 'imageFile' | 'imageResource' | 'video' | 'audio' | 'file';
    thumbImage?: string;
    description?: string;
    webpageUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    musicUrl?: string;
    filePath?: string;
    fileExtension?: string;
}
/**
 * @method registerApp
 * @param {String} appId - the app id
 * @return {Promise}
 */
export declare const registerApp: (appId: string) => Promise<unknown>;
/**
 * Return if the wechat app is installed in the device.
 * @method isWXAppInstalled
 * @return {Promise}
 */
export declare const isWXAppInstalled: () => Promise<boolean>;
/**
 * Return if the wechat application supports the api
 * @platform iOS
 * @method isWXAppSupportApi
 * @return {Promise}
 */
export declare const isWXAppSupportApi: () => Promise<boolean>;
/**
 * Get the wechat app installed url
 * @method getWXAppInstallUrl
 * @return {String} the wechat app installed url
 */
export declare const getWXAppInstallUrl: () => Promise<string>;
/**
 * Get the wechat api version
 * @method getApiVersion
 * @return {String} the api version string
 */
export declare const getApiVersion: () => Promise<string>;
/**
 * Open wechat app
 * @method openWXApp
 * @return {Promise}
 */
export declare const openWXApp: () => Promise<void>;
export declare function sendAuthRequest(scopes: string, state?: string): Promise<AuthResponse>;
export declare function shareToTimeline(data: ShareMetadata): Promise<ShareResponse>;
export declare function shareToSession(data: ShareMetadata): Promise<ShareResponse>;
export declare function shareToFavorite(data: ShareMetadata): Promise<ShareResponse>;
export interface PaymentLoad {
    partnerId: string;
    prepayId: string;
    nonceStr: string;
    timeStamp: string;
    package: string;
    sign: string;
}
export declare function pay(payload: PaymentLoad): Promise<PayResponse>;
/**
 * promises will reject with this error when API call finish with an errCode other than zero.
 */
export declare class WechatError extends Error {
    code: number;
    constructor(resp: BaseResponse);
}
