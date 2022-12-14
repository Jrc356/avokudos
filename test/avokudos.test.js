const { Avokudos } = require('../lib/avokudos')
const { LocalKeeper } = require('../lib/keepers/local')

let mockSlackClient
let avokudos
let keeper
let mockUserInfo

describe('avokudos', () => {
  beforeEach(() => {
    keeper = new LocalKeeper()
    avokudos = new Avokudos(keeper)

    mockUserInfo = { user: { is_bot: false } }
    mockSlackClient = {
      chat: {
        postMessage: jest.fn(),
        getPermalink: jest.fn(() => 'test')
      },
      conversations: {
        replies: jest.fn()
      },
      users: {
        info: jest.fn(() => mockUserInfo)
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

  it('notifies a user when they send kudos', async () => {
    await avokudos.sendUserSentNotification(mockSlackClient, 'test', ['test'])
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(1)
  })

  it('retrieves a message from slack client', async () => {
    mockSlackClient.conversations.replies.mockReturnValueOnce({
      messages: [
        {
          text: 'test message'
        }
      ]
    })
    const text = await avokudos.getMessage(mockSlackClient, 'test', 'test')
    expect(mockSlackClient.conversations.replies.mock.calls.length).toBe(1)
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

    text = 'Hi, I\'m good, thanks for asking'
    users = avokudos.getMentionedUsers(text)
    expect(users).toStrictEqual([])
  })

  it('filters out bot users', async () => {
    mockUserInfo.user.is_bot = true
    mockSlackClient.users.info.mockReturnValueOnce(mockUserInfo)
    const users = await avokudos.filterUsers(mockSlackClient, '<@test>', ['<@bot_user>'])
    expect(users).toStrictEqual([])
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
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(4)
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

  it('gives users mentioned in a message an avocado if someone reacts to a message that mentions users with an avocado', async () => {
    const text =
      'hey <@test> <@test2> <@test3> :avocado: for helping with that issue!'

    mockSlackClient.conversations.replies.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test4',
        reaction: 'avocado',
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
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(4)
  })

  it('does not give users an avocado if the reaction used is not an avocado', async () => {
    const text =
      'hey <@test> <@test2> <@test3> :avocado: for helping with that issue!'

    mockSlackClient.conversations.replies.mockReturnValueOnce({
      messages: [
        {
          text
        }
      ]
    })

    await avokudos.hearReactionAdded({
      event: {
        user: 'test4',
        reaction: 'raised_hands',
        item_user: 'test2',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })
    expect(keeper.keeper.test).toBe(undefined)
    expect(keeper.keeper.test2).toBe(undefined)
    expect(keeper.keeper.test3).toBe(undefined)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('gives a user mentioned in a message a single avocado if someone reacts to a message that mentions the same user multiple times', async () => {
    const text =
      'hey <@test> <@test> :avocado: for helping with that issue!'

    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })
    expect(keeper.keeper.test).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(2)
  })

  it('does not give a user mentioned in a message an avocado if that user reacts to a message mentioning them', async () => {
    const text =
      'hey <@test>, lets be sneaky and give you an avocado by reacting to this message mentioning you!'

    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })
    expect(keeper.keeper.test).toBe(undefined)
    expect(keeper.keeper.test2).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(2)
  })

  it('gives a user an avocado if the message is reacted to and the message does not contain any mentions', async () => {
    const text = 'I just did a thing!'
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      },
      client: mockSlackClient
    })

    expect(keeper.keeper.test2).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(2)
  })

  it('does not give a user an avocado if the user reacts to their own message and the message does not contain any mentions', async () => {
    const text =
      "hehehe, I'm sneaky and giving myself an avocado through a reaction and no mentions"
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
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
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
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

  it('removes a single avocado from someone if another user removes their avocado reaction from a message containing multiple mentions of the same user', async () => {
    keeper.keeper.test2 = 2

    const text =
      'hey <@test2> <@test2> :avocado: for helping with that issue!'
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test2).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('removes an avocado from someone if someone removes their avocado reaction from a message that does not contain mentions', async () => {
    keeper.keeper.test = 1

    const text = 'Hey I did a thing!'
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
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
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
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
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        reaction: 'avocado',
        item: {
          channel: 'test_channel',
          ts: 'test_ts'
        }
      }
    })

    expect(keeper.keeper.test).toBe(1)
    expect(mockSlackClient.chat.postMessage.mock.calls.length).toBe(0)
  })

  it('does not remove an avocado from someone if the reaction removed is not an avocado', async () => {
    keeper.keeper.test = 1

    const text = "I'm weird and want to remove an avocado from myself!"
    mockSlackClient.conversations.replies.mockReturnValueOnce({
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
        item_user: 'test2',
        reaction: 'raised_hands',
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
      respond: jest.fn(),
      body: {}
    }

    await avokudos.getLeaderboard(mockRes)

    expect(mockRes.ack.mock.calls.length).toBe(1)
    expect(mockRes.respond.mock.calls.length).toBe(1)
  })
})
