
// const React = require('react');
// const Chance = require('chance');
import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { Spinner } from './spinner';
import { AppInfo, AppLogs, AppOptions, getLogs, listApps } from '..';
import { cpu, memory, statusToColor, time } from '../formatting';

export const Logs = ({ logs: appLogs, app }: { logs: AppLogs, app: AppOptions }) => {
  const [logs, setLogs] = useState<AppLogs>(appLogs);

  useInput((input) => {
		if (input === 'q') process.exit(0);
	});

  useEffect(() => {
    const timer = setInterval(async () => {
      const logs = await getLogs(app);
      setLogs(logs ?? appLogs);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <Box flexDirection="column" paddingLeft={0.5} paddingRight={0.5} paddingTop={1}>
      <Text color={'cyanBright'} bold> &#127783;  Cirrus<Text color={'gray'}>(press 'q' to quit)</Text></Text>
      <Text color={'cyanBright'} bold>Logs for {logs.appName}</Text>
      <Box borderColor={'gray'} paddingTop={1}>
        {
          logs.log.slice(-5).map((log: string) => (
            <Text color={'gray'}>{log}</Text>
          ))
        }
      </Box>
      <Box borderColor={'redBright'} paddingTop={1}>
        {
          logs.error.slice(-5).map((log: string) => (
            <Text color={'gray'}>{log}</Text>
          ))
        }
      </Box>
    </Box>
  );
}

export function renderLogs(logs: AppLogs, app: AppOptions) {
  render(<Logs logs={logs} app={app} />);
}
