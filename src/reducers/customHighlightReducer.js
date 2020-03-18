import { SET_CUSTOM_HIGHLIGHT_OPTIONS } from '../constants';

export default function customHighlightReducer(state = {}, action) {
	if (action.type === SET_CUSTOM_HIGHLIGHT_OPTIONS) {
		return {
			...state,
			[action.component]: action.data,
		};
	}

	return state;
}
