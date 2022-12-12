const { IDFromMention, mentionFromID } = require('../user_id')

class LocalKeeper {
  constructor () {
    this.keeper = {}
  }

  getUserKudos = async (userID) => {
    return this.keeper[IDFromMention(userID)]
  }

  giveUserKudos = async (userID) => {
    const id = IDFromMention(userID)
    if (this.keeper[id] !== undefined) {
      this.keeper[id]++
    } else {
      this.keeper[id] = 1
    }
  }

  removeUserKudos = async (userID) => {
    const id = IDFromMention(userID)
    if (id in this.keeper) {
      if (this.keeper[id] > 0) {
        this.keeper[id]--
      }
    }
  }

  getLeaderboard = async () => {
    let response = 'Avokudos Leaderboard:\n'
    if (Object.keys(this.keeper).length === 0) {
      return 'No avocados have been given out yet!'
    }
    const sorted = Object.entries(this.keeper).sort(([, a], [, b]) => b - a)
    let i = 1
    for (const k of sorted) {
      response += `${i}. ${mentionFromID(k[0])}: ${k[1]}\n`
      i++
    }
    return response
  }
}

module.exports = {
  LocalKeeper
}
