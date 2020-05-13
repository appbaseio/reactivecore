import { SET_QUERY_SUGGESTIONS } from '../constants';

export default function querySuggestionsReducer(state = {}, action) {
	if (action.type === SET_QUERY_SUGGESTIONS) {
		return {
			...state,
			[action.component]: action.suggestions,
		};
	}

	return state;
}
