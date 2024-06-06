import { data, callback } from "./types";

export interface props {
  databaseName: string;
  objectStoreName: string;
  indexName: string;
  indexArr: string[];
  keyPath: string;
}

export class IndexedDB {
  private indexedDB = window.indexedDB;
  private props: props;

  constructor(props: props) {
    this.props = props;
  }

  put(data: data, callback: callback) {
    // Open (or create) the database
    var open = indexedDB.open(this.props.databaseName, 1);

    // Create the schema
    open.onupgradeneeded = () => {
      var db = open.result;
      var store = db.createObjectStore(this.props.objectStoreName, {
        keyPath: this.props.keyPath,
      });
      var index = store.createIndex(this.props.indexName, this.props.indexArr);
    };

    open.onsuccess = () => {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(this.props.objectStoreName, "readwrite");
      var store = tx.objectStore(this.props.objectStoreName);
      var index = store.index(this.props.indexName);

      const putRequest = store.put(data);
      callback(true);

      // Close the db when the transaction is done
      tx.oncomplete = function () {
        db.close();
      };
    };
  }

  get(data: data, callback: callback) {
    // Open the database
    var open = indexedDB.open(this.props.databaseName, 1);

    open.onsuccess = () => {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(this.props.objectStoreName, "readonly");
      var store = tx.objectStore(this.props.objectStoreName);

      // Get the data by key
      var getRequest = store.get(data.key);

      getRequest.onsuccess = function () {
        callback(getRequest.result);
      };

      getRequest.onerror = function () {
        console.error("Failed to retrieve data");
        callback(null);
      };

      // Close the db when the transaction is done
      tx.oncomplete = function () {
        db.close();
      };
    };

    open.onerror = function () {
      console.error("Failed to open database");
      callback(null);
    };
  }

  getAll(callback: callback) {
    // Open the database
    var open = this.indexedDB.open(this.props.databaseName, 1);

    open.onsuccess = () => {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(this.props.objectStoreName, "readonly");
      var store = tx.objectStore(this.props.objectStoreName);

      // Get all data
      var getAllRequest = store.getAll();

      getAllRequest.onsuccess = function () {
        callback(getAllRequest.result);
      };

      getAllRequest.onerror = function () {
        console.error("Failed to retrieve all data");
        callback(null);
      };

      // Close the db when the transaction is done
      tx.oncomplete = function () {
        db.close();
      };
    };
  }

  update(data: data, callback: callback) {
    // Open the database
    var open = indexedDB.open(this.props.databaseName, 1);

    open.onsuccess = () => {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(this.props.objectStoreName, "readwrite");
      var store = tx.objectStore(this.props.objectStoreName);

      // Get the existing data by key
      var getRequest = store.get(data.id);

      getRequest.onsuccess = function () {
        if (getRequest.result) {
          // If data exists, update it
          var putRequest = store.put(data);

          putRequest.onsuccess = function () {
            callback(true);
          };

          putRequest.onerror = function () {
            console.error("Failed to update data");
            callback(false);
          };
        } else {
          console.error("Data not found for update");
          callback(false);
        }
      };

      getRequest.onerror = function () {
        console.error("Failed to retrieve data for update");
        callback(false);
      };

      // Close the db when the transaction is done
      tx.oncomplete = function () {
        db.close();
      };
    };

    open.onerror = function () {
      console.error("Failed to open database");
      callback(false);
    };
  }

  delete(data: data, callback: callback) {
    // Open the database
    var open = indexedDB.open(this.props.databaseName, 1);

    open.onsuccess = () => {
      // Start a new transaction
      var db = open.result;
      var tx = db.transaction(this.props.objectStoreName, "readwrite");
      var store = tx.objectStore(this.props.objectStoreName);

      // Delete the data by key
      var deleteRequest = store.delete(data.key);

      deleteRequest.onsuccess = function () {
        callback(true);
      };

      deleteRequest.onerror = function () {
        console.error("Failed to delete data");
        callback(false);
      };

      // Close the db when the transaction is done
      tx.oncomplete = function () {
        db.close();
      };
    };

    open.onerror = function () {
      console.error("Failed to open database");
      callback(false);
    };
  }
}
