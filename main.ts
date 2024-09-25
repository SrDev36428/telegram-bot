import { createKeypairs, existPairs, showMainCU } from "./src/createKeys";
import { buyBundle } from "./src/jitoPool";
import { sender } from "./src/senderUI";
import { sellXPercentagePF } from "./src/sellFunc";
import { sellXPercentageRAY } from "./src/sellRay";
import bot from "./resource/bot";

console.log("Bot is running...");

// Function to display the main menu
const showMainMenu = (chatId: number) => {
  const menuOptions = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Create Keypairs", callback_data: "create_keypairs" }],
        [
          {
            text: "Pre Launch Checklist",
            callback_data: "pre_launch_checklist",
          },
        ],
        [
          {
            text: "Create Pool Bundle",
            callback_data: "create_pool_bundle",
          },
        ],
        [
          {
            text: "\u00A0\u00A0 Sell % of Supply on Pump.Fun \u00A0\u00A0",
            callback_data: "sell_pump_fun",
          },
        ],
        [
          {
            text: "\u00A0\u00A0 Sell % of Supply on Raydium\u00A0\u00A0",
            callback_data: "sell_raydium",
          },
        ],
      ],
    },
  };
  bot.sendMessage(chatId, "Choose an option :", menuOptions);
};

// Listen for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId);
});

// Listen for button clicks
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const action = callbackQuery.data;

  try {
    switch (action) {
      case "create_keypairs":
        showMainCU(chatId!);
        break;
      case "pre_launch_checklist":
        await sender();
        bot.sendMessage(chatId!, "Pre Launch Checklist completed.");
        break;
      case "create_pool_bundle":
        await buyBundle();
        bot.sendMessage(chatId!, "Pool bundle created successfully.");
        break;
      case "sell_pump_fun":
        await sellXPercentagePF();
        bot.sendMessage(chatId!, "Sell operation on Pump.Fun completed.");
        break;
      case "sell_raydium":
        await sellXPercentageRAY();
        bot.sendMessage(chatId!, "Sell operation on Raydium completed.");
        break;
      
    }
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId!, "An error occurred, please try again.");
  }
});
