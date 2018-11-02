import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import { STORE_KEY } from './constants';
import * as Actions from './actions';
import * as helper from './utils/helper';
import Suggestions from './utils/suggestions';
import Causes from './utils/causes';

const storeKey = STORE_KEY;
const suggestions = Suggestions;
const causes = Causes;
export { helper, causes, suggestions, Actions, storeKey };

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
