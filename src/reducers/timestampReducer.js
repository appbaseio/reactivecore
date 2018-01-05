import { SET_TIMESTAMP, REMOVE_COMPONENT } from '../constants';

export default function timestampReducer(state = {}, action) {
	if (action.type === SET_TIMESTAMP) {
		return {
			...state,
			[action.component]: action.timestamp,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
