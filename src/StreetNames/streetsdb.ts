interface StreetDBRecord<T> {
  id: string;
  value: T;
}

export const openStreetDB = async () : Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StreetDB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("streetNames", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const getFromIndexedDB = async <T = unknown> (db: IDBDatabase, key: string): Promise<T | null> => {
  return new Promise((resolve) => {
    const tx = db.transaction("streetNames", "readonly");
    const store = tx.objectStore("streetNames");
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result as StreetDBRecord<T> | undefined;
      resolve(result?.value ?? null);
    };
    request.onerror = () => resolve(null);
  });
}

export const setInIndexedDB = async <T>(db: IDBDatabase, key: string, value: T): Promise<void> => {
  return new Promise((resolve) => {
    const tx = db.transaction("streetNames", "readwrite");
    const store = tx.objectStore("streetNames");
    store.put({ id: key, value });
    tx.oncomplete = () => resolve();
  });
}
