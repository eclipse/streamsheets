export const toggle = (set, value) => {
	const copy = new Set([...set]);
	if (copy.has(value)) {
		copy.delete(value);
	} else {
		copy.add(value);
	}
	return copy;
};

export const addAll = (set, values) => new Set([...set, ...values]);

export const deleteAll = (set, values) => {
	const toRemove = new Set(values);
	return new Set([...set].filter((v) => !toRemove.has(v)));
};
