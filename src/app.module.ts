import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';
import { Web3Module } from 'nest-web3';
import { NestjsGrammyModule } from '@grammyjs/nestjs'
import { EchoBotName } from './bot/bot.constants'
import { EchoBotModule } from './bot/bot.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    NestjsGrammyModule.forRoot({
      botName: EchoBotName,
      token: process.env.TELEGRAM_BOT_TOKEN,
      include: [EchoBotModule],
      pollingOptions: {
        allowed_updates: ['chat_member', 'message', 'callback_query'],
      },
    }),
    EchoBotModule,
    Web3Module,
    PrometheusModule.register()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
