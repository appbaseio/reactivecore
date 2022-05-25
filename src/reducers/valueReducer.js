import {
	SET_VALUE,
	RESET_TO_DEFAULT,
	CLEAR_VALUES,
	REMOVE_COMPONENT,
	PATCH_VALUE,
} from '../constants';

export default function valueReducer(state = {}, action) {
	switch (action.type) {
		case SET_VALUE: {
			const newState = {};
			Object.keys(action.componentsToReset || {}).forEach((id) => {
				newState[id] = {
					...state[id],
					value: action.componentsToReset[id],
				};
			});
			return {
				...state,
				...newState,
				[action.component]: {
					value: action.value,
					label: action.label || action.component,
					showFilter: action.showFilter,
					URLParams: action.URLParams,
					componentType: action.componentType,
					category: action.category,
					meta: action.meta,
					reference: action.reference,
				},
			};
		}

		case PATCH_VALUE:
			return {
				...state,
				[action.component]: {
					...state[action.component],
					...action.payload,
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
		case REMOVE_COMPONENT: {
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
		case RESET_TO_DEFAULT:
			return {
				...state,
				...action.defaultValues,
			};
		default:
			return state;
	}
}
