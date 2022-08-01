// const React = require('react');
// const Chance = require('chance');
import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput, useStdin } from 'ink';
import { Spinner } from './spinner';
import { cpu, memory, statusToColor, time } from '../formatting';
import { Deployment, Pm2AppInfo } from '../types';
import { getDeployments } from '../project';

export const Table = () => {
	const [infos, setInfos] = useState<(Deployment & Pm2AppInfo)[]>();

	const { isRawModeSupported } = useStdin();

	isRawModeSupported &&
		useInput((input) => {
			if (input === 'q') process.exit(0);
		});

	const fixedWidth = '16%';

	useEffect(() => {
		const timer = setInterval(async () => {
			const deployments = await getDeployments();
			setInfos(deployments ?? []);
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<Box flexDirection="column" paddingLeft={0.5} paddingRight={0.5} paddingTop={1}>
			<Text color={'cyanBright'} bold>
				{' '}
				&#127783;{'  '}Cirrus <Text color={'gray'}>(press 'q' to quit)</Text>
			</Text>
			<Box justifyContent={'space-between'} paddingTop={1}>
				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						app name
					</Text>
				</Box>

				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						port
					</Text>
				</Box>

				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						cpu
					</Text>
				</Box>

				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						memory
					</Text>
				</Box>

				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						uptime
					</Text>
				</Box>

				<Box width={fixedWidth}>
					<Text bold color={'cyanBright'}>
						status
					</Text>
				</Box>
			</Box>

			{infos && infos.length === 0 ? (
				<Box width={'100%'} paddingTop={1}>
					<Text color={'cyanBright'}>No projects found</Text>
					<Text color={'gray'}> (create a project `cirrus init project-name`)</Text>
				</Box>
			) : null}

			{infos === undefined && (
				<Box width={'100%'} paddingTop={1}>
					<Text color={'cyanBright'}>
						<Spinner />
					</Text>
				</Box>
			)}

			{infos &&
				infos.map((app) => (
					<Box key={app.name} justifyContent={'space-between'} paddingTop={1}>
						<Box width={fixedWidth}>
							<Text>{app.name}</Text>
						</Box>
						<Box width={fixedWidth}>
							<Text>{app.port}</Text>
						</Box>
						<Box width={fixedWidth}>
							<Text>{cpu(app.cpu ?? 0)}</Text>
						</Box>
						<Box width={fixedWidth}>
							<Text>{memory(app.memory ?? 0)}</Text>
						</Box>
						<Box width={fixedWidth}>
							<Text>{time(app.uptime)}</Text>
						</Box>
						<Box width={fixedWidth}>
							<Text color={statusToColor(app.status ?? 'stopped')}>{app.status ?? 'stopped'}</Text>
						</Box>
					</Box>
				))}
		</Box>
	);
};

export function renderList() {
	render(<Table />);
}
