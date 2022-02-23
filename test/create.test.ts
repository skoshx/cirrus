// TODO: setup testing app environment before
// tests…

import { createApp, ready } from '..';

describe('create', () => {
  it('create > invalid options', async () => {
    await ready();
    // @ts-ignore
    expect(createApp('testapp', null)).rejects.toMatchSnapshot();
    // @ts-ignore
    expect(createApp('testapp', { port: 8080 })).rejects.toMatchSnapshot();
    expect(
      // @ts-ignore
      createApp('testapp', { port: 8080, appName: 'test' }),
    ).rejects.toMatchSnapshot();
  });
});
