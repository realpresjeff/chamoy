import { data as data_, callback } from "./types";

export class LocalStorage {
  put(data: data_, callback: callback) {
    const props = {
      key: data.key,
      value: JSON.stringify(data),
    };

    localStorage.setItem(props.key, props.value);

    callback(props);
  }

  get(data: data_, callback: callback) {
    const item = localStorage.getItem(data.key);

    if (item) {
      callback(JSON.parse(item));
    } else callback(false);
  }

  getAll(callback: callback) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          items.push(JSON.parse(item));
        }
      }
    }
    callback(items);
  }

  update(data: data_, callback: callback) {
    this.get(data, (res) => {
      if (res) {
        this.put(data, callback);
      }
    });
  }

  delete(data: data_, callback: callback) {
    try {
      localStorage.removeItem(data.key);
      callback(true);
    } catch (e) {
      callback(false);
    }
  }
}
