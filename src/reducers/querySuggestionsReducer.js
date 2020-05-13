import { SET_QUERY_SUGGESTIONS } from '../constants';

export default function querySuggestionsReducer(state = {}, action) {
	if (action.type === SET_QUERY_SUGGESTIONS) {
		return {
			...state,
			[action.component]: action.suggestions.sort((suggFirst, suggSecond) => {
				const { count: countFirst } = suggFirst._source || {};
				const { count: countSecond } = suggSecond._source || {};
				return countSecond - countFirst;
			}),
		};
	}

	return state;
}
