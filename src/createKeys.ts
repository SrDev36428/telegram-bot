import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import promptSync from "prompt-sync";
import path from "path";
import bs58 from "bs58";
import bot from "../resource/bot";

const prompt = promptSync();

const keypairsDir = path.join(__dirname, "keypairs");
const keyInfoPath = path.join(__dirname, "keyInfo.json");

interface Iwallet {
  [key: string]: string | number[];
}

interface IPoolInfo {
  userID?: string;
  referalCode?: string;
  referrerCode?: string;
  numOfWallets?: number;
  wallets: Iwallet;
  addressLUT?: string;
  mint?: string;
  mintPk?: string;
}

export const showMainCU = async (chatId: number) => {
  const menuOptions = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Create New Wallets", callback_data: `createkeypairs` }],
        [{ text: "Exsting Wallets", callback_data: "Existpairs" }],
        [{ text: "Back to Main Menu", callback_data: "back_to_main" }],
      ],
    },
  };
  bot.sendMessage(chatId, "Create Keypairs", menuOptions);
};

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const action = callbackQuery.data;
  const userID = callbackQuery.message?.chat.username;

  try {
    switch (action) {
      case "createkeypairs":
        let pubkeylist = await createKeypairs(userID!);
        // Create a formatted message
        let message = "List of Public Keys:\n\n";
        pubkeylist.forEach((pubkey, index) => {
          message += `${index + 1}. ${pubkey}\n`;
        });
        bot.sendMessage(chatId!, "Create New Wallets Success");
        bot.sendMessage(chatId!, message);
        break;
      case "Existpairs":
        let msg = await existPairs(userID!);
        bot.sendMessage(chatId!, msg);
        break;
      default:
        bot.sendMessage(chatId!, "Invalid option, please choose again.");
    }
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId!, "An error occurred, please try again.");
  }
});

function generateWallets(numOfWallets: number): Keypair[] {
  let wallets: Keypair[] = [];
  for (let i = 0; i < numOfWallets; i++) {
    const wallet = Keypair.generate();
    wallets.push(wallet);
  }
  return wallets;
}

function readKeypairs(id: string) {
  let flag: number = 0;
  const jsonData = JSON.parse(fs.readFileSync(keyInfoPath, "utf-8"));
  for (let i = 0; i < jsonData.length; i++) {
    if (jsonData[i].userID == id) {
      flag = i;
      break;
    }
  }

  const wallets = [];

  // Iterate over the wallet keys in the JSON
  for (let i = 1; i <= jsonData[flag].numOfWallets; i++) {
    const pubkey = jsonData[flag].wallets[`pubkey${i}`];
    const secretKeyArray = jsonData[flag].wallets[`pubkey${i}Secret`];

    if (pubkey && secretKeyArray) {
      const secretKey = new Uint8Array(secretKeyArray);
      const wallet = Keypair.fromSecretKey(secretKey);
      wallets.push(wallet);
    }
  }

  return wallets;
}

function updatePoolInfo(wallets: Keypair[], id: string): string[] {
  let poolInfo: IPoolInfo[] = []; // Use the defined type here
  let walletData: Iwallet = {};
  const publicKeys: string[] = [];

  let flag = -1;
  // Check if poolInfo.json exists and read its content
  if (fs.existsSync(keyInfoPath)) {
    const data = fs.readFileSync(keyInfoPath, "utf8");
    poolInfo = JSON.parse(data);
  }

  for (let i = 0; i < poolInfo.length; i++) {
    if (poolInfo[i].userID == id) {
      flag = i;
      break;
    }
  }

  // Format wallet data as separate keys for public key and secret
  wallets.forEach((wallet, index) => {
    walletData[`pubkey${index + 1}`] = wallet.publicKey.toString();
    walletData[`pubkey${index + 1}Secret`] = Array.from(wallet.secretKey);
  });

  if (flag !== -1) {
    // Update wallet-related information
    poolInfo[flag].numOfWallets = wallets.length;
    poolInfo[flag].wallets = walletData;
  } else {
    let newInfo: IPoolInfo = {
      userID: id,
      referalCode: "", // Set default values as needed
      referrerCode: "",
      numOfWallets: wallets.length,
      wallets: walletData,
      addressLUT: "5YJjzJUGZ4ddcgJpSyvnAW4HnxKiNinLUJbAcs4XbTq9", // Default value
      mint: "6ufmqWPwnZAoySddKgSNFGoXUpp26YCVMg9VmL5Gk7RZ", // Default value
      mintPk:
        "4Qm68vxbMogSEsNmZ241AVRoMGMEYbgRr3FJF7hKi787e8VhNfyCbgYVUwVvex1x6727LjCQKWZMSjeb4rDzhhou", // Default value
    };
    poolInfo.push(newInfo);
  }

  fs.writeFileSync(keyInfoPath, JSON.stringify(poolInfo, null, 2));

  for (const key in walletData) {
    if (key.startsWith("pubkey") && !key.endsWith("Secret")) {
      publicKeys.push(walletData[key] as string);
    }
  }
  return publicKeys;
}

export async function createKeypairs(userID: string) {
  console.log(userID);
  let wallets: Keypair[] = [];
  const numOfWallets = 24; // Hardcode 24 buyer keypairs here.
  if (isNaN(numOfWallets) || numOfWallets <= 0) {
    console.log("Invalid number. Please enter a positive integer.");
    return [];
  }

  wallets = generateWallets(numOfWallets);
  let pubkeys = updatePoolInfo(wallets, userID);
  return pubkeys;
}

// Function to check for existing keypairs
export async function existPairs(userID: string) {
  let wallets = readKeypairs(userID);
  wallets.forEach((wallet, index) => {
    console.log(
      `Read Wallet ${index + 1} Public Key: ${wallet.publicKey.toString()}`
    );
    console.log(
      `Read Wallet ${index + 1} Private Key: ${bs58.encode(wallet.secretKey)}\n`
    );
  });
  // Create a formatted message
  let message = "List of Wallets Keys:\n\n";
  for (let i = 0; i < wallets.length; i++) {
    message += `pubkey${i + 1} : ${wallets[i]["publicKey"]}\n`;
    message += `pubkey${i + 1}secret : ${bs58.encode(
      wallets[i]["secretKey"]
    )}\n`;
  }
  return message;
}

export function loadKeypairs(): Keypair[] {
  // Define a regular expression to match filenames like 'keypair1.json', 'keypair2.json', etc.
  const keypairRegex = /^keypair\d+\.json$/;

  return fs
    .readdirSync(keypairsDir)
    .filter((file) => keypairRegex.test(file)) // Use the regex to test each filename
    .map((file) => {
      const filePath = path.join(keypairsDir, file);
      const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      return Keypair.fromSecretKey(secretKey);
    });
}
