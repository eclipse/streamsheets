import IMachineJSON from '../IMachineJSON';

interface IConverter {
	convert(machinedef: IMachineJSON, graphdef: JSON): JSON;
	convertStep(step: JSON): JSON;
	convertSheetUpdate(data: JSON): JSON;
}

export default IConverter;