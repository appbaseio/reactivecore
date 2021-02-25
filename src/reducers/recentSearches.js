import {
	RECENT_SEARCHES_SUCCESS,
	RECENT_SEARCHES_ERROR,
} from '../constants';

export default function recentSearchesReducer(state = {}, action) {
	if (action.type === RECENT_SEARCHES_SUCCESS) {
		return {
			error: null,
			data: action.data,
		};
	} else if (action.type === RECENT_SEARCHES_ERROR) {
		return {
			error: action.error,
		};
	}
	return state;
}
