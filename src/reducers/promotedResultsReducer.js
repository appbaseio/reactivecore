import { SET_PROMOTED_RESULTS, REMOVE_COMPONENT } from '../constants';

export default function promotedResultsReducer(state = {}, action) {
	if (action.type === SET_PROMOTED_RESULTS) {
		return {
			...state,
			[action.component]: action.results.map(item => ({ ...item, _promoted: true })),
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}

	return state;
}
