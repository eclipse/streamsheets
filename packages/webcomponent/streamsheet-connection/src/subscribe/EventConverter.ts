import { EventMessage } from '../Events';
import Converter from './Converter';


class EventConverter {

	private converters = new Map<string, (ev: EventMessage) => any>();

	constructor() {
		this.converters.set('machine_step', Converter.convertStep);
		this.converters.set('sheet_update', Converter.convertSheetUpdate);
	}

	convert(event: EventMessage): EventMessage {
		const { machineId, srcId, type } = event;
		const convert = this.converters.get(type);
		if (convert) {
			const data = convert(event);
			const id = machineId || srcId;
			event = { data, machineId:id, type };
		}
		return event;
	}
}

export default EventConverter;
