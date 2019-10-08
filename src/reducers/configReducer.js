import { ADD_CONFIG, UPDATE_ANALYTICS_CONFIG } from '../constants';

export default function configReducer(state = {}, action) {
	if (action.type === ADD_CONFIG) {
		return action.config;
	} else if (action.type === UPDATE_ANALYTICS_CONFIG) {
		return {
			...state,
			analyticsConfig: {
				...state.analyticsConfig,
				...action.analyticsConfig,
			},
		};
	}
	return state;
}
