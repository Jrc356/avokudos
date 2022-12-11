class RedisMock {
  constructor() {
    this.mem = {};
  }

  get = async (key) => {
    return this.mem[key] || 0;
  };
  set = async (key, value) => {
    this.mem[key] = value;
  };
  keys = async (any) => {
    return Object.keys(this.mem);
  };
}

module.exports = {
  RedisMock,
};
