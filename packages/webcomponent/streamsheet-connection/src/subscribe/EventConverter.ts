/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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
