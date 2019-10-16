const toUniCode = (cp) =>
	Object.entries(cp).reduce((all, [key, value]) => {
		// eslint-disable-next-line eqeqeq
		// if (value != key) all[key] = value;
		all[key] = value;
		return all;
	}, {});

const fromUniCode = (cp) =>
	Object.entries(cp).reduce((all, [key, value]) => {
		// eslint-disable-next-line eqeqeq
		// if (value != key) all[value] = key;
		all[value] = key;
		return all;
	}, {});

class UniCodeMapper {

	static of(cp) {
		const toCode = toUniCode(cp);
		const fromCode = fromUniCode(cp);
		return new UniCodeMapper(toCode, fromCode);
	}

	constructor(toCode, fromCode) {
		this.toCode = toCode;
		this.fromCode = fromCode;
	}

	toUniCode(nr) {
		return this.toCode[nr];
	}
	fromUniCode(nr) {
		return this.fromCode[nr];
	}
}

module.exports = UniCodeMapper;
