import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7.1.1/build/index.js';
const DB_NAME='RyxIDE-DB';
const DB_VERSION=1;
const STORE_PROJECTS='projects';
let db;
async function initDB(){
if(db)return db;
db=await openDB(DB_NAME, DB_VERSION, {
upgrade(db, oldVersion, newVersion, transaction){
console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
if(!db.objectStoreNames.contains(STORE_PROJECTS)){
db.createObjectStore(STORE_PROJECTS, { keyPath:'id', autoIncrement:true });
}
},
});
console.log("Database connection established.");
return db;
}
export async function getAllProjects(){
const db=await initDB();
return await db.getAll(STORE_PROJECTS);
}
export async function getProject(id){
const db=await initDB();
return await db.get(STORE_PROJECTS, id);
}
export async function saveProject(project){
const db=await initDB();
return await db.put(STORE_PROJECTS, project);
}
export async function deleteProject(id){
const db=await initDB();
return await db.delete(STORE_PROJECTS, id);
}
export async function createNewProject(name, template='html'){
const db=await initDB();
const newProject={
name:name,
template:template,
files:[
{ id:'index.html', name:'index.html', content:`<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>${name}</title>\n</head>\n<body>\n    <h1>Welcome to ${name}</h1>\n</body>\n</html>` },
{ id:'style.css', name:'style.css', content:`body {\n    font-family: sans-serif;\n}` },
{ id:'script.js', name:'script.js', content:`console.log("Hello from ${name}!");` }
],
created:new Date(),
lastModified:new Date()
};
const id=await db.add(STORE_PROJECTS, newProject);
console.log(`Created new project with ID: ${id}`);
return id;
}
