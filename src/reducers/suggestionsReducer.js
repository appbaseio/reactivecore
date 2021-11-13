import { SET_SUGGESTIONS } from '../constants';

export default function suggestionsReducer(state = {}, action) {
	if (action.type === SET_SUGGESTIONS) {
		return {
			...state,
			[action.component]: action.suggestions,
		};
	}

	return state;
}
