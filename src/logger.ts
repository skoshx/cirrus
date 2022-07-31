import { consolePersist, getLogger, LogLevel, logLevels } from 'logpile';

export function getCirrusLogger() {
	const level: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'error';
	if (!logLevels.get(level))
		throw Error(
			`Invalid log level ${level}. Valid log levels are ${[...logLevels.keys()].join(', ')}`
		);
	return getLogger({
		persist: [consolePersist({ level })],
		retrieve: async () => []
	});
}

/* export const logger = getLogger({
	persist: [consolePersist({ level: ''})],
	retrieve: async () => []
}); */
