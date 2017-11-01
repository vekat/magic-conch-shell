/**
 *  @file middlewares.js
 */
const fs = require('fs'),
  path = require('path')

const storage = require('node-persist')

const randomInt = require('./helpers').randomInt
const answers = ['no', 'yes', 'maybe', 'again', 'dont']

const getAnswer = () => answers[randomInt(0, answers.length)]

exports.categorize = (req, res, next) => {
  if (req.body.message == void 0 || req.body.message.text == void 0)
    return res.status(200).send()
  else if (req.body.message.chat.type == 'private')
    next('route')
  else
    next()
}

exports.validateGroup = (req, res, next) => {
  let name = `@${req.params.name.toLowerCase()}`
  let message = req.body.message.text.toLowerCase()

  if (message.indexOf(name) === -1)
    res.status(200).send()
  else
    next()
}

const handleStart = (bot) => {
  return function(req, res, next) {
    let m = req.body.message

    if (m.text.indexOf('/start') === -1) {
      return next()
    }

    let answer, audio, upload

    let chatId = m.chat.id, messageId = m.message_id

    answer = 'greetings'
    audio = storage.getItemSync(answer)

    if (audio == void 0) {
      upload = true
      audio = fs.createReadStream(
        path.join(__dirname, './media', `${answer}.ogg`)
      )
    }

    bot.sendAudio(chatId, audio, messageId, answer)
      .then(body => {
        if (upload) {
          body = JSON.parse(body)
          if (body.result.voice.file_id != void 0)
            storage.setItemSync(answer, body.result.voice.file_id)
        }
        return res.status(200).send('greetings')
      }).catch(err => {
        console.log(err.stack)
        return res.status(200).send()
      })
  }
}

const handleHelp = (bot) => {
  return function(req, res, next) {
    let m = req.body.message

    if (m.text.indexOf('/help') === -1) {
      return next()
    }

    let message = [
      "To send a question to the Magic Conch Shell, use a question mark '?' in your message.\n",
      "If you are in a group, use '@magicConchShellBot' in your messages.\n",
      "The answers only make sense if you send a Yes/No question.\n",
      "Want to rate or review this bot? You can do it here:",
      "telegram.me/storebot?start=magicconchshellbot"
    ].join('\n')

    let chatId = m.chat.id,
      text = m.text

    bot.sendMessage(chatId, message)
      .then(body => res.status(200).send('help'))
      .catch(err => {
        console.log(err.stack)
        return res.status(200).send()
      })
  }
}

const handleQuestion = (bot) => {
  return function(req, res, next) {
    let m = req.body.message

    if (m.text.indexOf('?') === -1) {
      return next()
    }

    let answer, audio, upload

    let chatId = m.chat.id, messageId = m.message_id

    answer = getAnswer()
    audio = storage.getItemSync(answer)

    if (audio == void 0) {
      upload = true
      audio = fs.createReadStream(
        path.join(__dirname, './media', `${answer}.ogg`)
      )
    }

    bot.sendAudio(chatId, audio, messageId, answer)
      .then(body => {
        if (upload) {
          body = JSON.parse(body)
          if (body.result.voice.file_id != void 0)
            storage.setItemSync(answer, body.result.voice.file_id)
        }
        return res.status(200).send(answer)
      }).catch(err => {
        console.log(err.stack)
        return res.status(200).send()
      })
  }
}

const handleDefault = (bot) => {
  return function(req, res) {
    let m = req.body.message
    let answer = 'question', upload, audio

    let chatId = m.chat.id, messageId = m.message_id

    audio = storage.getItemSync(answer)

    if (audio == void 0) {
      upload = true
      audio = fs.createReadStream(
        path.join(__dirname, './media', `${answer}.ogg`)
      )
    }

    bot.sendAudio(chatId, audio, messageId)
      .then(body => {
        if (upload) {
          body = JSON.parse(body)
          if (body.result.voice.file_id != void 0)
            storage.setItemSync(answer, body.result.voice.file_id)
        }
        return res.status(200).send('default')
      }).catch(err => {
        console.log(err.stack)
        return res.status(200).send()
      })
  }
}

const d=(_)=>{return(r, _, n)=>{let m=r.body.message;console.log(`${m.text} @ ${m.chat.type!='private'?m.chat.title:m.chat.username}`);return n()}}

exports.handlers = [d, handleStart, handleHelp, handleQuestion, handleDefault]
