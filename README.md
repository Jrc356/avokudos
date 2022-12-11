[![Generic badge](https://img.shields.io/badge/Status-Under%20Development-yellow.svg)](https://shields.io/)

# TODO
- [ ] Add CI/CD
- [ ] Build and push image to dockerhub
- [ ] Validate k8s deployment
- [ ] Flesh out docs
- [ ] Look into slack apps to simplify end user setup

# Manual Slack Setup
1. [Create a new slack app](https://api.slack.com/apps/new)
2. Copy `Signing Secret`
3. Go to `Features > Oauth & Permissions` and grant the following permissions:
   1. `channels:history`: the bot needs to be able to read messages that are reacted to
   <!-- TODO: verify this is needed -->
   2. `chat:write`: for the bot to write messages
   3. `reactions:read`: so that the bot can react to reaction events
4. Install app in workspace
5. Copy the `Bot User Oauth Toekn`
6. Enable `Socket Mode` in `Settings > Socket Mode`
   1. this should force you to create an app token and add the `connections:write` scope
7. Copy the newly created `App-Level Token` in `Settings > Basic Information`
8. Go to `Features > Event Subscriptions` and enable the following `bot events`:
   1. `message.channels`: so that the bot can react to messages sent in channels
   2. `reaction_added`: so the bot can react to reactions added to messages
9. Add a slack command for `/leaderboard`

# Build and Deploy the App
<!-- TODO -->

# Local Development
1. export the following environment variables (copied when creating the app):
   1. `SLACK_BOT_TOKEN`
   2. `SLACK_SIGNING_SECRET`
   3. `SLACK_APP_TOKEN`
2. run the app with `npm start`

## Testing
- Run `npm test` to run the tests
- Run `npm run coverage` to run the tests with coverage output 

## Docker
1. export the following environment variables (copied when creating the app):
   1. `SLACK_BOT_TOKEN`
   2. `SLACK_SIGNING_SECRET`
   3. `SLACK_APP_TOKEN`
2. run the app with `npm run docker-build-and-run`