import { SET_VALUE, CLEAR_VALUES, PATCH_VALUE, SET_INTERNAL_VALUE } from '../constants';

export function setValue(component, value, label, showFilter, URLParams, componentType, category) {
	return {
		type: SET_VALUE,
		component,
		value,
		label,
		showFilter,
		URLParams,
		componentType,
		category,
	};
}

export function setInternalValue(component, value, componentType, category) {
	return {
		type: SET_INTERNAL_VALUE,
		component,
		value,
		componentType,
		category,
	};
}
/**
 * Patches the properties of the component
 * @param {String} component
 * @param {Object} payload
 */
export function patchValue(component, payload) {
	return {
		type: PATCH_VALUE,
		component,
		payload,
	};
}
export function clearValues() {
	return {
		type: CLEAR_VALUES,
	};
}
