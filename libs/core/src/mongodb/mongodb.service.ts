import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Connection } from 'mongoose';
import mongoose from 'mongoose';

@Injectable()
export class MongodbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongodbService.name);
  private connection: Connection;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      if (this.connection && this.connection.readyState === 1) {
        this.logger.log('MongoDB already connected');
        return;
      }

      const mongoUri = this.config.get<string>('MONGODB_URI');
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      this.connection = mongoose.createConnection(mongoUri, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        family: 4, // Force IPv4 to avoid some DNS issues
      });

      this.setupEventListeners();

      await this.connection.asPromise();
      this.logger.log('MongoDB connected successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      this.scheduleReconnect();
      if (
        error instanceof Error &&
        error.message.includes('MONGODB_URI environment variable is not set')
      ) {
        throw error;
      }
    }
  }

  private setupEventListeners(): void {
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connection established');
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
      this.scheduleReconnect();
    });

    this.connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error);
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
      this.reconnectAttempts = 0;
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`,
    );

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error(
          `Reconnection attempt ${this.reconnectAttempts} failed:`,
          error,
        );
      }
    }, this.reconnectDelay);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.close();
        this.logger.log('MongoDB disconnected successfully');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB:', error);
    }
  }

  private getConnection(): Connection {
    if (!this.connection || this.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    return this.connection;
  }

  async getModel<T>(modelDef: {
    name: string;
    schema: any;
  }): Promise<Model<T>> {
    const conn = this.getConnection();
    return conn.model<T>(modelDef.name, modelDef.schema);
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.getConnection().db?.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }
}
