import { ADD_CONFIG, UPDATE_ANALYTICS_CONFIG, UPDATE_CONFIG } from '../constants';
import { defaultAnalyticsConfig } from '../utils/analytics';

export default function configReducer(
	state = {
		analyticsConfig: defaultAnalyticsConfig,
	},
	action,
) {
	if (action.type === ADD_CONFIG) {
		return {
			...state,
			analyticsConfig: {
				...defaultAnalyticsConfig,
				...action.analyticsConfig,
			},
		};
	} else if (action.type === UPDATE_ANALYTICS_CONFIG) {
		return {
			...state,
			analyticsConfig: {
				...state.analyticsConfig,
				...action.analyticsConfig,
			},
		};
	} else if (action.type === UPDATE_CONFIG) {
		return {
			...state,
			...action.config,
		};
	}
	return state;
}
