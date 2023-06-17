import {
  Admin,
  CallbackQuery,
  Ctx,
  Hears,
  Help,
  InjectBot,
  Message,
  Start,
  Update,
  // ChatType,
  On,
  Command,
  // UpdateFilter,
} from '@grammyjs/nestjs'
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import debug from 'debug'
import { Bot, Context, InlineKeyboard, InputFile } from 'grammy'
import { generateImage } from 'src/stability.ai-api'

import { EchoBotName } from './bot.constants'
import { EchoService } from './bot.service'
import { AdminGuard, GrammyExceptionFilter, ResponseTimeInterceptor, ReverseTextPipe } from './lib'

const log = debug('bot:echo.update')

@Update()
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(GrammyExceptionFilter)
export class EchoUpdate {
  private readonly inlineKeyboard: InlineKeyboard

  constructor(
    @InjectBot(EchoBotName)
    private readonly bot: Bot<Context>,
    private readonly echoService: EchoService,
  ) {
    log(`Initializing`, bot.isInited() ? bot.botInfo.first_name : '(pending)')

    this.inlineKeyboard = new InlineKeyboard().text('click', 'click-payload')
  }

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<any> {
    log('onStart!!', this.bot ? this.bot.botInfo.first_name : '(booting)')
    ctx.reply(
      `Hello! I'm a Telegram bot that generates images with Stable Diffusion XL.\n
Send me /gen prompt1, prompt2, ...\n
And i'll send you image
      `,
      // { reply_markup: this.inlineKeyboard }
      );

      ctx.reply('Example:');
      ctx.reply('/gen 1 cat, pink glasses, photo');

      try {
        const imageBuffer = await generateImage("1 cat, pink glasses, photo");
  
        ctx.replyWithPhoto(new InputFile(imageBuffer));
      } catch (e: any) {
        console.log(e);
        // ctx.reply("Error: something went wrong...");
      }
  }

  @CallbackQuery('click-payload')
  async onCallback(@Ctx() ctx: Context): Promise<any> {
    return ctx.answerCallbackQuery({
      text: 'You were curious, indeed!',
    })
  }

  @Help()
  async onHelp(@Ctx() ctx: Context): Promise<any> {
    return ctx.reply('Send me: /gen prompt1, prompt2, prompt3 ...')
  }

  @Admin()
  @UseGuards(AdminGuard)
  async onAdminCommand(@Ctx() ctx: Context): Promise<any> {
    return ctx.reply('Welcome, Judge')
  }

  @Hears('greetings')
  async onMessage(@Ctx() ctx: Context, @Message('text', new ReverseTextPipe()) reversedText: string): Promise<any> {
    return ctx.reply(reversedText)
  }

  // @On('chat_member')
  // @UpdateFilter(ctx => ctx.chatMember?.new_chat_member.status === 'member')
  // greetNewMember(@Ctx() ctx: Context) {
  //   return ctx.reply(`Welcome to our chat, ${ctx.chatMember.new_chat_member.user.first_name}!`)
  // }

  // @On('message')
  // // @ChatType('private')
  // onPrivateMessage(@Ctx() ctx: Context) {
  //   return ctx.reply('Hello! This is private chat. You can continue to tell me your secrets')
  // }

  @Command('gen')
  async onCommand(@Ctx() ctx: Context) {
    try {
      const prompt: any = ctx.match;

      if (!prompt) {
        ctx.reply("Please add prompt to your message");
        return;
      }

      const imageBuffer = await generateImage(prompt);

      ctx.replyWithPhoto(new InputFile(imageBuffer));
    } catch (e: any) {
      console.log(e);
      ctx.reply("Error: something went wrong...");
    }
  }
}
