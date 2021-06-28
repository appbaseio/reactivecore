import {
	SET_VALUE,
	RESET_TO_DEFAULT,
	CLEAR_VALUES,
	REMOVE_COMPONENT,
	PATCH_VALUE,
} from '../constants';

export default function valueReducer(state = {}, action) {
	switch (action.type) {
		case SET_VALUE:
			return {
				...state,
				[action.component]: {
					value: action.value,
					label: action.label || action.component,
					showFilter: action.showFilter,
					URLParams: action.URLParams,
					componentType: action.componentType,
					category: action.category,
					meta: action.meta,
				},
			};
		case PATCH_VALUE:
			return {
				...state,
				[action.component]: {
					...state[action.component],
					...action.payload,
				},
			};
		case CLEAR_VALUES:
			return {};
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
