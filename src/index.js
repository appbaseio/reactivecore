import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';
import { STORE_KEY } from './constants';
import * as Actions from './actions';
import * as helper from './utils/helper';
import Suggestions from './utils/suggestions';
import constants from './utils/constants';
import polyfills from './utils/polyfills';
import Causes from './utils/causes';
import valueReducer from './reducers/valueReducer';
import queryReducer from './reducers/queryReducer';
import queryOptionsReducer from './reducers/queryOptionsReducer';
import dependencyTreeReducer from './reducers/dependencyTreeReducer';
import propsReducer from './reducers/propsReducer';
import { defaultAnalyticsConfig } from './utils/analytics';

const storeKey = STORE_KEY;
const suggestions = Suggestions;
const causes = Causes;
const Reducers = {
	valueReducer,
	queryOptionsReducer,
	queryReducer,
	dependencyTreeReducer,
	propsReducer,
};
export { helper, causes, suggestions, Actions, storeKey, Reducers, constants, polyfills };

const composeEnhancers
	= typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
		: compose;

const enhancer = composeEnhancers(applyMiddleware(thunk));

export default function configureStore(initialState) {
	const finalInitialState = {
		...initialState,
		config: {
			...initialState.config,
			lock: false,
			analyticsConfig:
				initialState.config && initialState.config.analyticsConfig
					? {
						...defaultAnalyticsConfig,
						...initialState.config.analyticsConfig,
					  }
					: defaultAnalyticsConfig,
		},
	};
	return createStore(rootReducer, finalInitialState, enhancer);
}
