import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EventsService implements OnModuleInit {
  private provider: 'console' | 'kafka';
  private producer: Producer | null = null;

  constructor() {
    this.provider =
      (process.env.EVENTS_PROVIDER as 'console' | 'kafka') || 'console';
  }

  async onModuleInit() {
    if (this.provider === 'kafka') {
      const kafka = new Kafka({
        clientId: 'posts-service',
        brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
      });
      this.producer = kafka.producer();
      await this.producer.connect();
    }
  }

  async emitEvent(eventName: string, payload: any) {
    if (this.provider === 'console') {
      console.log(`Event Emitted: ${eventName}`, payload);
    } else if (this.provider === 'kafka' && this.producer) {
      await this.producer.send({
        topic: process.env.KAFKA_TOPIC || 'posts_events',
        messages: [{ key: eventName, value: JSON.stringify(payload) }],
      });
    }
  }
}
