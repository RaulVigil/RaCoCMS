import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBusService {
  constructor(private eventEmitter: EventEmitter2) {}

  emit(event: string, payload: unknown) {
    return this.eventEmitter.emit(event, payload);
  }

  on(event: string, handler: (...args: any[]) => void) {
    this.eventEmitter.on(event, handler);
  }

  // Hooks específicos del CMS
  afterEntryPublish(entryId: number) {
    this.emit('action.after.publish', { entryId });
  }

  filterEntrySeo(seoData: Record<string, unknown>) {
    return this.emit('filter.entry.seo', seoData);
  }

  afterMediaUpload(filename: string) {
    this.emit('action.after.media.upload', { filename });
  }
}
