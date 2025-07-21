// js/db.js

// We will import the 'idb' library via a CDN in our HTML files.
// This file assumes 'idb' is available in the global scope.

const DB_NAME = 'RyxIDE-DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

let db;

async function initDB() {
    if (db) return db;

    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create the 'projects' object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                // The 'id' will be our key, and we'll auto-increment it
                db.createObjectStore(STORE_PROJECTS, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
    console.log("Database initialized.");
    return db;
}

// --- Project Management Functions ---

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

// Example of creating a new project
export async function createNewProject(name, template = 'html') {
    const db = await initDB();
    const newProject = {
        name: name,
        template: template,
        files: [ /* Pre-fill with template files later */ ],
        created: new Date(),
        lastModified: new Date()
    };
    const id = await db.add(STORE_PROJECTS, newProject);
    console.log(`Created new project with ID: ${id}`);
    return id;
}
