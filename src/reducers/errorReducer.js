import { SET_ERROR, REMOVE_COMPONENT } from '../constants';

export default function errorReducer(state = {}, action) {
	if (action.type === SET_ERROR) {
		return { ...state, [action.component]: action.error };
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
