import { LocalStorage } from "./localstorage";
import { IndexedDB, props } from "./indexeddb";
import { data as data_, callback } from "./types";

export enum storage_mode {
  INDEXEDDB = "IndexedDB",
  WEBSTORAGE = "Web Storage",
}

export class chamoy {
  private db: LocalStorage | IndexedDB;

  constructor(props: props) {
    // Check if IndexedDB is available
    if (window.indexedDB) {
      this.db = new IndexedDB(props);
    } else {
      this.db = new LocalStorage();
    }
  }

  async put(data: data_, callback: callback) {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.put(data, (result) => {
          if (result) resolve();
          else reject(new Error("Failed to put data"));
        });
      });
      callback(true);
    } catch (e) {
      callback(false);
      throw e;
    }
  }

  async get(data: data_, callback: callback) {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.get(data, (result) => {
          if (result) {
            callback(result);
            resolve();
          } else {
            callback(null);
            reject(new Error("Failed to get data"));
          }
        });
      });
    } catch (e) {
      callback(null);
      throw e;
    }
  }

  async update(data: data_, callback: callback) {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.update(data, (result) => {
          if (result) resolve();
          else reject(new Error("Failed to update data"));
        });
      });
      callback(true);
    } catch (e) {
      callback(false);
      throw e;
    }
  }

  async delete(data: data_, callback: callback) {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.delete(data, (result) => {
          if (result) resolve();
          else reject(new Error("Failed to delete data"));
        });
      });
      callback(true);
    } catch (e) {
      callback(false);
      throw e;
    }
  }

  // data sync
  async exportTableToJson(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.getAll((data) => {
        if (data) {
          resolve(JSON.stringify(data));
        } else {
          reject(new Error("Failed to export data"));
        }
      });
    });
  }

  async importJsonTable(jsonData: string) {
    // Parse JSON data
    const data = JSON.parse(jsonData);

    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const value = data[key];
        await new Promise<void>((resolve, reject) => {
          this.db.put(value, (result) => {
            if (result) resolve();
            else reject(new Error("Failed to put data during import"));
          });
        });
      }
    }
  }
}
