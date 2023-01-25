import { SET_RAW_PROPS, REMOVE_RAW_PROPS, UPDATE_RAW_PROPS } from '../constants';

/**
 * Sets the external props for a component
 * @param {String} component
 * @param {Object} options
 */
export function setComponentRawProps(component, options, componentType) {
	return {
		type: SET_RAW_PROPS,
		component,
		options: { ...options, componentType },
	};
}

/**
 * Updates the external props for a component, overrides the duplicates
 * @param {String} component
 * @param {Object} options
 */
export function updateComponentRawProps(component, options, componentType) {
	return {
		type: UPDATE_RAW_PROPS,
		component,
		options: { ...options, componentType },
	};
}

/**
 * Remove the external props for a component
 * @param {String} component
 * @param {Object} options
 */
export function removeComponentRawProps(component) {
	return {
		type: REMOVE_RAW_PROPS,
		component,
	};
}
