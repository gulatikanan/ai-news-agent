class Agent {
  constructor(name, handler) {
    this.name = name;
    this.handler = handler;
  }

  async run(context = {}) {
    const start = Date.now();
    console.log(`[${this.name}] starting`);
    try {
      const result = await this.handler(context);
      console.log(`[${this.name}] done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
      return result;
    } catch (err) {
      console.error(`[${this.name}] failed: ${err.message}`);
      throw err;
    }
  }
}

module.exports = { Agent };
