import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { Server } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'video' })
export class MessageGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private activeSockets: { room: string; id: string }[] = [];

  private logger: Logger = new Logger('MessageGateway');

  @SubscribeMessage('join-room')
  public joinRoom(client: Socket, data: Record<string, any>): void {
    const { room, email } = data;
    const existingSocket = this.activeSockets?.find(
      (socket) => socket.room === room && socket.id === email,
    );

    if (!existingSocket) {
      this.activeSockets = [...this.activeSockets, { id: email, room }];
      client.emit(`${room}-update-user-list`, {
        users: this.activeSockets
          .filter((socket) => socket.room === room && socket.id !== email)
          .map((existingSocket) => existingSocket.id),
      });

      client.broadcast.emit(`${room}-update-user-list`, {
        users: [email],
      });
    }

    return this.logger.log(`Client ${email} joined ${room}`);
  }

  @SubscribeMessage('call-user')
  public callUser(client: Socket, data: any): void {
    const { to, offer, email } = data;
    client.to(to).emit('call-made', {
      offer,
      socket: email,
    });
  }

  @SubscribeMessage('make-answer')
  public makeAnswer(client: Socket, data: any): void {
    const { to, answer, email } = data;
    client.to(to).emit('answer-made', {
      socket: email,
      answer,
    });
  }

  // @SubscribeMessage('reject-call')
  // public rejectCall(client: Socket, data: any): void {
  //   client.to(data.from).emit('call-rejected', {
  //     socket: client.id,
  //   });
  // }

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
