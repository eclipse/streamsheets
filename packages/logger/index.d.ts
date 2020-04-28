declare module '@cedalo/logger' {
	class Logger {
		debug(...args: any): void;
		info(...args: any): void;
		warn(...args: any): void;
		error(...args: any): void;
	}
	class LoggerFactory {
		static createLogger(name: string, level: string): Logger;
	}
}