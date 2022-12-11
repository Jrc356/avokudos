const { IDFromMention, mentionFromID } = require("./user_id");

class Avokudos {
  constructor(keeper) {
    this.keeper = keeper;
  }

  sendUserMessage = async (client, user_id, text) => {
    await client.chat.postMessage({
      channel: IDFromMention(user_id),
      text: text,
    });
  };

  sendUserKudosNotification = async (client, to_user_id, from_user_id) => {
    const current_kudos = await this.keeper.getUserKudos(
      mentionFromID(to_user_id)
    );
    await this.sendUserMessage(
      client,
      IDFromMention(to_user_id),
      `You received avokudos from ${mentionFromID(
        from_user_id
      )}!\nYou now have ${current_kudos} :avocado:`
    );
  };

  getMessage = async (client, channel, ts) => {
    const messages = await client.conversations.history({
      channel: channel,
      latest: ts,
      inclusive: true,
      limit: 1,
    });

    return messages.messages[0].text;
  };

  getMentionedUsers = (text) => {
    return text.match(/<@\w+>/g);
  };

  hearMessage = async (res) => {
    const { message, client } = res;
    const mentioned_users = this.getMentionedUsers(message.text);
    for (const user of mentioned_users) {
      if (IDFromMention(user) != IDFromMention(message.user)) {
        await this.keeper.giveUserKudos(user);
        await this.sendUserKudosNotification(client, user, message.user);
      }
    }
  };

  hearReactionAdded = async (res) => {
    const { client, event } = res;
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    );
    const mentioned_users = this.getMentionedUsers(message);
    if (mentioned_users?.length > 0) {
      for (const user of mentioned_users) {
        if (IDFromMention(user) != IDFromMention(event.user)) {
          await this.keeper.giveUserKudos(user);
          await this.sendUserKudosNotification(client, user, event.user);
        }
      }
    } else {
      if (IDFromMention(event.item_user) != IDFromMention(event.user)) {
        await this.keeper.giveUserKudos(event.item_user);
        await this.sendUserKudosNotification(
          client,
          event.item_user,
          event.user
        );
      }
    }
  };

  hearReactionRemoved = async (res) => {
    const { client, event } = res;
    const message = await this.getMessage(
      client,
      event.item.channel,
      event.item.ts
    );
    const mentioned_users = this.getMentionedUsers(message);
    if (mentioned_users?.length > 0) {
      for (const user of mentioned_users) {
        if (IDFromMention(user) != IDFromMention(event.user)) {
          await this.keeper.removeUserKudos(user);
        }
      }
    } else {
      if (IDFromMention(event.item_user) != IDFromMention(event.user)) {
        await this.keeper.removeUserKudos(event.item_user);
      }
    }
  };

  getLeaderboard = async (res) => {
    const { ack, respond } = res;
    await ack();
    await respond(await this.keeper.getLeaderboard());
  };
}

module.exports = {
  Avokudos,
};
