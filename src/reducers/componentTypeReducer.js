import { ADD_COMPONENT, REMOVE_COMPONENT } from '../constants';

export default function componentTypeReducer(state = {}, action) {
	if (action.type === ADD_COMPONENT) {
		return {
			...state,
			[action.component]: action.name,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
