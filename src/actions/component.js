import {
	ADD_COMPONENT,
	REMOVE_COMPONENT,
	WATCH_COMPONENT,
} from '../constants';

import { executeQuery } from './query';

export function addComponent(component, name = null) {
	return {
		type: ADD_COMPONENT,
		component,
		name,
	};
}

export function removeComponent(component) {
	return {
		type: REMOVE_COMPONENT,
		component,
	};
}

function updateWatchman(component, react) {
	return {
		type: WATCH_COMPONENT,
		component,
		react,
	};
}

export function watchComponent(component, react) {
	return (dispatch) => {
		dispatch(updateWatchman(component, react));
		dispatch(executeQuery(component));
	};
}
