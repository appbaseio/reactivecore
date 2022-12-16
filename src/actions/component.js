import {
	ADD_COMPONENT,
	REMOVE_COMPONENT,
	WATCH_COMPONENT,
	SET_REGISTERED_COMPONENT_TIMESTAMP,
} from '../constants';

import { executeQuery } from './query';

function addComponentToList(component) {
	return {
		type: ADD_COMPONENT,
		component,
	};
}

function addComponentTimestamp(component, timestamp) {
	return {
		type: SET_REGISTERED_COMPONENT_TIMESTAMP,
		component,
		timestamp,
	};
}
export function addComponent(component) {
	return (dispatch) => {
		dispatch(addComponentToList(component));
		dispatch(addComponentTimestamp(component, new Date().getTime()));
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
