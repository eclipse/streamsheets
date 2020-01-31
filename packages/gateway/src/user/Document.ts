import IdGenerator from '@cedalo/id-generator';

export const touch = (document: object) => ({ ...document, lastModified: new Date().toISOString() });
export const customGenerateId = (document: object, idGenerator: () => string) => ({ _id: idGenerator(), ...document });

export const makeGenerateId = (idGenerator: () => string) => (document: object) =>
	customGenerateId(document, idGenerator);
export const generateId = makeGenerateId(() => IdGenerator.generate());

const sanitizeUpdate = (update: any) => {
	const copy = { ...update };
	delete copy.id;
	delete copy._id;
	return copy;
};
export const applyUpdate = (document: object, partial: object) => ({ ...document, ...sanitizeUpdate(partial) });
// const addId = (document, id) => ({ ...document, _id: id });
