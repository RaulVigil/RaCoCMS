import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EntriesService } from './entries.service';

// Cada cuánto se revisan las publicaciones programadas
const INTERVAL_MS = 30_000;

// Publica y despublica a la hora programada. Al arrancar se pone al día con lo que venció mientras
// la API estuvo apagada. Con un solo servidor basta un temporizador; con varios habrá que pasarlo a la cola (2.15).
@Injectable()
export class EntriesScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Programación');
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private entries: EntriesService) {}

  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), INTERVAL_MS);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return; // si una vuelta tarda, no se solapa con la siguiente
    this.running = true;
    try {
      const { published, unpublished } = await this.entries.runSchedule();
      if (published || unpublished) this.logger.log(`Publicadas: ${published} · Despublicadas: ${unpublished}`);
    } catch (err) {
      this.logger.error(`No se pudo revisar la programación: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
