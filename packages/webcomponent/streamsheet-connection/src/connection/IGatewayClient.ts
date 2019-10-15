import { EventHandler } from '../Events';

interface IGatewayClient {
	on(evtpype: string, handler: EventHandler): void;
	off(evtype: string, handler: EventHandler): void;
	confirmProcessedMachineStep(machineId: string): Promise<any>;
}

export default IGatewayClient;
