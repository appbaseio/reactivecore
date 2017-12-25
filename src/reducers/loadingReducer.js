import { SET_LOADING, REMOVE_COMPONENT } from '../constants';

export default function loadingReducer(state = {}, action) {
	if (action.type === SET_LOADING) {
		return { ...state, [action.component]: action.isLoading };
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
