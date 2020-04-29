/**
 * webRTC config file
 * 
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-01-17 12:04:01
 */

export const ENV: 'PRE' | 'PRD' | 'TXDEV' = 'PRD';
export const THIRD: boolean = true;

const SERVER_MAP: any = {
	TXDEV: {
		wssServer: 'wss://testdevapi.xylink.com',
		httpServer: 'https://testdevapi.xylink.com',
		baseServer: 'https://testdev.xylink.com',
		logServer: 'https://txdevlog.xylink.com'
	},
	PRE: {
		wssServer: 'wss://cloudapi.xylink.com',
		httpServer: 'https://cloudapi.xylink.com',
		baseServer: 'https://cloud.xylink.com',
		logServer: 'https://log.xylink.com'
	},
	PRD: {
		wssServer: 'wss://cloudapi.xylink.com',
		httpServer: 'https://cloudapi.xylink.com',
		baseServer: 'https://cloud.xylink.com',
		logServer: 'https://log.xylink.com'
	}
};

/**
 * 重要提示
 * 重要提示
 * 重要提示
 * PRODUCTION_ACCOUNT需要自行配置
 * 第三方登录，需要填写extId、clientId、clientSecret
 * 此值需要从对接负责人处获取
 * 重要提示
 * 重要提示
 * 重要提示
 */
const PRODUCTION_ACCOUNT = {
	extId: '',
	clientId: '',
	clientSecret: ''
};

const THIRD_ACCOUNT_MAP = {
	TXDEV: {
		extId: '',
		clientId: '',
		clientSecret: ''
	},
	PRE: PRODUCTION_ACCOUNT,
	PRD: PRODUCTION_ACCOUNT
};

export const SERVER = SERVER_MAP[ENV];
export const ACCOUNT: { extId: string; clientId: string; clientSecret: string } = THIRD_ACCOUNT_MAP[ENV];
