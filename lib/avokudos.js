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

  sendUserKudosNotification = async (client, toUserID, fromUserID) => {
    const currentKudos = await this.keeper.getUserKudos(
      mentionFromID(toUserID)
    )
    await this.sendUserMessage(
      client,
      IDFromMention(toUserID),
      `You received avokudos from ${mentionFromID(
        fromUserID
      )}!\nYou now have ${currentKudos} :avocado:`
    )
  }

  getMessage = async (client, channel, ts) => {
    const messages = await client.conversations.history({
      channel,
      latest: ts,
      inclusive: true,
      limit: 1
    })

    return messages.messages[0].text
  }

  getMentionedUsers = (text) => {
    return text.match(/<@\w+>/g)
  }

  hearMessage = async (res) => {
    const { message, client } = res
    const mentionedUsers = this.getMentionedUsers(message.text)
    for (const user of mentionedUsers) {
      if (IDFromMention(user) !== IDFromMention(message.user)) {
        await this.keeper.giveUserKudos(user)
        await this.sendUserKudosNotification(client, user, message.user)
      }
    }
  }

  hearReactionAdded = async (res) => {
    const { client, event } = res
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    )
    const mentionedUsers = this.getMentionedUsers(message)
    if (mentionedUsers?.length > 0) {
      for (const user of mentionedUsers) {
        if (IDFromMention(user) !== IDFromMention(event.user)) {
          await this.keeper.giveUserKudos(user)
          await this.sendUserKudosNotification(client, user, event.user)
        }
      }
    } else {
      if (IDFromMention(event.item_user) !== IDFromMention(event.user)) {
        await this.keeper.giveUserKudos(event.item_user)
        await this.sendUserKudosNotification(
          client,
          event.item_user,
          event.user
        )
      }
    }
  }

  hearReactionRemoved = async (res) => {
    const { client, event } = res
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    )
    const mentionedUsers = this.getMentionedUsers(message)
    if (mentionedUsers?.length > 0) {
      for (const user of mentionedUsers) {
        if (IDFromMention(user) !== IDFromMention(event.user)) {
          await this.keeper.removeUserKudos(user)
        }
      }
    } else {
      if (IDFromMention(event.item_user) !== IDFromMention(event.user)) {
        await this.keeper.removeUserKudos(event.item_user)
      }
    }
  }

  getLeaderboard = async (res) => {
    const { ack, respond } = res
    await ack()
    await respond(await this.keeper.getLeaderboard())
  }
}

module.exports = {
  Avokudos
}
