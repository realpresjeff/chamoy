import { chamoy } from "./index";

describe("chamoy", () => {
  let db: chamoy;

  beforeEach(() => {
    db = new chamoy("test-db", 1);
  });

  afterEach(async () => {
    // Check if the database is open before attempting to close it
    if (db && db.db) {
      await db.close();
    }
  });

  test("initializes correctly", () => {
    expect(db).toBeDefined();
    expect(db.databaseName).toEqual("test-db");
    expect(db.version).toEqual(1);
  });

  test("setIndexes method sets indexes correctly", () => {
    const indexes = [{ name: "index1", keyPath: "key1" }];
    db.setIndexes("storeName", "keyPath", indexes);
    expect(db.storeName).toEqual("storeName");
    expect(db.keyPath).toEqual("keyPath");
    expect(db.indexes).toEqual(indexes);
    expect(db.indexesSet).toBeTruthy();
  });

  test("getStorageUsageMessage method returns correct message", async () => {
    const usageMessage = await db.getStorageUsageMessage();
    expect(usageMessage).toHaveProperty("used");
    expect(usageMessage).toHaveProperty("quota");
    expect(usageMessage).toHaveProperty("percentUsed");
    expect(usageMessage).toHaveProperty("message");
  });

  // Add more test cases for other methods
});
