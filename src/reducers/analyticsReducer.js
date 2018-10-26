import { SET_VALUE, SET_SEARCH_ID } from '../constants';

const initialState = {
	searchValue: null,
	searchId: null,
};

const searchComponents = ['DATASEARCH', 'CATEGORYSEARCH'];

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
		default:
			return state;
	}
}
