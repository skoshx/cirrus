import { getApp, ready } from '..';

// TODO: setup testing app environment before
// tests…

describe('util', () => {
  it('util > get app', async () => {
    await ready();
    expect(getApp('nonexistent')).toBe(undefined);
  });
});
