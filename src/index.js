import { createStore, applyMiddleware, compose } from 'redux';
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
export { vueTypes, helper, causes, suggestions, Actions, storeKey };

const composeEnhancers
	= typeof window === 'object'
	&& window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
		: compose;

const enhancer = composeEnhancers(applyMiddleware(thunk));

export default function configureStore(initialState) {
	return createStore(
		rootReducer,
		initialState,
		enhancer,
	);
}
