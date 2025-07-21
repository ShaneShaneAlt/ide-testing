// js/db.js (Corrected)

// We now explicitly pull openDB from the global window.idb object.
const { openDB } = window.idb;

if (!openDB) {
    console.error("IndexedDB library (idb) is not loaded!");
    // You could show an error to the user here
}

const DB_NAME = 'RyxIDE-DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

let db;

async function initDB() {
    if (db) return db;

    // Make sure openDB is available before trying to use it
    if (!openDB) {
        throw new Error("Database library not found.");
    }

    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                db.createObjectStore(STORE_PROJECTS, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
    console.log("Database initialized.");
    return db;
}

// --- Project Management Functions (No changes needed below this line) ---

export async function getAllProjects() {
    const db = await initDB();
    return await db.getAll(STORE_PROJECTS);
}

export async function getProject(id) {
    const db = await initDB();
    return await db.get(STORE_PROJECTS, id);
}

export async function saveProject(project) {
    const db = await initDB();
    return await db.put(STORE_PROJECTS, project);
}

export async function deleteProject(id) {
    const db = await initDB();
    return await db.delete(STORE_PROJECTS, id);
}

export async function createNewProject(name, template = 'html') {
    const db = await initDB();
    // For now, new projects are simple. We'll add template files later.
    const newProject = {
        name: name,
        template: template,
        files: [
            { id: 'index.html', name: 'index.html', content: '<h1>Hello World</h1>' },
            { id: 'style.css', name: 'style.css', content: 'body { color: blue; }' },
        ],
        created: new Date(),
        lastModified: new Date()
    };
    const id = await db.add(STORE_PROJECTS, newProject);
    console.log(`Created new project with ID: ${id}`);
    return id;
}
