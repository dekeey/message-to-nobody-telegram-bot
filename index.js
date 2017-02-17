const TelegramBot = require('node-telegram-bot-api');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const MongoClient = require('mongodb').MongoClient;

const config = require('./config');
const mongoConnectUrl = config.mongoConnectUrl;
const token = config.token;

const bot = new TelegramBot(token, { polling: true });

const startMessage = `<strong>Message to Nobody</strong>
Send a message to Nobody and get an answer
Once you've got the message from Nobody, this message will be deleted, so only you will see it
--------
Отправь сообщение Никому и получи ответ
Послав тебе сообщение, Никто удалит его из своей памяти, только ты получишь его

Supp/feedback: @Dekeey
src: github.com/dekeey/message-to-nobody-telegram-bot
`;


var db;
var collection;

MongoClient.connect(mongoConnectUrl, (err, database) => {
  if (err) throw err;
  console.log('ok');
  db = database;
  collection = db.collection('messages');

});

const messageIsSpam = async((message) => {
  var userMessages = await(
    collection
    .find({
      "from.id": message.from.id
    })
    .sort({date: -1})
    .toArray()
  );
  if (userMessages.length > 0) {
    return userMessages[0].date > ( (new Date().getTime() / 1000) - 20 ); // 20 sec limit
  } else {
    return false
  }

});

const addMessage = (message) => {
  return collection.insertOne(message);
};

const removeMessage = (message) => {
  return collection.deleteOne({"_id": message._id})
};

const getMessagesFromNobody = (userId) => {
  return collection.find({
    "from.id": {"$ne": userId}
  }).toArray();
};

const sendDontSpam = (message) => {
  bot.sendMessage(message.chat.id, 'Dont spam the Nobody');
};

const acceptMessageToNobody = (message) => {

  var chatId = message.chat.id;
  var userId = message.from.id;

  if (message.text && message.text.length >= 7) {
    var addMessageRequest = await(addMessage(message));

    if (addMessageRequest.result.ok === 1) {
      var messages = await(getMessagesFromNobody(userId));

      if (messages.length > 0) {
        var messageFromNobody = messages[ Math.floor(Math.random() * messages.length) ];
        bot.sendMessage(chatId, messageFromNobody.text);
        removeMessage(messageFromNobody)
      } else {
        bot.sendMessage(chatId, 'No Messages for you =(');
      }
    }
  } else {
    bot.sendMessage(chatId, 'Sorry. Your message must be >= 7 characters');
  }

};

const proceedMessageToNobody = async((message) => {

  var isSpam = await(messageIsSpam(message));
  if (isSpam) {
    sendDontSpam(message)
  } else {
    acceptMessageToNobody(message);
  }
});

bot.on('message', function (message) {

  if (message.text.trim() === '/start') {
    bot.sendMessage(message.chat.id, startMessage, { parse_mode: 'HTML' });
  } else {
    proceedMessageToNobody(message);
  }
});

