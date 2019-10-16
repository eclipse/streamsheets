const getProperty = (path, parent) => {
	const name = path.shift();
	return (parent != null && name != null) ? getProperty(path, parent[name]) : parent;
};
class Validator {
	constructor(obj, parent) {
		this.obj = obj;
		this.parent = parent;
	}
	hasProperty(name, value) {
		const prop = this.obj[name];
		if (value != null) expect(prop).toEqual(value);
		else expect(prop).toBeDefined();
		return this;
	}
	hasNoProperty(name) {
		expect(this.obj[name]).toBeUndefined();
		return this;
	}
	validate(name) {
		const path = Array.isArray(name) ? name : name.split('.');
		const obj = getProperty(path, this.obj);
		expect(obj).toBeDefined();
		return new Validator(obj, this);
	}
	execute(func) {
		func(this.obj);
		return this;
	}
	expect(func, res) {
		expect(func(this.obj)).toEqual(res);
		return this;
	}
	done() {
		return this.parent;
	}
}

class TermValidator extends Validator {

	hasOperandType(type) {
		expect(this.obj.operand.isTypeOf(type)).toBe(true);
		return this;
	}
	hasValue(value) {
		expect(this.obj.value).toEqual(value);
		return this;
	}
	hasDescription(str) {
		expect(this.obj.toString()).toBe(str);
		return this;
	}
}


module.exports = {
	term: (t) => {
		expect(t).toBeDefined();
		return new TermValidator(t);
	}
};
