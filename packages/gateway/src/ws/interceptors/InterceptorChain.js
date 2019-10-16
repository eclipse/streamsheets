const Interceptor = require('./Interceptor');

module.exports = class InterceptorChain extends Interceptor {

	constructor() {
		super();
		this.interceptors = [];
	}

	add(interceptor) {
		if (interceptor) {
			this.interceptors.push(interceptor);
		}
	}

	start(interceptors, context) {
		return new Promise((resolve, reject) =>
			(interceptors.length ? resolve(context) : reject(new Error('No Interceptors added!'))));
	}

	beforeSendToClient(context) {
		const interceptors = this.interceptors;
		return interceptors
			.reduce((curr, next) => curr.then(res => next.beforeSendToClient(res)), this.start(interceptors, context));
	}

	beforeSendToServer(context) {
		const interceptors = this.interceptors;
		return interceptors
			.reduce((curr, next) => curr.then(res => next.beforeSendToServer(res)), this.start(interceptors, context));
	}
};
