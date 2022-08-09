import { SET_APPBASE_QUERY } from '../constants';

export default function appbaseQueryReducer(state = {}, action) {
	if (action.type === SET_APPBASE_QUERY) {
		return { ...state, ...action.query };
	}
	return state;
}
