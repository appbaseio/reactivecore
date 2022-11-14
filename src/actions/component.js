import { ADD_COMPONENT, REMOVE_COMPONENT, WATCH_COMPONENT } from '../constants';

import { executeQuery } from './query';

export function addComponent(component) {
	return {
		type: ADD_COMPONENT,
		component,
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

export function watchComponent(component, react, execute = true) {
	return (dispatch) => {
		dispatch(updateWatchman(component, react));
		if (execute) dispatch(executeQuery(component));
	};
}
