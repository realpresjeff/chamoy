declare function openDatabase(
  name: string,
  version: string,
  displayName: string,
  estimatedSize: number,
  creationCallback?: (database: Database) => void
): Database;

interface Database {
  transaction: (
    callback: (tx: Transaction) => void,
    errorCallback?: (error: SQLError) => void,
    successCallback?: () => void
  ) => void;
  changeVersion: (
    oldVersion: string,
    newVersion: string,
    callback?: (database: Database) => void,
    errorCallback?: (error: SQLError) => void,
    successCallback?: () => void
  ) => void;
}

interface Transaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    successCallback?: (transaction: Transaction, resultSet: ResultSet) => void,
    errorCallback?: (transaction: Transaction, error: SQLError) => void
  ) => void;
}

interface ResultSet {
  insertId: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
}

interface SQLError {
  code: number;
  message: string;
}

export class chamoy {
  databaseName: string;
  storageMode: "IndexedDB" | "Web SQL" | "Web Storage";
  db: IDBDatabase | Database | 1 | null;
  version: number;
  indexes: { name: string; keyPath: string; unique?: boolean }[];
  storeName: string | null;
  keyPath: string | null;
  indexesSet: boolean;

  constructor(databaseName: string, version = 1) {
    this.databaseName = databaseName;
    this.version = version;
    this.db = null;
    this.indexes = [];
    this.storeName = null;
    this.keyPath = null;
    this.indexesSet = false; // Flag to track whether indexes are set
    this.storageMode = "IndexedDB";
  }

  // misc
  setIndexes(
    storeName: string,
    keyPath: string | null,
    indexes: { name: string; keyPath: string; unique?: boolean }[]
  ) {
    // Check if indexes are already set
    if (this.indexesSet) {
      throw new Error("Indexes can only be set before opening the database");
    }

    // Store the storeName and keyPath
    this.storeName = storeName;
    this.keyPath = keyPath;

    // Store the indexes
    this.indexes = indexes;

    // Set the flag to indicate that indexes are set
    this.indexesSet = true;
  }

  async getStorageUsageMessage(): Promise<{
    used: number;
    quota: number;
    percentUsed: string;
    message: string;
  }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return {
        used: 0,
        quota: 0,
        percentUsed: "0.00%",
        message: "Storage estimation is not supported in this browser.",
      };
    }

    try {
      const { usage, quota } = await navigator.storage.estimate();

      if (!usage || !quota) {
        return {
          used: 0,
          quota: 0,
          percentUsed: "0.00%",
          message: "Storage estimation data is not available.",
        };
      }

      const usedGB = usage / 1024 ** 3;
      const quotaGB = quota / 1024 ** 3;
      const percentUsed = ((usage / quota) * 100).toFixed(2);

      return {
        used: usedGB,
        quota: quotaGB,
        percentUsed: `${percentUsed}%`,
        message: `You're currently using about ${percentUsed}% of your estimated storage quota (${usedGB.toFixed(
          2
        )}GB / ${quotaGB.toFixed(2)}GB).`,
      };
    } catch (error) {
      console.error("Error estimating storage usage:", error);
      return {
        used: 0,
        quota: 0,
        percentUsed: "0.00%",
        message: "An error occurred while estimating storage usage.",
      };
    }
  }

  // db connection
  openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result || null;

        if (db) {
          this.db = db;
          resolve(db);
        } else {
          reject(
            new Error("Failed to open database: event.target.result is null")
          );
        }

        // Check if indexes are set before creating them
        if (this.indexesSet && this.indexes && this.indexes.length > 0) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: this.keyPath,
          });

          this.indexes.forEach((index) => {
            store.createIndex(index.name, index.keyPath, {
              unique: index.unique,
            });
          });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest).result || null;

        if (db) {
          this.db = db;
          resolve(db);
        } else {
          reject(
            new Error("Failed to open database: event.target.result is null")
          );
        }
        resolve(db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  openWebSQL(): Promise<Database> {
    return new Promise((resolve, reject) => {
      const dbName = this.databaseName;

      // Open Web SQL database
      const db = openDatabase(dbName, "1.0", dbName, 5 * 1024 * 1024);

      // Check if the database was successfully opened
      if (!db) {
        reject(new Error("Failed to open Web SQL database"));
      }

      // If successful, resolve with the database instance
      resolve(db);
    });
  }

  openWebStorage(): Promise<1> {
    return new Promise((resolve, reject) => {
      try {
        // Attempt to access localStorage
        if (typeof localStorage === "undefined") {
          // If localStorage is not available, reject the promise
          reject(new Error("localStorage is not available"));
        } else {
          // If localStorage is available, resolve the promise
          resolve(1);
        }
      } catch (error) {
        // If an error occurs, reject the promise with the error
        reject(error);
      }
    });
  }

  async open() {
    try {
      // Attempt to open the database using IndexedDB
      this.db = await this.openIndexedDB();
      this.storageMode = "IndexedDB";
      console.log("IndexedDB opened successfully");
    } catch (error) {
      console.error("Error opening IndexedDB:", error);
      try {
        // If IndexedDB fails, try opening the database using Web SQL
        this.db = await this.openWebSQL();
        this.storageMode = "Web SQL";
        console.log("Web SQL opened successfully");
      } catch (error) {
        console.error("Error opening Web SQL:", error);
        try {
          // If Web SQL also fails, try opening the database using Web Storage
          this.db = await this.openWebStorage();
          this.storageMode = "Web Storage";
          console.log("Web Storage opened successfully");
        } catch (error) {
          // If all methods fail, log the error
          console.error("Error opening Web Storage:", error);
          throw new Error("Failed to open database");
        }
      }
    }
  }

  async close() {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      this.db.close();
      console.log("IndexedDB connection closed successfully");
    } else if (this.storageMode === "Web SQL" && typeof this.db === "object") {
      // Web SQL does not have a close method, so we don't need to do anything here
      console.log("Web SQL connection does not require manual closure");
    } else if (this.storageMode === "Web Storage") {
      // Web Storage does not require manual closure, so we don't need to do anything here
      console.log("Web Storage connection does not require manual closure");
    } else {
      throw new Error("Unsupported storage mode");
    }
  }

  // CRUD
  async put(key: string, value: string) {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      try {
        const storeName = this.storeName || "";
        const transaction = this.db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put(value, key);
      } catch (e) {
        throw e;
      }
    } else if (this.storageMode === "Web SQL") {
      try {
        (this.db as Database).transaction((tx) => {
          tx.executeSql(
            `INSERT INTO ${this.storeName} (key, value) VALUES (?, ?)`,
            [key, JSON.stringify(value)],
            (res) => {
              return res;
            },
            (tx, error) => {
              throw error;
            }
          );
        });
      } catch (e) {
        throw e;
      }
    } else if (this.storageMode === "Web Storage") {
      localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    } else {
      throw new Error("Unsupported storage mode");
    }
  }

  async get(key: string) {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      return new Promise((resolve, reject) => {
        if (this.db && this.db instanceof IDBDatabase) {
          const storeName = this.storeName || "";
          const transaction = this.db.transaction([storeName]);
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.get(key);

          request.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            resolve(result);
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            reject(error);
          };
        }
      });
    } else if (this.storageMode === "Web SQL" && typeof this.db === "object") {
      return new Promise((resolve, reject) => {
        if (this.db && this.storageMode === "Web Storage") {
          (this.db as Database).transaction((tx) => {
            tx.executeSql(
              `SELECT value FROM ${this.storeName} WHERE key = ?`,
              [key],
              (tx, result) => {
                if (result.rows.length === 1) {
                  resolve(JSON.parse(result.rows.item(0).value));
                } else if (result.rows.length === 0) {
                  resolve(null); // Key not found
                } else {
                  reject(new Error("Multiple rows found for the same key"));
                }
              },
              (tx, error) => {
                reject(error);
              }
            );
          });
        }
      });
    } else if (this.storageMode === "Web Storage") {
      const value = localStorage.getItem(key);
      return Promise.resolve(value ? JSON.parse(value) : null);
    } else {
      throw new Error("Unsupported storage mode");
    }
  }

  async delete(key: string) {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      return new Promise((resolve, reject) => {
        if (this.db && this.db instanceof IDBDatabase) {
          const storeName = this.storeName || "";
          const transaction = this.db.transaction([storeName], "readwrite");
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.delete(key);

          request.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            resolve(result);
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            reject(error);
          };
        }
      });
    } else if (this.storageMode === "Web SQL" && typeof this.db === "object") {
      return new Promise((resolve, reject) => {
        if (this.db && this.storageMode === "Web Storage") {
          (this.db as Database).transaction((tx) => {
            tx.executeSql(
              `DELETE FROM ${this.storeName} WHERE key = ?`,
              [key],
              (tx, result) => {
                if (result.rows.length === 1) {
                  resolve(JSON.parse(result.rows.item(0).value));
                } else if (result.rows.length === 0) {
                  resolve(null); // Key not found
                } else {
                  reject(new Error("Multiple rows found for the same key"));
                }
              },
              (tx, error) => {
                reject(error);
              }
            );
          });
        }
      });
    } else if (this.storageMode === "Web Storage") {
      localStorage.removeItem(key);
      return Promise.resolve();
    } else {
      throw new Error("Unsupported storage mode");
    }
  }

  // data sync
  async exportTableToJson() {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      return new Promise((resolve, reject) => {
        if (
          this.storageMode === "IndexedDB" &&
          this.db instanceof IDBDatabase
        ) {
          const storeName = this.storeName || "";
          const transaction = this.db.transaction([storeName]);
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.getAll();

          request.onsuccess = (event) => {
            const data = (event.target as IDBRequest).result;
            const jsonData = JSON.stringify(data);
            resolve(jsonData);
          };

          request.onerror = (event) => {
            const error = (event.target as IDBRequest).error;
            reject(error);
          };
        }
      });
    } else if (this.storageMode === "Web SQL" && typeof this.db === "object") {
      return new Promise((resolve, reject) => {
        if (this.db && this.storageMode === "Web Storage") {
          (this.db as Database).transaction((tx) => {
            tx.executeSql(
              `SELECT * FROM ${this.storeName}`,
              [],
              (tx, result) => {
                const data = [];
                for (let i = 0; i < result.rows.length; i++) {
                  data.push(result.rows.item(i));
                }
                const jsonData = JSON.stringify(data);
                resolve(jsonData);
              },
              (tx, error) => {
                reject(error);
              }
            );
          });
        }
      });
    } else if (this.storageMode === "Web Storage") {
      const data: { [key: string]: any } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const item = localStorage.getItem(key);
          if (item) {
            data[key] = item;
          }
        }
      }
      const jsonData = JSON.stringify(data);
      return jsonData;
    } else {
      throw new Error("Unsupported storage mode");
    }
  }

  async importJsonTable(jsonData: string) {
    if (!this.db) {
      throw new Error("Database is not open");
    }

    // Parse JSON data
    const data = JSON.parse(jsonData);

    if (this.storageMode === "IndexedDB" && this.db instanceof IDBDatabase) {
      // Import data into IndexedDB
      const storeName = this.storeName || "";
      const transaction = this.db.transaction([storeName], "readwrite");
      const objectStore = transaction.objectStore(storeName);

      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const value = data[key];
          await objectStore.put(value, key);
        }
      }
    } else if (this.storageMode === "Web SQL" && typeof this.db === "object") {
      // Import data into Web SQL
      await new Promise<void>((resolve, reject) => {
        (this.db as Database).transaction((tx) => {
          for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
              const value = data[key];
              tx.executeSql(
                `INSERT INTO ${this.storeName} (key, value) VALUES (?, ?)`,
                [key, JSON.stringify(value)],
                () => {},
                (tx, error) => {
                  reject(error);
                }
              );
            }
          }
          resolve();
        });
      });
    } else if (this.storageMode === "Web Storage") {
      // Import data into Web Storage
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const value = data[key];
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } else {
      throw new Error("Unsupported storage mode");
    }
  }
}
