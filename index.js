const { App } = require("@slack/bolt");
const { Avokudos } = require("./lib/avokudos");
const { LocalKeeper } = require("./lib/keepers/local");
const { RedisKeeper } = require("./lib/keepers/redis");
const redis = require("redis");

let keeper;
if (process.env.REDIS_HOST != undefined) {
  console.log("REDIS_HOST is set. Using RedisKeeper");
  const redis_client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASSWORD,
  });

  redis_client.on("error", (err) => {
    console.log("Redis Error: " + err);
  });
  redis_client
    .connect()
    .then(() => {
      console.log("Connected to redis instance");
    })
    .catch((err) => {
      console.error("Failed to connect to redis: " + err);
      rocess.exit(1);
    });

  keeper = new RedisKeeper(redis_client);
} else {
  console.log("Using LocalKeeper");
  keeper = new LocalKeeper();
}

const avokudos = new Avokudos(keeper);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.message(":avocado:", avokudos.hearMessage);
app.event("reaction_added", avokudos.hearReactionAdded);
app.event("reaction_removed", avokudos.hearReactionRemoved);

app.command("/leaderboard", avokudos.getLeaderboard);

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("🥑 Avokudos app is running!");
})();
