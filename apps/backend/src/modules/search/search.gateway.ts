import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SearchSessionStatus } from '@wildprice/shared-types';

export interface SearchProgressEvent {
  sessionId: string;
  status: SearchSessionStatus;
  progress: number;
  message: string;
  currentPlatform?: string;
}

export interface ListingFoundEvent {
  sessionId: string;
  listing: any;
  lowestPriceSoFar?: number;
}

export interface SearchCompletedEvent {
  sessionId: string;
  resultCount: number;
  lowestPrice?: number;
  savingsVsOriginal?: number;
  completedAt: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/search',
})
export class SearchEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SearchEventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const room = `session_${data.sessionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined search room: ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const room = `session_${data.sessionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left search room: ${room}`);
    return { event: 'left', room };
  }

  /**
   * Broadcasts search progress update to all clients listening to this session.
   */
  emitProgress(event: SearchProgressEvent) {
    const room = `session_${event.sessionId}`;
    this.server?.to(room).emit('search:progress', event);
    this.logger.debug(`[WS emit] progress for ${event.sessionId}: ${event.progress}% (${event.message})`);
  }

  /**
   * Broadcasts a new listing discovered in real-time by one of the platform scrapers.
   */
  emitListingFound(event: ListingFoundEvent) {
    const room = `session_${event.sessionId}`;
    this.server?.to(room).emit('search:listing_found', event);
    this.logger.debug(`[WS emit] listing_found for ${event.sessionId} on ${event.listing?.platform}`);
  }

  /**
   * Broadcasts search session completion event with final totals.
   */
  emitSearchCompleted(event: SearchCompletedEvent) {
    const room = `session_${event.sessionId}`;
    this.server?.to(room).emit('search:completed', event);
    this.logger.log(`[WS emit] search:completed for ${event.sessionId} with ${event.resultCount} results`);
  }
}
