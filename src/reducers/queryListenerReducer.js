import { SET_QUERY_LISTENER, REMOVE_COMPONENT } from '../constants';

export default function queryListenerReducer(state = {}, action) {
	if (action.type === SET_QUERY_LISTENER) {
		return {
			[action.component]: {
				onQueryChange: action.onQueryChange,
				beforeQueryChange: action.beforeQueryChange,
			},
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
