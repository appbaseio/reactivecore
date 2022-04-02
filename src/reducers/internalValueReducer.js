import { SET_INTERNAL_VALUE, RESET_TO_DEFAULT, CLEAR_VALUES, REMOVE_COMPONENT } from '../constants';

export default function valueReducer(state = {}, action) {
	switch (action.type) {
		case SET_INTERNAL_VALUE:
			return {
				...state,
				[action.component]: {
					value: action.value,
					componentType: action.componentType,
					category: action.category,
					meta: action.meta,
				},
			};
		case CLEAR_VALUES: {
			const nextState = {};
			if (action.resetValues) {
				Object.keys(action.resetValues).forEach((componentId) => {
					nextState[componentId] = {
						...state[componentId],
						value: action.resetValues[componentId],
					};
				});
			}
			// clearAllBlacklistComponents has more priority over reset values
			if (Array.isArray(action.clearAllBlacklistComponents)) {
				Object.keys(state).forEach((componentId) => {
					if (action.clearAllBlacklistComponents.includes(componentId)) {
						nextState[componentId] = state[componentId];
					}
				});
			}
			return nextState;
		}
		case RESET_TO_DEFAULT:
			return {
				...state,
				...action.defaultValues,
			};
		case REMOVE_COMPONENT: {
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
		default:
			return state;
	}
}
