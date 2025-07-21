// js/db.js (Corrected - Final Version)

// We no longer try to access window.idb here at the top level.

const DB_NAME = 'RyxIDE-DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

let db;

async function initDB() {
    // If the database connection is already open, just return it.
    if (db) return db;

    // THE FIX IS HERE:
    // We only access window.idb when this function is actually called,
    // which guarantees the library has loaded.
    if (!window.idb) {
        console.error("IndexedDB library (idb) is not loaded! Cannot initialize database.");
        throw new Error("Database library not found.");
    }
    const { openDB } = window.idb;

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


// --- Project Management Functions (No changes needed below) ---

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
    // Pre-fill a new project with some basic template files.
    // This is more useful for the user.
    const newProject = {
        name: name,
        template: template,
        files: [
            { id: 'index.html', name: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>${name}</title>\n</head>\n<body>\n    <h1>Welcome to ${name}</h1>\n</body>\n</html>` },
            { id: 'style.css', name: 'style.css', content: `body {\n    font-family: sans-serif;\n}` },
            { id: 'script.js', name: 'script.js', content: `console.log("Hello from ${name}!");` }
        ],
        created: new Date(),
        lastModified: new Date()
    };
    const id = await db.add(STORE_PROJECTS, newProject);
    console.log(`Created new project with ID: ${id}`);
    return id;
}
