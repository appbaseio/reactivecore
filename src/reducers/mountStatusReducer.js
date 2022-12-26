import { SET_COMPONENT_MOUNTED } from '../constants';

export default function mountStatusReducer(state = {}, action) {
	if (action.type === SET_COMPONENT_MOUNTED && !state.component && action.component) {
		return {
			...state,
			[action.component.replace(/__internal+$/, '')]: true,
		};
	}
	return state;
}
