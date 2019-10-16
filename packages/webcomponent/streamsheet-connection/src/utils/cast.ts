const elementToType = <T extends Element>(el?: Element | null, cond?: (el: Element) => boolean): T | undefined =>
	el && cond && cond(el) ? (el as T) : undefined;

export default { elementToType };