# chamoy

chamoy is a TypeScript database that leverages IndexedDB API with Web SQL and Web Storage API as polyfills for browsers lacking support for IndexedDB. This approach ensures broad compatibility across most browser environments while maintaining efficient storage and querying capabilities.

## Features

- **IndexedDB API:**

  - Utilizes IndexedDB as the primary storage mechanism for modern browsers, providing efficient storage and querying capabilities.

- **Web SQL:**

  - Acts as a fallback polyfill for browsers lacking support for IndexedDB. Web SQL provides a SQL-based interface for relational database operations, enabling storage functionality in older browsers. (NOT YET IMPLEMENTED)

- **Web Storage API (localStorage and sessionStorage):**
  - Implements a simple key-value store for storing smaller amounts of data persistently or for the duration of a session. Serves as an additional fallback for browsers that do not support IndexedDB or Web SQL.

## Implementation

1. **Feature Detection:**

   - Detect the availability of IndexedDB in the user's browser.

2. **IndexedDB Implementation:**

   - If IndexedDB is supported, use it as the primary storage mechanism. Implement necessary functions to interact with IndexedDB for storing and retrieving data.

3. **Web SQL Polyfill:**

   - For browsers lacking support for IndexedDB, implement a polyfill using Web SQL. Create a relational database interface and implement storage functions using SQL queries.

4. **Web Storage Fallback:**

   - If IndexedDB and Web SQL are not supported, fallback to Web Storage API. Implement functions to store and retrieve data using localStorage and sessionStorage.

5. **Syncing and Replication:**

   - `exportTableToJson`: Exports database table data to JSON format.
   - `importJsonTable`: Imports JSON data into the database table.

By following these steps, chamoyDB offers a consistent storage solution across most browser environments, ensuring optimal performance and functionality where supported.

6. **CRUD Operations**:

   - `put`: Inserts data into the database.
   - `get`: Retrieves data from the database.
   - `getAll`: Retrieves all data from the database.
   - `update`: Updates data by key.
   - `delete`: Deletes data from the database.

```usage

const props = { databaseName: "MyDatabase", objectStoreName: "MyObjectStore", indexName: "NameIndex", indexArr: ["name.last", "name.first"], keyPath: "id"};

const db = new chamoy(props);

const put = db.put({ key: 12345, id: 12345, name: { first: "John", last: "Doe" }, age: 42 }, (res) => console.log(res));

db.get({key: 12345}, (res) => console.log(res));

db.update({ key: 12345, id: 12345, name: { first: "John", last: "Smith" }}, (res) => console.log(res));

db.get({ key: 12345 }, (res) => console.log(res));

db.delete({key: 12345}, (res) => console.log(res));

db.get({ key: 12345 }, (res) => console.log(res));

```
