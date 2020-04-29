/**
 * Type interface
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2020-04-01 17:46:13
 */

export interface IDisconnected {
	code: number;
	msg: string;
	detail: {
		message: string;
		key: string;
	};
}

export interface IParticipantCount {
	participantsNum: number;
}

export interface IRoster {
	deviceType: string;
	endpointId: string;
	displayName: string;
  mediagroupid: number;
	participantId: number;
	audioTxMute: boolean;
	videoTxMute: boolean;
	audioRxMute: boolean;
	videoRxMute: boolean;
	videoMuteReason: number;
	isForceFullScreen: boolean;
	isLastAdd: boolean;
	onHold: boolean;
	isPolling: boolean;
	isContent: boolean;
}

export interface ILayout {
	roster: IRoster;
	position: number[];
	seat: number;
	status: string;
	stream: {
		video: null | MediaStream;
		videoTrackId: null | string;
		isExist: boolean;
		track: MediaStreamTrack;
	};
	display: boolean;
	deal: boolean;
	positionInfo?: {
		width: number;
		height: number;
	};
	positionStyle?: {
		left: string;
		top: string;
		width: string;
		height: string;
	};
	rotate: any;
}

export interface IScreenInfo {
	rateWidth: number;
	rateHeight: number;
	width: number;
	height: number;
	isWidth: boolean;
}

export interface IAudioTrack {
	status: string;
	data: {
		streams: MediaStream[];
		track: MediaStreamTrack;
	};
}

export interface ICallStatus {
	code: number;
	msg: string;
	detail: string;
}

export interface IAudioStatus {
	disableMute: boolean;
	muteOperation: 'unmute' | 'mute' | '';
}

export interface ISpeakerInfo {
	speakerInfo: {
		endpointId: string;
		pid: number;
	};
}
