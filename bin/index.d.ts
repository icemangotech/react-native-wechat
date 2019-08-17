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
export declare type ShareMetadata = {
    type: 'text';
    description: string;
} | {
    type: 'news';
    title: string;
    description: string;
    webpageUrl: string;
} | {
    type: 'audio';
    title: string;
    description: string;
    musicUrl: string;
} | {
    type: 'imageUrl';
    title: string;
    description: string;
    imageUrl: string;
} | {
    type: 'video';
    title: string;
    description: string;
    videoUrl: string;
} | {
    type: 'file';
    title: string;
    description: string;
    filePath: string;
    fileExtension: string;
};
declare function sendAuthRequest(scopes: string, state?: string): Promise<AuthResponse>;
declare function shareToTimeline(data: ShareMetadata): Promise<ShareResponse>;
declare function shareToSession(data: ShareMetadata): Promise<ShareResponse>;
declare function shareToFavorite(data: ShareMetadata): Promise<ShareResponse>;
export interface PaymentLoad {
    partnerId: string;
    prepayId: string;
    nonceStr: string;
    timeStamp: string;
    package: string;
    sign: string;
}
declare function pay(payload: PaymentLoad): Promise<PayResponse>;
/**
 * promises will reject with this error when API call finish with an errCode other than zero.
 */
export declare class WechatError extends Error {
    code: number;
    constructor(resp: BaseResponse);
}
declare const Wechat: {
    pay: typeof pay;
    sendAuthRequest: typeof sendAuthRequest;
    shareToFavorite: typeof shareToFavorite;
    shareToSession: typeof shareToSession;
    shareToTimeline: typeof shareToTimeline;
    registerApp: (appId: string) => Promise<unknown>;
    openWXApp: () => Promise<void>;
    isWXAppInstalled: () => Promise<boolean>;
    isWXAppSupportApi: () => Promise<boolean>;
    getWXAppInstallUrl: () => Promise<string>;
    getApiVersion: () => Promise<string>;
};
export default Wechat;
