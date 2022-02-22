import { getApp } from "..";

// TODO: setup testing app environment before
// tests…

describe('util', () => {
  it('util > get app', () => {
    expect(getApp('nonexistent')).toBe(undefined);
  });
});
