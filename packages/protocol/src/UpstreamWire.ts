import {
  SocketState,
  socketStateMachine,
  IUpstream,
  IClient,
  AppEvent,
  TorrentEvent,
} from './definitions';
import { FunctionHandler, EventHandler } from './utils';
import 'reflect-metadata';

const debug = require('debug')('wire');

export default class UpstreamWire {
  state: SocketState = SocketState.Ready;
  readonly socket: SocketIO.Socket;
  public static init?: (socket: SocketIO.Socket) => {};

  constructor(socket: SocketIO.Socket, private client: IClient) {
    this.socket = socket;

    Object.getOwnPropertyNames(UpstreamWire.prototype).forEach(name => {
      (Reflect.getMetadata('custom:oninit', (this as any)[name]) || (() => {}))(
        this,
      );
    });
  }

  setState(state: SocketState) {
    this.state = socketStateMachine(this.state, state);
  }

  isReady() {
    return this.state === SocketState.Ready;
  }

  setup() {}

  @FunctionHandler('add_torrent')
  addTorrent(buffer: Buffer) {
    this.client.addTorrent(buffer);
  }

  @FunctionHandler('get_state')
  getState() {
    return this.client.getState();
  }

  @FunctionHandler('get_piece')
  getPiece({ infoHash, index }: { infoHash: string; index: number }) {
    return this.client.getPiece(infoHash, index);
  }

  @EventHandler('sub_to_app_event')
  subscribeToAppEvent({ name }: { name: keyof AppEvent }) {
    this.client.onAppEvent(name, (data: any) => {
      this.socket.emit(`app_event_${name}`, data);
    });
  }

  @EventHandler('sub_to_torrent_event')
  subscribeToTorrentEvent({
    name,
    infoHash,
  }: {
    name: keyof TorrentEvent;
    infoHash: string;
  }) {
    this.client.onTorrentEvent(infoHash, name, (data: any) => {
      this.socket.emit(`${infoHash.slice(0, 7)}_event_${name}`, data);
    });
  }
}
