// js/db.js (Corrected with v7.1.1 from the provided images)

// THE CORRECTED LINE: Using the specific version and file path from the CDN listing.
// This is the correct ES Module entry point for idb v7.1.1.
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7.1.1/build/index.js';

const DB_NAME = 'RyxIDE-DB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

// Singleton to hold the database connection.
let db;

async function initDB() {
    if (db) return db;

    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
            if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                db.createObjectStore(STORE_PROJECTS, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
    console.log("Database connection established.");
    return db;
}


// --- Project Management Functions (These are all correct and do not need changes) ---

/**
 * Gets all projects from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of projects.
 */
export async function getAllProjects() {
    const db = await initDB();
    return await db.getAll(STORE_PROJECTS);
}

/**
 * Gets a single project by its ID.
 * @param {number} id The ID of the project to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the project object.
 */
export async function getProject(id) {
    const db = await initDB();
    return await db.get(STORE_PROJECTS, id);
}

/**
 * Saves a project to the database. Updates an existing project or creates a new one.
 * @param {Object} project The project object to save.
 * @returns {Promise<number>} A promise that resolves to the project's ID.
 */
export async function saveProject(project) {
    const db = await initDB();
    return await db.put(STORE_PROJECTS, project);
}

/**
 * Deletes a project by its ID.
 * @param {number} id The ID of the project to delete.
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
    const db = await initDB();
    return await db.delete(STORE_PROJECTS, id);
}

/**
 * Creates a brand new project with a default template.
 * @param {string} name The name for the new project.
 * @param {string} template The template type (e.g., 'html').
 * @returns {Promise<number>} A promise that resolves to the new project's ID.
 */
export async function createNewProject(name, template = 'html') {
    const db = await initDB();
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
