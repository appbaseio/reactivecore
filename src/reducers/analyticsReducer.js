import {
	SET_VALUE,
	SET_SEARCH_ID,
	SET_SUGGESTIONS_SEARCH_VALUE,
	CLEAR_SUGGESTIONS_SEARCH_VALUE,
	SET_SUGGESTIONS_SEARCH_ID,
} from '../constants';
import { componentTypes } from '../utils/constants';

const initialState = {
	searchValue: null,
	searchId: null,
	// Maintain the suggestions analytics separately
	suggestionsSearchId: null,
	suggestionsSearchValue: null,
};

const searchComponents = [componentTypes.dataSearch, componentTypes.categorySearch];

export default function analyticsReducer(state = initialState, action) {
	switch (action.type) {
		case SET_VALUE:
			if (searchComponents.includes(action.componentType)) {
				return {
					searchValue: action.value,
					searchId: null,
				};
			}
			return state;
		case SET_SEARCH_ID:
			return {
				...state,
				searchId: action.searchId,
			};
		case SET_SUGGESTIONS_SEARCH_VALUE:
			return {
				...state,
				suggestionsSearchValue: action.value,
				suggestionsSearchId: null,
			};
		case SET_SUGGESTIONS_SEARCH_ID:
			return {
				...state,
				suggestionsSearchId: action.searchId,
			};
		case CLEAR_SUGGESTIONS_SEARCH_VALUE:
			return {
				...state,
				suggestionsSearchValue: null,
				suggestionsSearchId: null,
			};
		default:
			return state;
	}
}
