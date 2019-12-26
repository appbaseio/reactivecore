import { SET_PROMOTED_RESULTS } from '../constants';

export default function promotedResultsReducer(state = {}, action) {
	if (action.type === SET_PROMOTED_RESULTS) {
		return {
			...state,
			[action.component]: action.results.map(item => ({ ...item, _promoted: true })),
		};
	}

	return state;
}
