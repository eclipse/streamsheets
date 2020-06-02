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
import IMachineJSON from '../IMachineJSON';

interface IConverter {
	convert(machinedef: IMachineJSON, graphdef: JSON): JSON;
	convertStep(step: JSON): JSON;
	convertSheetUpdate(data: JSON): JSON;
}

export default IConverter;