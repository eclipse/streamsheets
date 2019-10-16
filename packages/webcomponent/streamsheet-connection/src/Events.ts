export type EventMessage = {
	type: string;
	[idx: string]: any;
};

export type EventHandler = (ev: EventMessage) => void;
