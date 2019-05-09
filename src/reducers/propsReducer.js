import { SET_PROPS, UPDATE_PROPS, REMOVE_PROPS, REMOVE_COMPONENT } from '../constants';

export default function queryOptionsReducer(state = {}, action) {
	switch (action.type) {
		case SET_PROPS:
			return { ...state, [action.component]: action.options };
		case UPDATE_PROPS:
			return {
				...state,
				[action.component]: { ...state[action.component], ...action.options },
			};
		case REMOVE_PROPS:
		case REMOVE_COMPONENT: {
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
		default:
			return state;
	}
}
