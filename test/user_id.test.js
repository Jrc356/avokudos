const { IDFromMention, mentionFromID } = require("../lib/user_id");

describe("user id utils", () => {
  it("converts a mention to a user id", () => {
    expect(IDFromMention("<@test>")).toBe("test");
  });

  it("returns a user id", () => {
    expect(IDFromMention("test")).toBe("test");
  });

  it("converts an to a mention", () => {
    expect(mentionFromID("test")).toBe("<@test>");
  });

  it("returns a mention", () => {
    expect(mentionFromID("<@test>")).toBe("<@test>");
  });
});
