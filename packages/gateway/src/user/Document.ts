import IdGenerator from '@cedalo/id-generator';

export const touch = <T extends object>(document: T): T & { lastModified: string } => ({
	...document,
	lastModified: new Date().toISOString()
});
export const customGenerateId = <T extends any>(document: T, idGenerator: () => string): T & { _id: string } => ({
	_id: idGenerator(),
	...document
});

export const makeGenerateId = <T extends any>(idGenerator: () => string) => (document: T): T & { _id: string } =>
	customGenerateId(document, idGenerator);
export const generateId: <T extends any>(document: T) => T & { _id: string } = makeGenerateId(() =>
	IdGenerator.generate()
);

const sanitizeUpdate = (update: any) => {
	const copy = { ...update };
	delete copy.id;
	delete copy._id;
	return copy;
};
export const applyUpdate = (document: object, partial: object) => ({ ...document, ...sanitizeUpdate(partial) });
// const addId = (document, id) => ({ ...document, _id: id });
