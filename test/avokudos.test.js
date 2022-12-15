const { Avokudos } = require('../lib/avokudos')
const { LocalKeeper } = require('../lib/keepers/local')

let mockSlackClient
let avokudos
let keeper

describe('avokudos', () => {
  beforeEach(() => {
    keeper = new LocalKeeper()
    avokudos = new Avokudos(keeper)

    mockSlackClient = {
      chat: {
        postMessage: jest.fn()
      },
      conversations: {
        history: jest.fn()
      }
    }
  })

  it('sends a user a message', async () => {
    await avokudos.sendUserMessage(mockSlackClient, 'test', 'test')
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(1)
  })

  it('notifies a user when they receive kudos', async () => {
    await avokudos.sendUserKudosNotification(mockSlackClient, 'test', 'test')
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(1)
  })

  it('retrieves a message from slack client', async () => {
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text: 'test message'
        }
      ]
    })
    const text = await avokudos.getMessage(mockSlackClient, 'test', 'test')
    expect(mockSlackClient.conversations.history.mock.calls.length).toBe(1)
    expect(text).toBe('test message')
  })

  it('gets unique mentioned users from text', () => {
    let text = 'hi <@test>! how are you?'
    let users = avokudos.getMentionedUsers(text)
    expect(users).toStrictEqual(['<@test>'])

    text = "hey <@test2> this is <@test>. I'm good, how are you?"
    users = avokudos.getMentionedUsers(text)
    expect(users).toStrictEqual(['<@test2>', '<@test>'])

    text = 'hi <@test>! how are you? Mentioning you twice for double the avocados! <@test>'
    users = avokudos.getMentionedUsers(text)
    expect(users).toStrictEqual(['<@test>'])
  })

  it('gives users mentioned in a message with an avocado and gives those users an avocado', async () => {
    const text =
      'hey <@test> <@test2> <@test3> :avocado: for helping with that issue!'
    await avokudos.hearMessage({
      message: {
        text,
        user: 'test4'
      },
      client: mockSlackClient
    })

    expect(keeper.keeper.test).toBe(1)
    expect(keeper.keeper.test2).toBe(1)
    expect(keeper.keeper.test3).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(3)
  })

  it('does not give a user avocados by mentioning themselves in a message', async () => {
    const text =
      "hehehe I'm sneaky and giving myself an avocado! <@test> :avocado:"
    await avokudos.hearMessage({
      message: {
        text,
        user: 'test'
      },
      client: mockSlackClient
    })

    expect(keeper.keeper.test).toBe(undefined)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('gives users mentioned in a message an avocado if someone reacts to a message that mentions users', async () => {
    const text =
      'hey <@test> <@test2> <@test3> :avocado: for helping with that issue!'

    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test4',
        item_user: 'test2',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })
    expect(keeper.keeper.test).toBe(1)
    expect(keeper.keeper.test2).toBe(1)
    expect(keeper.keeper.test3).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(3)
  })

  it('does not give a user mentioned in a message an avocado if that user reacts to a message mentioning them', async () => {
    const text =
      "hehehe, I'm sneaky and giving myself an avocado through a reaction! <@test>"

    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test',
        item_user: 'test2',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })
    expect(keeper.keeper.test).toBe(undefined)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('gives a user an avocado if the message is reacted to and the message does not contain any mentions', async () => {
    const text = 'I just did a thing!'
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test4',
        item_user: 'test2',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })

    expect(keeper.keeper.test2).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(1)
  })

  it('does not give a user an avocado if the user reacts to their own message and the message does not contain any mentions', async () => {
    const text =
      "hehehe, I'm sneaky and giving myself an avocado through a reaction and no mentions"
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test2',
        item_user: 'test2',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })

    expect(keeper.keeper.test2).toBe(undefined)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('removes an avocado from someone if someone removes their avocado reaction from a message containing mentions', async () => {
    keeper.keeper.test = 1
    keeper.keeper.test2 = 1
    keeper.keeper.test3 = 1

    const text =
      'hey <@test> <@test2> <@test3> :avocado: for helping with that issue!'
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionRemoved({
      client: mockSlackClient,
      event: {
        user: 'test4',
        item_user: 'test',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test).toBe(0)
    expect(keeper.keeper.test2).toBe(0)
    expect(keeper.keeper.test3).toBe(0)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('removes an avocado from someone if someone removes their avocado reaction from a message that does not contain mentions', async () => {
    keeper.keeper.test = 1

    const text = 'Hey I did a thing!'
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionRemoved({
      client: mockSlackClient,
      event: {
        user: 'test4',
        item_user: 'test',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test).toBe(0)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('does not remove an avocado from someone if they remove their avocado reaction from a message that mentions themselves', async () => {
    keeper.keeper.test = 1

    const text = "I'm weird and want to remove an avocado from myself! <@test>"
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionRemoved({
      client: mockSlackClient,
      event: {
        user: 'test',
        item_user: 'test',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('does not remove an avocado from someone if they remove their avocado reaction from their own message', async () => {
    keeper.keeper.test = 1

    const text = "I'm weird and want to remove an avocado from myself!"
    mockSlackClient.conversations.history.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionRemoved({
      client: mockSlackClient,
      event: {
        user: 'test',
        item_user: 'test',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('responds the the leaderboard command', async () => {
    keeper.keeper = {
      test1: 1,
      test2: 3,
      test3: 2
    }

    const mockRes = {
      ack: jest.fn(),
      respond: jest.fn()
    }

    await avokudos.getLeaderboard(mockRes)

    expect(mockRes.ack.mock.calls.length).toBe(1)
    expect(mockRes.respond.mock.calls.length).toBe(1)
  })
})
