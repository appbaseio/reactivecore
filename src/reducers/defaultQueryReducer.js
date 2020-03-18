import { SET_DEFAULT_QUERY } from '../constants';

export default function defaultQueryReducer(state = {}, action) {
	if (action.type === SET_DEFAULT_QUERY) {
		return {
			...state,
			[action.component]: action.query,
		};
	}

	return state;
}
