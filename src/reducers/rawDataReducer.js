import { SET_RAW_DATA, REMOVE_COMPONENT } from '../constants';

export default function rawDataReducer(state = {}, action) {
	if (action.type === SET_RAW_DATA) {
		return {
			...state,
			[action.component]: action.response,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
