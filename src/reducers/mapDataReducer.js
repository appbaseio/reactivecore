import { SET_MAP_DATA, REMOVE_COMPONENT } from '../constants';

export default function mapDataReducer(state = {}, action) {
	if (action.type === SET_MAP_DATA) {
		return {
			[action.componentId]: {
				query: action.query,
				persistMapQuery: action.persistMapQuery,
			},
		};
	} else if (action.type === REMOVE_COMPONENT) {
		const { [action.component]: del, ...obj } = state;
		return obj;
	}
	return state;
}
