const { RedisKeeper } = require('../lib/keepers/redis')
const { RedisMock } = require('./mocks/redis_mock')

let redisMock
let keeper

process.env.REDIS_HOST = null

describe('redis keeper', () => {
  beforeEach(() => {
    redisMock = new RedisMock()
    keeper = new RedisKeeper(redisMock)
  })

  it('can retrieve a users kudos', async () => {
    redisMock.set('test', 1)
    expect(await keeper.getUserKudos('test')).toBe(1)
  })

  it('gives a user an avocado who has never received an avocado', async () => {
    await keeper.giveUserKudos('<@test>')
    expect(redisMock.mem.test).toBe(1)
  })

  it('gives a user an avocado who has received an avocado before', async () => {
    redisMock.set('test', 1)
    await keeper.giveUserKudos('<@test>')
    expect(redisMock.mem.test).toBe(2)
  })

  it('removes an avocado from a user', async () => {
    redisMock.set('test', 1)
    await keeper.removeUserKudos('<@test>')
    expect(redisMock.mem.test).toBe(0)
  })

  it('does not remove an avocado from a user if the user has no avocados', async () => {
    redisMock.set('test', 0)
    await keeper.removeUserKudos('<@test>')
    expect(redisMock.mem.test).toBe(0)
  })

  it('does not remove an avocado from a user who has not received an avocado before', async () => {
    await keeper.removeUserKudos('<@test>')
    expect(redisMock.mem.test).toBe(undefined)
  })

  it('prints a sorted leaderboard', async () => {
    redisMock.set('test1', 1)
    redisMock.set('test2', 3)
    redisMock.set('test3', 2)
    const leaderboard = await keeper.getLeaderboard()
    expect(leaderboard).toBe(
      'Avokudos Leaderboard:\n1. <@test2>: 3\n2. <@test3>: 2\n3. <@test1>: 1\n'
    )
  })

  it('prints a leaderboard when no one has kudos', async () => {
    const leaderboard = await keeper.getLeaderboard()
    expect(leaderboard).toBe('No avocados have been given out yet!')
  })
})
