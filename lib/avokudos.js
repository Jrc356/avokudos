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

  sendUserSentNotification = async (client, fromUserID, toUserIDs, messageLink) => {
    const toUsers = toUserIDs.map((user) => mentionFromID(user))
    await this.sendUserMessage(
      client,
      IDFromMention(fromUserID),
      `You sent ${toUsers} avokudos for <${messageLink}|this message>!`
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

  getUserInfo = async (client, userID) => {
    return await client.users.info({
      user: IDFromMention(userID)
    })
  }

  userIsBot = async (client, userID) => {
    const userInfo = await this.getUserInfo(client, userID)
    return userInfo.user.is_bot
  }

  userIsEventUser = (user, eventUser) => {
    return IDFromMention(user) === IDFromMention(eventUser)
  }

  filterUsers = async (client, eventUser, users) => {
    const filteredUsers = []
    for (const user of users) {
      const userIsReactor = this.userIsEventUser(user, eventUser)
      const userIsBot = await this.userIsBot(client, user)
      if (!userIsReactor && !userIsBot) {
        filteredUsers.push(user)
      }
    }
    return filteredUsers
  }

  hearMessage = async (res) => {
    console.log('Heard message containing :avocado:')
    const { message, client } = res

    const mentionedUsers = await this.filterUsers(
      client,
      message.user,
      this.getMentionedUsers(message.text)
    )

    if (mentionedUsers.length < 1) {
      return
    }

    console.log(`${message.user} gave ${mentionedUsers} avocados via message in channel ${message.channel}`)

    const link = await this.getMessageLink(client, message.channel, message.ts)
    for (const user of mentionedUsers) {
      await this.keeper.giveUserKudos(user)
      await this.sendUserKudosNotification(client, user, message.user, link)
    }
    await this.sendUserSentNotification(client, message.user, mentionedUsers, link)
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
    const mentionedUsers = await this.filterUsers(
      client,
      event.user,
      this.getMentionedUsers(message)
    )
    if (mentionedUsers.length > 0) {
      console.log(`${event.user} gave an avocado to a message mentioning ${mentionedUsers} via reaction in channel ${event.item.channel}`)
      for (const user of mentionedUsers) {
        await this.keeper.giveUserKudos(user)
        await this.sendUserKudosNotification(client, user, event.user, link)
      }
      await this.sendUserSentNotification(client, event.user, mentionedUsers, link)
    } else if (!this.userIsEventUser(event.item_user, event.user)) {
      console.log(`${event.user} gave an avocado to ${event.item_user} via reaction in channel ${event.item.channel}`)
      await this.keeper.giveUserKudos(event.item_user)
      await this.sendUserKudosNotification(
        client,
        event.item_user,
        event.user,
        link
      )
      await this.sendUserSentNotification(client, event.user, [event.item_user], link)
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
    const mentionedUsers = await this.filterUsers(
      client,
      event.user,
      this.getMentionedUsers(message)
    )
    if (mentionedUsers.length > 0) {
      console.log(`${event.user} removed an avocado from a message mentioning ${mentionedUsers} in channel ${event.item.channel}`)
      for (const user of mentionedUsers) {
        await this.keeper.removeUserKudos(user)
      }
    } else if (!this.userIsEventUser(event.item_user, event.user)) {
      console.log(`${event.user} removed an avocado from ${event.item_user} message in channel ${event.item.channel}`)
      await this.keeper.removeUserKudos(event.item_user)
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
