import { SET_HEADERS } from '../constants';

export default function headersReducer(state = {}, action) {
	if (action.type === SET_HEADERS) {
		return action.headers;
	}
	return state;
}
