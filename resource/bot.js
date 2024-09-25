import TelegramBot from "node-telegram-bot-api";

const token = "8018209463:AAHqecATgTUzwRJepu9vXc9O5uW4qTjPeoY";
const bot = new TelegramBot(token, { polling: true });

export default bot;
