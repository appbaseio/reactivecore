import { SET_POPULAR_SUGGESTIONS } from '../constants';

export default function querySuggestionsReducer(state = {}, action) {
	if (action.type === SET_POPULAR_SUGGESTIONS) {
		return {
			...state,
			[action.component]: action.suggestions,
		};
	}

	return state;
}
