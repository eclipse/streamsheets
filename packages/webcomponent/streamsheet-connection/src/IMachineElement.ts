import IMachineJSON from './IMachineJSON';

interface IMachineElement extends HTMLElement {

	readonly machineId: string;
	 
	// definition is machine-json
	setMachine<T extends IMachineJSON>(definition: T): void;

	// error is optional and only defined if subscribing failed...
	subscribedCallback(element: HTMLElement, error?: Error): void;

	unsubscribedCallback(element: HTMLElement): void;
}

export default IMachineElement;
