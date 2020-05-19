import { SET_CUSTOM_DATA, REMOVE_COMPONENT } from '../constants';

export default function customDataReducer(state = {}, action) {
	if (action.type === SET_CUSTOM_DATA) {
		return {
			...state,
			[action.component]: action.data,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
