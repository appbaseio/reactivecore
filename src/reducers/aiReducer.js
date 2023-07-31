import {
	REMOVE_AI_RESPONSE,
	SET_AI_RESPONSE,
	SET_AI_RESPONSE_ERROR,
	SET_AI_RESPONSE_LOADING,
} from '../constants';
import { AI_LOCAL_CACHE_KEY } from '../utils/constants';
import { getObjectFromLocalStorage, setObjectInLocalStorage } from '../utils/helper';

export default function aiReducer(state = {}, action) {
	if (action.type === SET_AI_RESPONSE) {
		setObjectInLocalStorage('AISessions', {
			...(getObjectFromLocalStorage(AI_LOCAL_CACHE_KEY) || {}),
			[action.component]: { ...(state[action.component] || {}), ...action.payload },
		});
		return {
			...state,
			[action.component]: {
				...(state[action.component] ? state[action.component] : {}),
				response: {
					...(state[action.component]
						? state[action.component] && state[action.component].response
						: {}),
					...action.payload,
				},
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
				...(action.meta || {}),
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
