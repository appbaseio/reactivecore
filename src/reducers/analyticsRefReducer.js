import { ADD_ANALYTICS_REF } from '../constants';

export default function analyticsRefReducer(state = {}, action) {
	if (action.type === ADD_ANALYTICS_REF) {
		return action.analyticsRef;
	}
	return state;
}
