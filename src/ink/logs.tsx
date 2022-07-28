import React, { useEffect, useState } from 'react';
import { render, Box, Text, useInput, useStdin } from 'ink';
import { getLogs, NewAppLog } from '../init';

export const Logs = ({
	logs: appLogs,
	projectName
}: {
	logs: NewAppLog[];
	projectName: string;
}) => {
	const [logs, setLogs] = useState<NewAppLog[]>(appLogs);
	const { isRawModeSupported } = useStdin();

	isRawModeSupported &&
		useInput((input) => {
			if (input === 'q') process.exit(0);
		});

	useEffect(() => {
		const timer = setInterval(async () => {
			const logs = await getLogs(projectName);
			setLogs(logs ?? appLogs);
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const appLogElements = logs.map((logs: NewAppLog, index: number) => {
		return (
			<Box key={`${logs.deploymentName}-${index}`} display={'flex'} flexDirection={'column'}>
				<Box paddingTop={1} paddingBottom={1} flexDirection="column">
					<Text color={'redBright'} bold>
						Error logs ({logs.deploymentName})
					</Text>
					{logs.errors.length === 0 ? <Text color={'gray'}>No error logs found</Text> : null}
					{logs.errors.slice(-15).map((log: string, index: number) => (
						<Text color={'gray'} key={log + index}>
							{log}
						</Text>
					))}
				</Box>

				<Box paddingTop={1} paddingBottom={1} flexDirection="column">
					<Text color={'white'} bold>
						Logs ({logs.deploymentName})
					</Text>
					{logs.logs.length === 0 ? <Text color={'gray'}>No logs found</Text> : null}
					{logs.logs.slice(-15).map((log: string, index: number) => (
						<Text color={'gray'} key={log + index}>
							{log}
						</Text>
					))}
				</Box>
			</Box>
		);
	});
	return (
		<Box flexDirection="column" paddingLeft={0.5} paddingRight={0.5} paddingTop={1}>
			<Text color={'cyanBright'} bold>
				{' '}
				&#127783;{'  '}Cirrus <Text color={'gray'}>(press 'q' to quit)</Text>
			</Text>

			{appLogElements}
		</Box>
	);
};

export function renderLogs(logs: NewAppLog[], projectName: string) {
	render(<Logs logs={logs} projectName={projectName} />);
}
