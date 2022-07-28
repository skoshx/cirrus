// const React = require('react');
// const Chance = require('chance');
import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput, useStdin } from 'ink';
import { Spinner } from './spinner';
import { cpu, memory, statusToColor, time } from '../formatting';
import type { ProjectInfo } from '../init';

export const Table = ({ info }: { info: ProjectInfo }) => {
	const { isRawModeSupported } = useStdin();

	isRawModeSupported &&
		useInput((input) => {
			if (input === 'q') process.exit(0);
		});

	return (
		<Box flexDirection="column" paddingLeft={0.5} paddingRight={0.5} paddingTop={1}>
			<Text color={'cyanBright'} bold>
				{' '}
				&#127783;{'  '}Cirrus <Text color={'gray'}>(press 'q' to quit)</Text>
			</Text>

			<Box paddingBottom={1} flexDirection="column">
				<Text color={'cyanBright'} bold>
					Remote
				</Text>
				<Text color={'gray'} bold>
					{info.remote}
				</Text>
			</Box>

			<Box paddingBottom={1} flexDirection="column">
				<Text color={'cyanBright'} bold>
					Port
				</Text>
				<Text color={'gray'} bold>
					{info.ports.join(', ')}
				</Text>
			</Box>

			{/*<Box paddingBottom={1} flexDirection="column">
        <Text color={'cyanBright'} bold>
          Logs
        </Text>
        <Text color={'gray'} bold>
          {info.logFile}
        </Text>
        <Text color={'gray'} bold>
          {info.errorFile}
        </Text>
      </Box>*/}
		</Box>
	);
};

export function renderInfo(info: ProjectInfo) {
	render(<Table info={info} />);
}
