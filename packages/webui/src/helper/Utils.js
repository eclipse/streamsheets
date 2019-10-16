export default class Utils {
	static deepCopy(o) {
		const output = Array.isArray(o) ? [] : {};
		Object.keys(o).forEach((key) => {
			const v = o[key];
			output[key] = (typeof v === 'object') ? Utils.deepCopy(v) : v;
		});
		return output;
	}

	static formatDateString(s = '') {
		if(!Number.isNaN(Date.parse(s))) {
			const d = new Date(s);
			return `${d.toLocaleDateString()}:${d.toLocaleTimeString()}`;
		}
		return '';
	};
}
