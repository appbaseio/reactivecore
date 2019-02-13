import { SET_PROMOTED_RESULTS } from '../constants';

export default function promotedResultsReducer(state = [], action) {
	if (action.type === SET_PROMOTED_RESULTS) {
		const results = action.results.map(item => ({ ...item, _promoted: true }));
		return results;
	}

	return state;
}
