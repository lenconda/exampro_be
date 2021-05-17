import { WebSocketGateway } from '@nestjs/websockets';
import { BasePeerGateway } from './utils/peer';

@WebSocketGateway({ namespace: 'camera' })
export class CameraPeerGateway extends BasePeerGateway {
  constructor() {
    super();
    this.logPrefix = 'DesktopGateway';
  }
}
