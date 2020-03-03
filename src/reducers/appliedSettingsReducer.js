import { SET_APPLIED_SETTINGS } from '../constants';

export default function appliedSettingsReducer(state = {}, action) {
	if (action.type === SET_APPLIED_SETTINGS) {
		return {
			...state,
			[action.component]: action.data,
		};
	}

	return state;
}
