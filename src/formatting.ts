import ms from 'ms';
import { ProcessStatus } from '.';
import { ForegroundColor } from 'chalk';

export const time = (time: number) => ms(time, { long: true });

export const memory = (memory: number) => (memory > 1048576 ? (memory / 1048576).toFixed(2) + ' mb' : (memory / 1024).toFixed(2) + ' kb');

export const cpu = (cpu: number) => cpu.toFixed(2) + "%";


/*

declare type ForegroundColor =
	| 'black'
	| 'red'
	| 'green'
	| 'yellow'
	| 'blue'
	| 'magenta'
	| 'cyan'
	| 'white'
	| 'gray'
	| 'grey'
	| 'blackBright'
	| 'redBright'
	| 'greenBright'
	| 'yellowBright'
	| 'blueBright'
	| 'magentaBright'
	| 'cyanBright'
	| 'whiteBright';

*/


export const statusToColor = (status: ProcessStatus) => {
  if (status === 'errored') return 'redBright';
  if (status === 'online') return 'greenBright';
  if (status === 'stopped') return 'blackBright';
  return 'blackBright';
}
