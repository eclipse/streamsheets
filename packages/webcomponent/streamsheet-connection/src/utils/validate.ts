const tagName = (element?: Element | null, name?: string): boolean =>
	!!name && !!element && element.tagName.toLowerCase() === name;


export default { tagName };