import { SET_PROPS, REMOVE_PROPS, UPDATE_PROPS } from '../constants';
import { validProps } from '../utils/constants';
import { removeComponentRawProps, setComponentRawProps } from './rawProps';

const getfilteredOptions = (options = {}) => {
	const filteredOptions = {};
	Object.keys(options).forEach((option) => {
		if (validProps.includes(option)) {
			filteredOptions[option] = options[option];
		}
	});
	return filteredOptions;
};
/**
 * Sets the external props for a component
 * @param {String} component
 * @param {Object} options
 */

export function setComponentProps(component, options, componentType) {
	return (dispatch) => {
		dispatch({
			type: SET_PROPS,
			component,
			options: getfilteredOptions({ ...options, componentType }),
		});
		dispatch(setComponentRawProps(component, options, componentType));
	};
}

/**
 * Updates the external props for a component, overrides the duplicates
 * @param {String} component
 * @param {Object} options
 */
export function updateComponentProps(component, options, componentType) {
	return {
		type: UPDATE_PROPS,
		component,
		options: getfilteredOptions({ ...options, componentType }),
	};
}

/**
 * Remove the external props for a component
 * @param {String} component
 * @param {Object} options
 */
export function removeComponentProps(component) {
	return (dispatch) => {
		dispatch({
			type: REMOVE_PROPS,
			component,
		});
		dispatch(removeComponentRawProps(component));
	};
}
