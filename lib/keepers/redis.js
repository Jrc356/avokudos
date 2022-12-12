const { IDFromMention, mentionFromID } = require('../user_id')

class RedisKeeper {
  constructor (client) {
    this.client = client
  }

  getUserKudos = async (userID) => {
    const id = IDFromMention(userID)
    return await this.client.get(id)
  }

  giveUserKudos = async (userID) => {
    const id = IDFromMention(userID)
    const kudos = Number(await this.client.get(id))
    await this.client.set(id, kudos + 1)
  }

  removeUserKudos = async (userID) => {
    const id = IDFromMention(userID)
    const kudos = Number(await this.client.get(id))
    if (kudos > 0) {
      await this.client.set(id, kudos - 1)
    }
  }

  getLeaderboard = async () => {
    let response = 'Avokudos Leaderboard:\n'
    const kudos = {}
    const keys = await this.client.keys('*')

    if (keys.length === 0) {
      return 'No avocados have been given out yet!'
    }

    for (const key of keys) {
      const k = await this.client.get(key)
      kudos[key] = k
    }
    const sorted = Object.entries(kudos).sort(([, a], [, b]) => b - a)
    let i = 1
    for (const k of sorted) {
      response += `${i}. ${mentionFromID(k[0])}: ${k[1]}\n`
      i++
    }
    return response
  }
}

module.exports = {
  RedisKeeper
}
