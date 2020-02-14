import { MachineServerMessagingProtocol, GatewayMessagingProtocol } from '@cedalo/protocols';
import { MessageContext } from '../ProxyConnection';
import { LoggerFactory } from '@cedalo/logger';

const logger = LoggerFactory.createLogger('AuthorizationInterceptor', process.env.STREAMSHEETS_LOG_LEVEL || 'info');

const REJECT_ALL = false;

interface Interceptor {
	beforeSendToClient(context: MessageContext): Promise<MessageContext>;
	beforeSendToServer(context: MessageContext): Promise<MessageContext>;
}

export default class AuthorizationInterceptor implements Interceptor {
	private config: any;
	constructor(config?: any) {
		this.config = config;
	}

	beforeSendToClient(context: MessageContext) {
		// console.log('TO CLIENT', context.message);
		return REJECT_ALL ? Promise.reject(new Error('Unknown user')) : Promise.resolve(context);
	}

	async beforeSendToServer(context: MessageContext) {
		console.log('TO SERVER', context.message);
		const { auth, message } = context;
		const machine = await context.api.machine.findMachine(message.machineId || '');
		if(!machine){
			return context;
		}
		// const { command, machineId } = message;
		// const streamsheetId = message.streamsheetId || command.streamsheetId;
		switch (message.type) {
			case MachineServerMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE: {
				switch (message.command.name) {
					case 'command.RemoveSelectionCommand':
					case 'command.AddItemCommand':
					case 'command.CompoundCommand':
					case 'command.ResizeItemCommand':
					case 'command.RotateNodeCommand':
					case 'command.CellAttributesCommand':
					case 'command.SetAttributeAtPathCommand':
					case 'command.SetSelectionCommand':
					case 'command.DeleteCellContentCommand':
					case 'command.SetCellDataCommand':
					case 'command.SetGraphCellsCommand':
					case 'command.UpdateGraphCellsCommand':
					case 'command.UpdateSheetNamesCommand':
					case 'command.ExecuteFunctionCommand':
						await auth.verifyMachine('edit_graph', machine);
						break;
					case 'command.SetCellsCommand':
						await auth.verifyMachine('set_cell', machine);
						break;
					case 'command.SetCellLevelsCommand':
						await auth.verifyMachine('set_cell_level', machine);
						break;
					default:
						logger.info(`Unknown Command Type: ${message.command.name}`);
						await auth.verifyMachine('edit_graph', machine);
				}
				break;
			}
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE: {
				if (machine.isTemplate) {
					await auth.verifyMachine('create', machine);
				} else {
					await auth.verifyMachine('view', machine);
				}
				break;
			}
			case MachineServerMessagingProtocol.MESSAGE_TYPES.GET_MACHINE_MESSAGE_TYPE:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.OPEN_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('view', machine);
				break;
			// case MachineServerMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE: UNUSED?
			// case MachineServerMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_MACHINE_MESSAGE_TYPE: UNUSED?
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE:
				await auth.verifyMachine('set_update_interval', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.START_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('start', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.PAUSE_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('pause', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STOP_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('stop', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STEP_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('step', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE:
				await auth.verifyMachine('set_cycle_time', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.UNLOAD_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('unload', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('delete', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.RENAME_MACHINE_MESSAGE_TYPE:
				await auth.verifyMachine('rename', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STREAMSHEET_STREAM_UPDATE_TYPE:
				await auth.verifyMachine('set_sheet_settings', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.MACHINE_UPDATE_SETTINGS:
				await auth.verifyMachine('set_machine_settings', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_LOCALE_MESSAGE_TYPE:
				await auth.verifyMachine('set_locale', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.CREATE_STREAMSHEET_MESSAGE_TYPE:
				await auth.verifyMachine('add_sheet', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.DELETE_STREAMSHEET_MESSAGE_TYPE:
				await auth.verifyMachine('delete_sheet', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.STREAMSHEETS_ORDER_MESSAGE_TYPE:
				await auth.verifyMachine('set_sheet_order', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.ADD_INBOX_MESSAGE:
				await auth.verifyMachine('add_inbox_message', machine);
				break;
			case MachineServerMessagingProtocol.MESSAGE_TYPES.LOAD_SHEET_CELLS:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_SHEET_CELLS:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_NAMED_CELLS:
			case MachineServerMessagingProtocol.MESSAGE_TYPES.SET_GRAPH_CELLS:
				await auth.verifyMachine('set_cell', machine);
				break;

			default:
				throw new Error(`Unknown Request Type: ${context.message.type}`);
		}
		return context;
	}
}
