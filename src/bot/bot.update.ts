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
// import { generateImage } from 'src/sd-node-api'
import { SDNodeApiService } from 'src/sd-node-api/sd-node-api.service'
import { uuidv4, sleep } from '../utils';

import { EchoBotName } from './bot.constants'
import { EchoService } from './bot.service'
import { examples } from './examples'
import { AdminGuard, GrammyExceptionFilter, ResponseTimeInterceptor, ReverseTextPipe } from './lib'

const log = debug('bot:echo.update')

enum SESSION_STEP {
  IMAGE_SELECT = 'IMAGE_SELECT',
  IMAGE_GENERATED = 'IMAGE_GENERATED',
}

interface ISession {
  id: string;
  author: string;
  step: SESSION_STEP;
  prompt: string;
  all_seeds: string[];
}

@Update()
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(GrammyExceptionFilter)
export class EchoUpdate {
  private readonly inlineKeyboard: InlineKeyboard
  private queue: string[] = [];
  private sessions: ISession[] = [];

  constructor(
    @InjectBot(EchoBotName)
    private readonly bot: Bot<Context>,
    private readonly echoService: EchoService,
    private sdNodeApiService: SDNodeApiService,
  ) {
    log(`Initializing`, bot.isInited() ? bot.botInfo.first_name : '(pending)')

    this.inlineKeyboard = new InlineKeyboard().text('click', 'click-payload')
  }

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<any> {
    log('onStart!!', this.bot ? this.bot.botInfo.first_name : '(booting)')
    ctx.reply(
      `Hello! I'm a Telegram bot that generates images with Stable Diffusion.\n
Commands:
/gen prompts - 1 image
/gen_many prompts - 4 images to choose 
/example - example images
/help\n
`,
      // { reply_markup: this.inlineKeyboard }
    );

    ctx.reply('Example:');
    ctx.reply('/gen 1 cat, pink glasses, photo');

    try {
      const imageBuffer = await this.sdNodeApiService.generateImage("1 cat, pink glasses, photo");

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
  async onCommandGen(@Ctx() ctx: Context) {
    const uuid = uuidv4();

    try {
      const prompt: any = ctx.match;

      const authorObj = await ctx.getAuthor();
      const author = `@${authorObj.user.username}`;

      if (!prompt) {
        ctx.reply(`${author} please add prompt to your message`);
        return;
      }

      this.queue.push(uuid);

      let idx = this.queue.findIndex(v => v === uuid);

      // waiting queue
      while (idx !== 0) {
        ctx.reply(`${author} you are the ${idx + 1}/${this.queue.length}. Please wait about ${idx * 3} sec`);

        await sleep(3000 * this.queue.findIndex(v => v === uuid));

        idx = this.queue.findIndex(v => v === uuid);
      }

      ctx.reply(`${author} starting to generate your image`);

      const imageBuffer = await this.sdNodeApiService.generateImage(prompt);

      ctx.replyWithPhoto(new InputFile(imageBuffer));
    } catch (e: any) {
      console.log(e);
      ctx.reply(`Error: something went wrong...`);
    }

    this.queue = this.queue.filter(v => v !== uuid);
  }

  @Command('gen_many')
  async onCommandGenMany(@Ctx() ctx: Context) {
    const uuid = uuidv4();

    try {
      const prompt: any = ctx.match;

      const authorObj = await ctx.getAuthor();
      const author = `@${authorObj.user.username}`;

      if (!prompt) {
        ctx.reply(`${author} please add prompt to your message`);
        return;
      }

      this.queue.push(uuid);

      let idx = this.queue.findIndex(v => v === uuid);

      // waiting queue
      while (idx !== 0) {
        ctx.reply(`${author} you are the ${idx + 1}/${this.queue.length}. Please wait about ${idx * 3} sec`);

        await sleep(3000 * this.queue.findIndex(v => v === uuid));

        idx = this.queue.findIndex(v => v === uuid);
      }

      ctx.reply(`${author} starting to generate your images`);

      const res = await this.sdNodeApiService.generateImagesPreviews(prompt);

      // res.images.map(img => new InputFile(Buffer.from(img, 'base64')));

      const newSession: ISession = {
        id: uuidv4(),
        author,
        prompt: String(prompt),
        step: SESSION_STEP.IMAGE_SELECT,
        all_seeds: JSON.parse(res.info).all_seeds
      }

      this.sessions.push(newSession);

      ctx.replyWithMediaGroup(
        res.images.map((img, idx) => ({
          type: "photo",
          media: new InputFile(Buffer.from(img, 'base64')),
          caption: String(idx + 1),
        }))
      )

      ctx.reply("Please choose 1 of 4 images for next high quality generation", {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text("1", `${newSession.id}_1`)
          .text("2", `${newSession.id}_2`)
          .text("3", `${newSession.id}_3`)
          .text("4", `${newSession.id}_4`)
          .row()
      });
    } catch (e: any) {
      console.log(e);
      ctx.reply(`Error: something went wrong...`);
    }

    this.queue = this.queue.filter(v => v !== uuid);
  }

  @CallbackQuery()
  async imgSelected(@Ctx() ctx: Context): Promise<any> {
    try {
      const authorObj = await ctx.getAuthor();
      const author = `@${authorObj.user.username}`;

      const [sessionId, imageNumber] = ctx.callbackQuery.data.split('_');

      if (!sessionId || !imageNumber) {
        return;
      }

      const session = this.sessions.find(s => s.id === sessionId);

      if (!session || session.author !== author) {
        return;
      }

      ctx.reply(`${author} starting to generate your image ${imageNumber} in high quality`);

      const imageBuffer = await this.sdNodeApiService.generateImageFull(session.prompt, +session.all_seeds[+imageNumber - 1]);

      ctx.replyWithPhoto(new InputFile(imageBuffer));
    } catch (e: any) {
      console.log(e);
      ctx.reply(`Error: something went wrong...`);
    }
  }

  private exampleIdx = 0;

  @Command('example')
  async onCommandExample(@Ctx() ctx: Context) {
    if (this.exampleIdx >= examples.length - 1) {
      this.exampleIdx = 0;
    }

    const prompt = examples[this.exampleIdx++];

    ctx.reply(`/gen ${prompt}`);

    try {
      const imageBuffer = await this.sdNodeApiService.generateImage(prompt);

      ctx.replyWithPhoto(new InputFile(imageBuffer));
    } catch (e: any) {
      console.log(e);
      ctx.reply(`Error: something went wrong...`);
    }
  }
}