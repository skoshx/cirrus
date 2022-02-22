export enum LogLevels {
  NONE,
  ERROR,
  WARNING,
  VERBOSE,
}

const toAsciiCode = (open: number, close: number) => (text: string) =>
  `\u001b[${open}m${text}\u001b[${close}m`;

// ASCII color code helpers
const reset = toAsciiCode(0, 0);
const textBold = toAsciiCode(1, 22);
const textBlack = toAsciiCode(30, 39);
const textWhite = toAsciiCode(97, 39);
const textRed = toAsciiCode(91, 39);
const textYellow = toAsciiCode(93, 39);

const bgRed = toAsciiCode(101, 49);
const bgYellow = toAsciiCode(103, 49);
const bgWhite = toAsciiCode(107, 49);
const bgGreen = toAsciiCode(102, 49);

let logLevel = LogLevels.VERBOSE;

export function setLogLevel(level: LogLevels) {
  logLevel = level;
}

export function log(message: any, level = LogLevels.VERBOSE) {
  const icons = ['✘', '▲', '!'];

  if (level <= logLevel) {
    if (level === LogLevels.ERROR)
      return console.error(
        `${textRed(icons[0])}${reset('')} ${bgRed(textBold(' ERROR '))}${reset(
          '',
        )} ${textBold(message)}`,
      );
    if (level === LogLevels.WARNING)
      return console.warn(
        `${textYellow(icons[1])}${reset('')} ${bgYellow(
          textBold(textBlack(' WARNING ')),
        )}${reset('')} ${textBold(message)}`,
      );
    console.log(
      `${textWhite(icons[2])}${reset('')} ${bgWhite(
        textBold(textBlack(' VERBOSE ')),
      )}${reset('')} ${textBold(message)}`,
    );
  }
}

export function logTitle(
  title: string,
  message: any,
  level = LogLevels.VERBOSE,
) {
  const icons = ['✘', '▲', '!'];

  if (level <= logLevel) {
    if (level === LogLevels.ERROR)
      return console.error(
        `${textRed(icons[0])}${reset('')} ${bgRed(textBold(' ERROR '))}${reset(
          '',
        )} ${textBold(title)} ${message}`,
      );
    if (level === LogLevels.WARNING)
      return console.warn(
        `${textYellow(icons[1])}${reset('')} ${bgYellow(
          textBold(textBlack(' WARNING ')),
        )}${reset('')} ${textBold(title)} ${message}`,
      );
    console.log(
      `${textWhite(icons[2])}${reset('')} ${bgWhite(
        textBold(textBlack(' VERBOSE ')),
      )}${reset('')} ${textBold(title)} ${message}`,
    );
  }
}

export function logError(error: any) {
  if (logLevel === 0) return;
  const { message, name, stack } = error;
  return console.error(
    `${textRed('✘')}${reset('')} ${bgRed(textBold(' ERROR '))}${reset(
      '',
    )} ${textBold(`${name}: ${message}`)}\n${textBold('Stacktrace:')}${reset(
      '',
    )} ${stack}`,
  );
}
