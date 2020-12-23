import { SET_DEFAULT_POPULAR_SUGGESTIONS } from '../constants';

export default function defaultPopularSuggestions(state = {}, action) {
	if (action.type === SET_DEFAULT_POPULAR_SUGGESTIONS) {
		return {
			...state,
			[action.component]: action.suggestions,
		};
	}

	return state;
}
