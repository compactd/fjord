import { IDownstream } from './definitions';
import {
  IPiece,
  EventKey,
  AppEvent,
  EventIn,
  TorrentEvent,
  TorrentProperties,
  TorrentState,
} from '@spillway/torrent-client';
import { log, warn } from './logger';

// const debug = require('debug')('wire');

export default class DownstreamWire<R extends {} = {}> implements IDownstream {
  private extensions: Partial<R> = {};

  constructor(private socket: SocketIO.Socket) {
    socket.on('disconnect', () => {
      log('%s: socket disconnected', socket.id);
    });
    socket.on('error', err => {
      warn('%s: socket error: %O', socket.id, err);
    });
  }

  use<K extends keyof R>(name: K, factory: (socket: SocketIO.Socket) => R[K]) {
    return (this.extensions[name] = factory(this.socket));
  }

  getExtension<K extends keyof R>(name: K) {
    return this.extensions[name];
  }

  close() {
    this.socket.disconnect();
  }

  async addTorrent(content: Buffer) {
    log('adding torrent %o', content);
    await this.emit('add_torrent', content);
  }

  async getState(): Promise<(TorrentProperties & TorrentState)[]> {
    return this.emitAndCallback('get_state');
  }

  async getPiece(infoHash: string, index: number): Promise<IPiece> {
    return this.emitAndCallback('get_piece', { infoHash, index });
  }

  async getPiecesState(infoHash: string): Promise<number[]> {
    return this.emitAndCallback('get_pieces_state', { infoHash });
  }

  handleAppEvent<K extends EventKey<AppEvent>>(
    name: K,
    callback: ((...args: EventIn<AppEvent, K>) => void),
  ) {
    log('subscribing to %s', name);
    this.socket.on(`app_event_${name}`, callback as any);
    this.socket.emit('sub_to_app_event', { name });
  }

  handleTorrentEvent<K extends EventKey<TorrentEvent>>(
    infoHash: string,
    name: K,
    callback: ((...args: EventIn<TorrentEvent, K>) => void),
  ): void {
    log('subscribing to %s#%s', infoHash, name);
    this.socket.on(`${infoHash.slice(0, 7)}_event_${name}`, callback as any);
    this.socket.emit('sub_to_torrent_event', { infoHash, name });
  }

  private emit(fn: string, payload?: any) {
    const id = Math.random()
      .toString(16)
      .slice(2);
    return new Promise(() => {
      this.socket.emit('fcall_' + fn, {
        cb: id,
        payload,
      });
    });
  }

  private emitAndCallback(fn: string, payload?: any): Promise<any> {
    const id = Math.random()
      .toString(16)
      .slice(2);
    return new Promise(resolve => {
      this.socket.once('fcallback_' + id, ({ data }: any) => {
        resolve(data);
      });
      this.socket.emit('fcall_' + fn, {
        cb: id,
        payload,
      });
    });
  }
}
