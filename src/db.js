import Dexie from "dexie";

export class lowCodeDB extends Dexie {
  constructor() {
    super("previewData");
    this.version(1).stores({
      scenes: "++id, code, data",
    });
  }

  async query_code(code) {
    const res = await this.scenes
      .where("code")
      .equalsIgnoreCase(code)
      .toArray();
    return res[0];
  }

  async add(params) {
    const { code } = params;
    const targetItem = await this.query_code(code);
    if (targetItem) {
      this.update(targetItem.code, params);
    } else {
      await this.scenes.add(params);
    }
  }

  async update(code, params) {
    const { id } = await this.query_code(code);
    await this.scenes.put({ id, ...params });
  }

  async delete(code) {
    const { id } = await this.query_code(code);
    await this.scenes.delete(id);
  }
}

export const db = new lowCodeDB();
