import { SET_LOADING, REMOVE_COMPONENT } from '../constants';

export default function loadingReducer(state = {}, action) {
	if (action.type === SET_LOADING) {
		let requestCount = state[`${action.component}_active`] || 0;
		if (action.isLoading) {
			requestCount += 1;
		} else if (requestCount) {
			requestCount -= 1;
		}
		return {
			...state,
			[action.component]: action.isLoading,
			[`${action.component}_active`]: requestCount,
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, [`${action.component}_active`]: del2, ...obj } = state;
		return obj;
	}
	return state;
}
