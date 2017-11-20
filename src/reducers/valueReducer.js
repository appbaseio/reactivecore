import { SET_VALUE, CLEAR_VALUES, REMOVE_COMPONENT } from "../constants";

export default function valueReducer(state = {}, action) {
	if (action.type === SET_VALUE) {
		return {
			...state,
			[action.component]: {
				value: action.value,
				label: action.label || action.component
			}
		};
	} else if (action.type === CLEAR_VALUES) {
		return {};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
