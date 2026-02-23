import Dexie from 'dexie';

const db = new Dexie('SimpleLearningNotes');

db.version(1).stores({
  categories: '++id, title',
  notes: '++id, categoryId, time, title'
});

export default db;
