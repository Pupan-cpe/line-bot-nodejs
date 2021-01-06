/* ---------PUPAN---------------------------------------
line คือ LINE SDK
express คือ ตัวที่เราใช้ทำ server
client คือ ตัวที่ใช้ ส่งข้อความกลับไปยัง LINE app ของ user
line.middleware เป็น middleware ที่ใช้ในการตรวจสอบว่า request นี้ ถูกส่งมาจาก LINE จริงหรือไม่
req.body.events เป็น payload ที่ส่งมาจาก LINE ซึ่งเป็น array ของเหตุการณ์ที่เกิดขึ้นกับ Bot เช่น มีการส่งข้อความ มีคนเพิ่มเพื่อน หรือมีการส่ง postback data เข้ามา เป็นต้น
handleEvent เป็น function ที่ใช้ในการจัดการ event แต่ละ event ที่เข้ามา
replyToken เป็น token ที่ใช้เพื่อส่งข้อความกลับไปหา User
type เป็นประเภทของ event เช่น message, postback, follow เป็นต้น
source คือ ผู้ส่ง ว่าส่งมาจาก user หรือ group หรือ room
message คือ payload ของข้อความ ซึ่งจะแตกต่างกันไปตามประเภทของข้อความ

Modify `config.json`
```json

{
  "port" : "3000",
  "channelAccessToken": "YOUR_CHANNEL_ACCESS_TOKEN",
  "channelSecret": "YOUR_CHANNEL_SECRET"
}
```

 --------------POULKAEW--------------------------------- */

'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');

// create LINE SDK client
const client = new line.Client(config);

const app = express();

// webhook callback
app.post('/webhook', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  // handle events separately
  Promise.all(req.body.events.map(event => {
    console.log('event', event);
    // check verify webhook event
    if (event.replyToken === '00000000000000000000000000000000' ||
      event.replyToken === 'ffffffffffffffffffffffffffffffff') {
      return;
    }
    return handleEvent(event);
  }))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken);
        case 'image':
          return handleImage(message, event.replyToken);
        case 'video':
          return handleVideo(message, event.replyToken);
        case 'audio':
          return handleAudio(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'follow':
      return replyText(event.replyToken, 'Got followed event');

    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case 'join':
      return replyText(event.replyToken, `Joined ${event.source.type}`);

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

    case 'postback':
      let data = event.postback.data;
      return replyText(event.replyToken, `Got postback: ${data}`);

    case 'beacon':
      const dm = `${Buffer.from(event.beacon.dm || '', 'hex').toString('utf8')}`;
      return replyText(event.replyToken, `${event.beacon.type} beacon hwid : ${event.beacon.hwid} with device message = ${dm}`);

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleText(message, replyToken) {
  return replyText(replyToken, message.text);
}

function handleImage(message, replyToken) {
  return replyText(replyToken, 'Got Image');
}

function handleVideo(message, replyToken) {
  return replyText(replyToken, 'Got Video');
}

function handleAudio(message, replyToken) {
  return replyText(replyToken, 'Got Audio');
}

function handleLocation(message, replyToken) {
  return replyText(replyToken, 'Got Location');
}

function handleSticker(message, replyToken) {
  return replyText(replyToken, 'Got Sticker');
}

const port = config.port;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
