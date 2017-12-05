import { SET_STREAMING, REMOVE_COMPONENT } from "../constants";

export default function streamingReducer(state = {}, action) {
	if (action.type === SET_STREAMING) {
		return {
			...state,
			[action.component]: {
				status: action.status,
				ref: action.ref
			}
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
