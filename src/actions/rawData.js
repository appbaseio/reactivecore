import { SET_RAW_DATA } from '../constants';

// eslint-disable-next-line import/prefer-default-export
export function setRawData(component, response) {
	return {
		type: SET_RAW_DATA,
		component,
		response,
	};
}
