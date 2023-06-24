import { Module } from '@nestjs/common';
import { SDNodeApiService } from './sd-node-api.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [SDNodeApiService],
  exports: [SDNodeApiService],
})
export class SDNodeApiModule {}
