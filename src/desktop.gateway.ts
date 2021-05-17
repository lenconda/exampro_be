import { WebSocketGateway } from '@nestjs/websockets';
import { BasePeerGateway } from './utils/peer';

@WebSocketGateway({ namespace: 'desktop' })
export class DesktopPeerGateway extends BasePeerGateway {
  constructor() {
    super();
    this.logPrefix = 'DesktopGateway';
  }
}
