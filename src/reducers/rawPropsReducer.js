import { SET_RAW_PROPS, UPDATE_RAW_PROPS, REMOVE_RAW_PROPS } from '../constants';

export default function rawComponentPropsReducer(state = {}, action) {
	switch (action.type) {
		case SET_RAW_PROPS:
			return { ...state, [action.component]: action.options };
		case UPDATE_RAW_PROPS:
			return {
				...state,
				[action.component]: { ...state[action.component], ...action.options },
			};
		case REMOVE_RAW_PROPS: {
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
		default:
			return state;
	}
}
