import {
	REMOVE_AI_RESPONSE,
	SET_AI_RESPONSE,
	SET_AI_RESPONSE_ERROR,
	SET_AI_RESPONSE_LOADING,
} from '../constants';

export default function aiReducer(state = {}, action) {
	if (action.type === SET_AI_RESPONSE) {
		return {
			...state,
			[action.component]: {
				...(state[action.component] ? state[action.component] : {}),
				response: action.payload,
				isLoading: false,
				error: null,
			},
		};
	} else if (action.type === REMOVE_AI_RESPONSE) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	} else if (action.type === SET_AI_RESPONSE_ERROR) {
		return {
			...state,
			[action.component]: {
				...(state[action.component] ? state[action.component] : {}),
				error: action.error,
				isLoading: false,
				response: null,
			},
		};
	} else if (action.type === SET_AI_RESPONSE_LOADING) {
		return {
			...state,
			[action.component]: {
				...(state[action.component] ? state[action.component] : {}),
				isLoading: action.isLoading,
			},
		};
	}
	return state;
}
