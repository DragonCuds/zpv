import { openDB } from 'idb';

const DB_NAME = 'zpv-gifs';
const STORE = 'gifs';

const getDB = () => openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    }
  },
});

export const saveGif = async (file) => {
  const db = await getDB();
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
  return db.add(STORE, {
    name: file.name,
    base64,
    createdAt: Date.now(),
  });
};

export const getAllGifs = async () => {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.map(g => ({ ...g, url: g.base64 }));
};

export const deleteGif = async (id) => {
  const db = await getDB();
  await db.delete(STORE, id);
};