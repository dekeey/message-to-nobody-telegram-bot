const TelegramBot = require('node-telegram-bot-api');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const MongoClient = require('mongodb').MongoClient;

const config = require('./config');
const mongoConnectUrl = config.mongoConnectUrl;
const token = config.token;

const bot = new TelegramBot(token, { polling: true });

var db;
var collection;

MongoClient.connect(mongoConnectUrl, (err, database) => {
  if (err) throw err;
  console.log('ok');
  db = database;
  collection = db.collection('messages');

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


bot.on('message', async(function (message) {
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

}));

