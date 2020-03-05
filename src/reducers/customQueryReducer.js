import { SET_CUSTOM_QUERY } from '../constants';

export default function customQueryReducer(state = {}, action) {
	if (action.type === SET_CUSTOM_QUERY) {
		return {
			...state,
			[action.component]: action.query,
		};
	}

	return state;
}
