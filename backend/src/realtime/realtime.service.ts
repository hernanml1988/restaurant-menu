import { Injectable, MessageEvent } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Observable,
  distinctUntilChanged,
  filter,
  from,
  map,
  mergeMap,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { MoreThan, Repository } from 'typeorm';
import { RealtimeEvent } from './entities/realtime_event.entity';

@Injectable()
export class RealtimeService {
  constructor(
    @InjectRepository(RealtimeEvent)
    private readonly realtimeEventRepository: Repository<RealtimeEvent>,
  ) {}

  private async getEventsAfter(
    scope: 'internal' | 'session',
    lastEventId: number,
    sessionToken?: string,
  ) {
    return this.realtimeEventRepository.find({
      where: {
        scope,
        ...(sessionToken ? { sessionToken } : {}),
        id: MoreThan(lastEventId),
      },
      order: {
        id: 'ASC',
      },
      take: 100,
    });
  }

  private toMessageEvent(event: RealtimeEvent): MessageEvent {
    return {
      id: String(event.id),
      data: {
        event: event.event,
        sessionToken: event.sessionToken ?? null,
        payload: event.payload,
      },
    };
  }

  private pollEvents(
    scope: 'internal' | 'session',
    startEventId = 0,
    sessionToken?: string,
  ): Observable<MessageEvent> {
    let cursor = Number.isFinite(startEventId) ? Number(startEventId) : 0;

    return timer(0, 1000).pipe(
      startWith(0),
      switchMap(() => from(this.getEventsAfter(scope, cursor, sessionToken))),
      filter((events) => events.length > 0),
      map((events) => {
        cursor = events[events.length - 1].id;
        return events;
      }),
      distinctUntilChanged((prev, next) => prev.at(-1)?.id === next.at(-1)?.id),
      mergeMap((events) => from(events)),
      map((event) => this.toMessageEvent(event)),
    );
  }

  streamInternal(lastEventId = 0) {
    return this.pollEvents('internal', lastEventId);
  }

  streamSession(sessionToken: string, lastEventId = 0) {
    return this.pollEvents('session', lastEventId, sessionToken);
  }

  async publishInternal(event: string, payload: Record<string, unknown>) {
    await this.realtimeEventRepository.save(
      this.realtimeEventRepository.create({
        scope: 'internal',
        event,
        payload,
      }),
    );
  }

  async publishSession(
    sessionToken: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    await this.realtimeEventRepository.save(
      this.realtimeEventRepository.create({
        scope: 'session',
        sessionToken,
        event,
        payload,
      }),
    );
  }
}
