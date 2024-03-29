import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'ws';
import { Logger } from '@nestjs/common';
import { User } from '../user/user.entity';

interface JoinRoomData {
  room: string;
  user: Partial<User>;
  mode: 'participant' | 'invigilator';
}

interface ActiveSocket extends JoinRoomData {
  id: string;
}

export class BasePeerGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  protected logPrefix = 'WebsocketGateway';

  private activeSockets: ActiveSocket[] = [];

  private logger: Logger = new Logger(this.logPrefix);

  @SubscribeMessage('join-room')
  public joinRoom(client: Socket, data: JoinRoomData): void {
    const { room, user, mode } = data;

    const existingSocket = this.activeSockets?.find(
      (socket) => socket.room === room && socket.id === client.id,
    );

    if (!existingSocket) {
      const currentSocket = { id: client.id, room, user, mode };
      this.activeSockets = [...this.activeSockets, currentSocket];

      client.emit(`${room}-update-user-list`, {
        users: this.activeSockets.filter(
          (socket) => socket.room === room && socket.id !== client.id,
        ),
      });

      client.broadcast.emit(`${room}-update-user-list`, {
        users: [currentSocket],
      });
    }

    return this.logger.log(`Client ${user.email} joined ${room}`);
  }

  @SubscribeMessage('call-user')
  public callUser(client: Socket, data: any): void {
    client.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: client.id,
    });
  }

  @SubscribeMessage('make-answer')
  public makeAnswer(client: Socket, data: any): void {
    client.to(data.to).emit('answer-made', {
      socket: client.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('reject-call')
  public rejectCall(client: Socket, data: any): void {
    client.to(data.from).emit('call-rejected', {
      socket: client.id,
    });
  }

  public afterInit(): void {
    this.logger.log('Init');
  }

  public handleDisconnect(client: Socket): void {
    const existingSocket = this.activeSockets.find(
      (socket) => socket.id === client.id,
    );

    if (!existingSocket) return;

    this.activeSockets = this.activeSockets.filter(
      (socket) => socket.id !== client.id,
    );

    client.broadcast.emit(`${existingSocket.room}-remove-user`, {
      socketId: client.id,
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
