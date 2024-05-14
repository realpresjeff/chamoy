# chamoy

chamoy is a TypeScript database that leverages IndexedDB API with Web SQL and Web Storage API as polyfills for browsers lacking support for IndexedDB. This approach ensures broad compatibility across most browser environments while maintaining efficient storage and querying capabilities.

## Features

- **IndexedDB API:**

  - Utilizes IndexedDB as the primary storage mechanism for modern browsers, providing efficient storage and querying capabilities.

- **Web SQL:**

  - Acts as a fallback polyfill for browsers lacking support for IndexedDB. Web SQL provides a SQL-based interface for relational database operations, enabling storage functionality in older browsers.

- **Web Storage API (localStorage and sessionStorage):**
  - Implements a simple key-value store for storing smaller amounts of data persistently or for the duration of a session. Serves as an additional fallback for browsers that do not support IndexedDB or Web SQL.

## Implementation Steps

1. **Feature Detection:**

   - Detect the availability of IndexedDB in the user's browser using feature detection techniques.

2. **IndexedDB Implementation:**

   - If IndexedDB is supported, use it as the primary storage mechanism. Implement necessary functions to interact with IndexedDB for storing and retrieving data.

3. **Web SQL Polyfill:**

   - For browsers lacking support for IndexedDB, implement a polyfill using Web SQL. Create a relational database interface and implement storage functions using SQL queries.

4. **Web Storage Fallback:**

   - If IndexedDB and Web SQL are not supported, fallback to Web Storage API. Implement functions to store and retrieve data using localStorage and sessionStorage.

5. **Syncing and Replication:**

   - Implement additional logic for syncing data between client and server if required. This may involve AJAX requests or WebSocket communication for data exchange with a server-side database.

By following these steps, chamoyDB offers a consistent storage solution across most browser environments, ensuring optimal performance and functionality where supported.

```usage

const database = new chamoy('myDatabase', 1);

database.setIndexes('myStore', 'id', [
    { name: 'nameIndex', keyPath: 'name', unique: false },
    { name: 'ageIndex', keyPath: 'age', unique: false }
]);

// Open the database
database.open()
    .then(db => {
        console.log('Database opened successfully');
        // Perform CRUD operations...
    })
    .catch(error => {
        console.error('Error opening database:', error);
    });
```

Here's a breakdown of what the class does:

1. **Constructor**: Initializes the database name, version, storage mode, and other properties.

2. **Miscellaneous Methods**:

   - `setIndexes`: Sets indexes for the database.
   - `getStorageUsageMessage`: Retrieves storage usage information.

3. **Database Connection Methods**:

   - `openIndexedDB`: Opens the database using IndexedDB.
   - `openWebSQL`: Opens the database using Web SQL.
   - `openWebStorage`: Opens the database using Web Storage.

4. **CRUD Operations**:

   - `put`: Inserts data into the database.
   - `get`: Retrieves data from the database.
   - `delete`: Deletes data from the database.

5. **Data Sync Methods**:
   - `exportTableToJson`: Exports database table data to JSON format.
   - `importJsonTable`: Imports JSON data into the database table.
