import Dexie from 'dexie';

export const db = new Dexie('MilanoteCloneDB');

db.version(2).stores({
  elements: '++id, type, x, y, title, parentId',
  connections: '++id, fromId, toId'
});

export const initialElements = [
  { id: 1, type: 'note', x: 200, y: 150, title: 'Welcome to Milanote', content: 'This is a note you can move around.' },
  { id: 2, type: 'note', x: 450, y: 300, title: 'Project Goals', content: '1. Create a PC app\n2. Create a Mobile app\n3. Match Milanote features' }
];

export async function seedDatabase() {
  const count = await db.elements.count();
  if (count === 0) {
    await db.elements.bulkAdd(initialElements);
  }
}
