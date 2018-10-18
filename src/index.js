import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import VueTypes from './utils/vueTypes';
import rootReducer from './reducers';
import { STORE_KEY } from './constants';
import * as Actions from './actions';
import * as helper from './utils/helper';
import * as suggestions from './utils/suggestions';
import * as causes from './utils/causes';


const storeKey = STORE_KEY;
const vueTypes = VueTypes;
export { helper, causes, suggestions, Actions, vueTypes, storeKey };
export default function configureStore(initialState) {
	return createStore(
		rootReducer,
		initialState,
		applyMiddleware(thunk),
	);
}
