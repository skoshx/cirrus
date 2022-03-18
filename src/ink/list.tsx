// const React = require('react');
// const Chance = require('chance');
import React, { useEffect, useState } from 'react';
import { render, Box, Text, useApp, useInput, useStdin } from 'ink';
import { Spinner } from './spinner';
import { cpu, memory, statusToColor, time } from '../formatting';
import { AppInfo, listApps, Pm2AppInfo } from '../process';

export const Table = ({ apps: appsx }: { apps: (AppInfo & Pm2AppInfo)[] }) => {
  const [infos, setInfos] = useState<(AppInfo & Pm2AppInfo)[]>([]);

  const { isRawModeSupported } = useStdin();

  isRawModeSupported &&
    useInput((input) => {
      if (input === 'q') process.exit(0);
    });

  const widthFromColumns = (info: AppInfo) =>
    `${1 / Object.keys(infos[0] ?? {}).length}%`;

  const fixedWidth = '16%';

  useEffect(() => {
    const timer = setInterval(async () => {
      const apps = await listApps();
      setInfos(apps ?? []);
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

      {infos.length === 0 ? (
        <Box width={'100%'} paddingTop={1}>
          <Text color={'cyanBright'}>
            <Spinner />
          </Text>
        </Box>
      ) : null}

      {infos.map((app) => (
        <Box key={app.appName} justifyContent={'space-between'} paddingTop={1}>
          <Box width={fixedWidth}>
            <Text>{app.appName}</Text>
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
            <Text color={statusToColor(app.status ?? 'stopped')}>
              {app.status ?? 'stopped'}
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export function renderList(apps: (AppInfo & Pm2AppInfo)[]) {
  render(<Table apps={apps} />);
}

// render(<Table />);
