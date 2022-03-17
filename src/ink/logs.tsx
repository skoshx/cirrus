// const React = require('react');
// const Chance = require('chance');
import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput, useStdin } from 'ink';
import { Spinner } from './spinner';
import { cpu, memory, statusToColor, time } from '../formatting';
import { AppOptionsType } from '../types';
import { AppLogs, getLogs } from '../process';

export const Logs = ({
  logs: appLogs,
  appName,
}: {
  logs: AppLogs;
  appName: string;
}) => {
  const [logs, setLogs] = useState<AppLogs>(appLogs);
  const { isRawModeSupported } = useStdin();

  isRawModeSupported &&
    useInput((input) => {
      if (input === 'q') process.exit(0);
    });

  useEffect(() => {
    const timer = setInterval(async () => {
      const logs = await getLogs(appName);
      setLogs(logs ?? appLogs);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <Box
      flexDirection="column"
      paddingLeft={0.5}
      paddingRight={0.5}
      paddingTop={1}
    >
      <Text color={'cyanBright'} bold>
        {' '}
        &#127783; Cirrus <Text color={'gray'}>(press 'q' to quit)</Text>
      </Text>

      <Box paddingTop={1} paddingBottom={1} flexDirection="column">
        <Text color={'redBright'} bold>
          Error logs
        </Text>
        {logs.error.length === 0 ? (
          <Text color={'gray'}>No error logs found</Text>
        ) : null}
        {logs.error.slice(-5).map((log: string, index: number) => (
          <Text color={'gray'} key={log + index}>
            {log}
          </Text>
        ))}
      </Box>

      <Box paddingTop={1} paddingBottom={1} flexDirection="column">
        <Text color={'cyan'} bold>
          Logs
        </Text>
        {logs.log.length === 0 ? (
          <Text color={'gray'}>No logs found</Text>
        ) : null}
        {logs.log.slice(-5).map((log: string, index: number) => (
          <Text color={'gray'} key={log + index}>
            {log}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

export function renderLogs(logs: AppLogs, appName: string) {
  render(<Logs logs={logs} appName={appName} />);
}
