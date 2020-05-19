import { SET_DEFAULT_QUERY, REMOVE_COMPONENT } from '../constants';

export default function defaultQueryReducer(state = {}, action) {
	if (action.type === SET_DEFAULT_QUERY) {
		return {
			...state,
			[action.component]: action.query,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}

	return state;
}
