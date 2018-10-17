import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import VueTypes from './utils/vueTypes';
import rootReducer from './reducers';
import { STORE_KEY } from './constants';
import * as Actions from './actions';
import * as helper from './utils/helper';

export { Actions };
export { helper };
export const storeKey = STORE_KEY;
export const vueTypes = VueTypes;
export default function configureStore(initialState) {
	return createStore(
		rootReducer,
		initialState,
		applyMiddleware(thunk),
	);
}
