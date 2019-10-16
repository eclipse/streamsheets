const IdGenerator = require('@cedalo/id-generator');

const touch = (document) => ({ ...document, lastModified: new Date().toISOString() });
const customGenerateId = (document, idGenerator) => ({ _id: idGenerator(), ...document });

const makeGenerateId = (idGenerator) => (document) => customGenerateId(document, idGenerator);
const generateId = makeGenerateId(() => IdGenerator.generate());

const sanitizeUpdate = (update) => {
	const copy = { ...update };
	delete copy.id;
	delete copy._id;
	return copy;
};
const applyUpdate = (document, partial) => ({ ...document, ...sanitizeUpdate(partial) });
// const addId = (document, id) => ({ ...document, _id: id });

module.exports = {
	touch,
	generateId,
	customGenerateId,
	makeGenerateId,
	applyUpdate
	// addId
};
