import { SET_AI_RESPONSE, SET_AI_RESPONSE_DELAYED, SET_AI_RESPONSE_LOADING } from '../constants';

export const aiResponseMiddleware = store => (next) => {
	const pendingActions = {};
	const isDispatching = {};

	const dispatchNextAction = (componentId) => {
		if (pendingActions[componentId].length === 0 || isDispatching[componentId]) {
			return;
		}

		isDispatching[componentId] = true;
		const action = pendingActions[componentId].shift();
		requestAnimationFrame(() => {
			store.dispatch(action);
			isDispatching[componentId] = false;
			dispatchNextAction(componentId);
		});
	};

	return (action) => {
		if (action.type === SET_AI_RESPONSE_DELAYED) {
			const { component } = action;
			if (!pendingActions[component]) {
				pendingActions[component] = [];
				isDispatching[component] = false;
			}
			pendingActions[component].push({ ...action, type: SET_AI_RESPONSE });
			dispatchNextAction(component);
		} else if (action.type === SET_AI_RESPONSE_LOADING && action.isLoading) {
			const { component } = action;
			if (pendingActions[component]) {
				pendingActions[component] = [];
				isDispatching[component] = false;
			}
		}
		return next(action);
	};
};

export default aiResponseMiddleware;
