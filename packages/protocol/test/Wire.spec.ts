import { waitExpectations, delay, createTestWires } from './test-utils';
import DownstreamWire from '../src/DownstreamWire';
import UpstreamWire from '../src/UpstreamWire';

describe('Up/Down stream wire', () => {
  let client: DownstreamWire, server: UpstreamWire, close: () => void;
  const listener = jest.fn();

  beforeEach(async () => {
    const res = await createTestWires();
    client = res.client;
    server = res.server;
    close = res.close;

    client.setupListeners();
    server.setupListeners();
    listener.mockClear();
  });

  afterEach(() => {
    client.close();
    if (close) {
      close();
    }
  });

  test('add_torrent', async () => {
    server.on('add_torrent', listener);
    client.emit('add_torrent', Buffer.from('01A4', 'hex'));
    await waitExpectations(() => {
      expect(listener).toHaveBeenCalledWith(Buffer.from('01A4', 'hex'));
    });
  });
  test('pause_torrent', async () => {
    server.on('pause_torrent', listener);
    client.emit('pause_torrent', 'foo');
    await waitExpectations(() => {
      expect(listener).toHaveBeenCalledWith('foo');
    });
  });
  test('resume_torrent', async () => {
    server.on('resume_torrent', listener);
    client.emit('resume_torrent', 'foo');
    await waitExpectations(() => {
      expect(listener).toHaveBeenCalledWith('foo');
    });
  });
  test('remove_torrent', async () => {
    server.on('remove_torrent', listener);
    client.emit('remove_torrent', 'foo');
    await waitExpectations(() => {
      expect(listener).toHaveBeenCalledWith('foo');
    });
  });

  test('torrent_added', async () => {
    client.on('torrent_added', listener);
    server.emit('torrent_added', {
      name: 'foobar',
      infoHash: 'foo',
    });
    await waitExpectations(() => {
      expect(listener).toHaveBeenCalledWith({
        name: 'foobar',
        infoHash: 'foo',
      });
    });
  });
});
