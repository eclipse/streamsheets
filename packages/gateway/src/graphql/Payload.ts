import { InternalError } from '../errors';

const INTERNAL_ERROR_PAYLOAD = {
	success: false,
	code: 'INTERNAL_ERROR',
	message: 'An internal server error occured'
};

export interface Payload {
	code: string;
	success: boolean;
	message: string;
	[key: string]: any;
}

export const Payload = {
	createFailure: (error: any) => {
		if (InternalError.isInternal(error)) {
			return INTERNAL_ERROR_PAYLOAD;
		}
		return { ...error, success: false };
	},
	createSuccess: (payload: Partial<Payload>) => ({ ...payload, success: true })
};
