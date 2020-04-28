declare module '@cedalo/messaging-client' {
	class MessagingClient {
		connect(url: string, configuration?: any): Promise<any>;

		publish(topic: string, message: object | string): Promise<any>;

		subscribe(topic: string, options?: any): Promise<any>;

		unsubscribe(topic: string): Promise<any>;

		on(event: string, callback: (topic: string, message: string) => void): Promise<any>;

		end(): Promise<any>;
	}
}