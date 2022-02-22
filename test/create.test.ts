
// TODO: setup testing app environment before
// tests…

import { createApp } from "..";

describe('create', () => {
  it('create > invalid options', () => {
    // @ts-ignore
    expect(createApp('testapp', null)).toThrowError();
    // @ts-ignore
    expect(createApp('testapp', { port: 8080 })).toThrowError();
  });
});
