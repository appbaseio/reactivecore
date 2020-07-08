import { SET_QUERY_TO_HITS, REMOVE_COMPONENT } from '../constants';

export default function queryToHitsReducer(state = {}, action) {
	if (action.type === SET_QUERY_TO_HITS) {
		return {
			...state,
			[action.component]: action.query,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}

	return state;
}
