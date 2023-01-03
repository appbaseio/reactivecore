import {
	SET_REGISTERED_COMPONENT_TIMESTAMP,
	REMOVE_REGISTERED_COMPONENT_TIMESTAMP,
} from '../constants';

export default function timestampReducer(state = {}, action) {
	if (action.type === SET_REGISTERED_COMPONENT_TIMESTAMP) {
		return {
			...state,
			[action.component]: action.timestamp,
		};
	} else if (action.type === REMOVE_REGISTERED_COMPONENT_TIMESTAMP) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
