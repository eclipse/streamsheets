declare module '@cedalo/service-core' {
	class MessagingRequestHelper {
		constructor(messagingClient: any);
		doRequestMessage(request: { message: any; topic: string }): Promise<any>;
	}
}