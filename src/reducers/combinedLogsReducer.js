import { LOG_COMBINED_QUERY, REMOVE_COMPONENT } from '../constants';

export default function combinedLogsReducer(state = {}, action) {
	if (action.type === LOG_COMBINED_QUERY) {
		return { ...state, [action.component]: action.query };
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
