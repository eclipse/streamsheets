const down = (element: Element, func: (el: Element) => boolean): boolean => {
	let stop = func(element);
	if (!stop) {
		const kids = element.children;
		for (let i = 0; i < kids.length && !stop; i += 1) {
			const el = kids.item(i);
			if (el) stop = down(el, func);
		}
	}
	return stop;
};

const up = (element: Element, func: (el: Element) => boolean): boolean => {
	const stop = !element || func(element);
	const parent = !stop && element.parentElement;
	if (parent) up(parent, func);
	return stop;
};

export default { down, up };