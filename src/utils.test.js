const { formatBytes } = require('./utils');

test('Format bytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(10000)).toBe('9.77 KB');
    expect(formatBytes(10000000)).toBe('9.54 MB');
    expect(formatBytes(100000000000)).toBe('93.13 GB');
});
