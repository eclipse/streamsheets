const celljson = json => ({
	// eslint-disable-next-line
	isEqualTo: other => json.formula === other.formula && json.value === other.value && json.type === other.type && json.reference === other.reference
});

const description = cell => ({
	isEqualTo: (other) => {
		const descr = cell.description();
		return descr.formula === other.formula && descr.value === other.value;
	}
});


module.exports = {
	celljson,
	description
};
