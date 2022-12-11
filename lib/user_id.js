const IDFromMention = (mention) => {
  if (mention.includes("<")) {
    return mention.replace("<@", "").replace(">", "");
  } else {
    return mention;
  }
};

const mentionFromID = (id) => {
  if (id.includes("<")) {
    return id;
  } else {
    return `<@${id}>`;
  }
};

module.exports = {
  IDFromMention,
  mentionFromID,
};
