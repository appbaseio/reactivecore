import { SET_RAW_DATA } from '../constants';

export default function rawDataReducer(state = {}, action) {
	if (action.type === SET_RAW_DATA) {
		return {
			...state,
			[action.component]: action.response,
		};
	}
	return state;
}
