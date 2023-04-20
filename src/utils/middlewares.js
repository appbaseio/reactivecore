import { SET_AI_RESPONSE, SET_AI_RESPONSE_DELAYED } from '../constants';

export const aiResponseMiddleware = store => (next) => {
	const pendingActions = [];
	let isDispatching = false;

	const dispatchNextAction = () => {
		if (pendingActions.length === 0 || isDispatching) {
			return;
		}

		isDispatching = true;
		const action = pendingActions.shift();
		requestAnimationFrame(() => {
			store.dispatch(action);
			isDispatching = false;
			dispatchNextAction();
		});
	};

	return (action) => {
		if (action.type === SET_AI_RESPONSE_DELAYED) {
			pendingActions.push({ ...action, type: SET_AI_RESPONSE });
			dispatchNextAction();
		}
		return next(action);
	};
};

export default aiResponseMiddleware;
