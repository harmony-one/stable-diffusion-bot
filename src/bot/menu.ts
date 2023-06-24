import { CallbackQueryContext, CommandContext, InlineKeyboard } from "grammy";

interface Menu {
  menuText: string;
  menu: InlineKeyboard;
}

export const mainMenu = {
  menuText: `\n\n<b>Change images sizes and numbers</b>\nWith the following menu, you can choose how many images can be generated on each prompt. Also, you can change the image size`,
  menu: new InlineKeyboard()
    .text("Change the image number", "numImagesOptions")
    .row()
    .text("Change the image size", "imgSizeOptions"),
};

export const numImagesOptions = {
  menuText: "Please choose 1 of 4 images for next high quality generation",
  menu: new InlineKeyboard()
    .text("1", "imgOptionSelected1")
    .text("2", "imgOptionSelected2")
    .text("3", "imgOptionSelected3")
    .text("4", "imgOptionSelected3")
    .row()
    // .text("Back to Menu", "back"),
};

export const getMenu = async (menu: Menu, ctx: CommandContext<any>) => {
  return await ctx.reply(menu.menuText, {
    parse_mode: "HTML",
    reply_markup: menu.menu,
  });
};

export const setImgOption = async (
  option: number,
  ctx: CallbackQueryContext<any>
) => {
  ctx.session.numImages = option;
  await ctx.answerCallbackQuery({
    text: "Images per prompt updated",
  });
  await ctx.editMessageText(mainMenu.menuText, {
    reply_markup: mainMenu.menu,
    parse_mode: "HTML",
  });
};