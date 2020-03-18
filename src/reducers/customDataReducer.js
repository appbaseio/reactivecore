import { SET_CUSTOM_DATA } from '../constants';

export default function customDataReducer(state = {}, action) {
	if (action.type === SET_CUSTOM_DATA) {
		return {
			...state,
			[action.component]: action.data,
		};
	}

	return state;
}
