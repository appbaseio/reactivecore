import {
	SET_GOOGLE_MAP_SCRIPT_ERROR,
	SET_GOOGLE_MAP_SCRIPT_LOADED,
	SET_GOOGLE_MAP_SCRIPT_LOADING,
} from '../constants';

const INITIAL_STATE = {
	loading: false,
	loaded: false,
	error: null,
};

export default function googleMapScriptReducer(state = INITIAL_STATE, action) {
	const {
		type, loading, loaded, error,
	} = action;
	if (type === SET_GOOGLE_MAP_SCRIPT_LOADING) {
		return {
			...INITIAL_STATE,
			loading,
		};
	} else if (type === SET_GOOGLE_MAP_SCRIPT_LOADED) {
		return {
			...INITIAL_STATE,
			loaded,
		};
	} else if (type === SET_GOOGLE_MAP_SCRIPT_ERROR) {
		return {
			...INITIAL_STATE,
			error,
		};
	}

	return state;
}
