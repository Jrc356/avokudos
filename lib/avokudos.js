const { IDFromMention, mentionFromID } = require('./user_id')

class Avokudos {
  constructor (keeper) {
    this.keeper = keeper
  }

  sendUserMessage = async (client, userID, text) => {
    await client.chat.postMessage({
      channel: IDFromMention(userID),
      text
    })
  }

  sendUserKudosNotification = async (client, toUserID, fromUserID, messageLink) => {
    const currentKudos = await this.keeper.getUserKudos(
      mentionFromID(toUserID)
    )
    await this.sendUserMessage(
      client,
      IDFromMention(toUserID),
      `You received avokudos from ${mentionFromID(
        fromUserID
      )} for <${messageLink}|this message>!\nYou now have ${currentKudos} :avocado:`
    )
  }

  getMessage = async (client, channel, ts) => {
    const messages = await client.conversations.replies({
      channel,
      ts
    })
    return messages.messages[0].text
  }

  getMessageLink = async (client, channel, ts) => {
    const link = await client.chat.getPermalink({
      channel,
      message_ts: ts
    })
    return link.permalink
  }

  getMentionedUsers = (text) => {
    return [...new Set(text.match(/<@\w+>/g))]
  }

  hearMessage = async (res) => {
    console.log('Heard message containing :avocado:')
    const { message, client } = res

    const mentionedUsers = this.getMentionedUsers(message.text)
    console.log(`${message.user} gave ${mentionedUsers} avocados via message in channel ${message.channel}`)

    const link = await this.getMessageLink(client, message.channel, message.ts)
    for (const user of mentionedUsers) {
      if (IDFromMention(user) !== IDFromMention(message.user)) {
        await this.keeper.giveUserKudos(user)
        await this.sendUserKudosNotification(client, user, message.user, link)
      }
    }
  }

  hearReactionAdded = async (res) => {
    console.log('Heard :avocado: reaction added')
    const { client, event } = res
    if (event.reaction !== 'avocado') {
      return
    }
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    )
    const link = await this.getMessageLink(client, event.item.channel, event.item.ts)
    const mentionedUsers = this.getMentionedUsers(message)
    if (mentionedUsers.length > 0) {
      console.log(`${event.user} gave an avocado to a message mentioning ${mentionedUsers} via reaction in channel ${event.item.channel}`)
      for (const user of mentionedUsers) {
        if (IDFromMention(user) !== IDFromMention(event.user)) {
          await this.keeper.giveUserKudos(user)
          await this.sendUserKudosNotification(client, user, event.user, link)
        }
      }
    } else {
      console.log(`${event.user} gave an avocado to ${event.item_user} via reaction in channel ${event.item.channel}`)
      if (IDFromMention(event.item_user) !== IDFromMention(event.user)) {
        await this.keeper.giveUserKudos(event.item_user)
        await this.sendUserKudosNotification(
          client,
          event.item_user,
          event.user,
          link
        )
      }
    }
  }

  hearReactionRemoved = async (res) => {
    console.log('Heard :avocado: reaction removed')
    const { client, event } = res
    if (event.reaction !== 'avocado') {
      return
    }
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    )
    const mentionedUsers = this.getMentionedUsers(message)
    if (mentionedUsers.length > 0) {
      console.log(`${event.user} removed an avocado from a message mentioning ${mentionedUsers} in channel ${event.item.channel}`)
      for (const user of mentionedUsers) {
        if (IDFromMention(user) !== IDFromMention(event.user)) {
          await this.keeper.removeUserKudos(user)
        }
      }
    } else {
      console.log(`${event.user} removed an avocado from ${event.item_user} message in channel ${event.item.channel}`)
      if (IDFromMention(event.item_user) !== IDFromMention(event.user)) {
        await this.keeper.removeUserKudos(event.item_user)
      }
    }
  }

  getLeaderboard = async (res) => {
    const { ack, respond } = res
    console.log(`leaderboard requested by ${res.body.user_id} in channel ${res.body.channel_id}`)
    await ack()
    await respond(await this.keeper.getLeaderboard())
  }
}

module.exports = {
  Avokudos
}
