import { SET_INTERNAL_VALUE, CLEAR_VALUES, REMOVE_COMPONENT } from '../constants';

export default function valueReducer(state = {}, action) {
	switch (action.type) {
		case SET_INTERNAL_VALUE:
			return {
				...state,
				[action.component]: {
					value: action.value,
					componentType: action.componentType,
					category: action.category,
				},
			};
		case CLEAR_VALUES:
			return {};
		case REMOVE_COMPONENT:
		{
			const { [action.component]: del, ...obj } = state;
			return obj;
		}
		default:
			return state;
	}
}
