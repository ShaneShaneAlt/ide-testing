import { getAllProjects, createNewProject, deleteProject, getProject, saveProject } from './db.js';
import { handleOnboarding, getFormattedTimestamp } from './common.js';
window.addEventListener('DOMContentLoaded', async ()=>{
handleOnboarding();
await loadProjects();
document.body.addEventListener('click', handleBodyClick);
});
async function handleBodyClick(event){
const target=event.target;
const menuBtn=target.closest('.project-menu-btn');
const menuItem=target.closest('.project-menu a');
const projectCard=target.closest('.project-card');
if(target.closest('#create-project-btn')){
await handleCreateProject();
return;
}
if(menuBtn){
event.stopPropagation();
toggleProjectMenu(menuBtn);
return;
}
if(menuItem){
event.preventDefault();
event.stopPropagation();
const card=menuItem.closest('.project-card');
const projectId=parseInt(card.dataset.projectId, 10);
if(menuItem.classList.contains('rename-btn')) await handleRenameProject(projectId);
if(menuItem.classList.contains('duplicate-btn')) await handleDuplicateProject(projectId);
if(menuItem.classList.contains('export-btn')) await handleExportProject(projectId);
if(menuItem.classList.contains('delete-btn')) await handleDeleteProject(projectId);
document.querySelectorAll('.project-menu.active').forEach(m=>m.classList.remove('active'));
return;
}
if(projectCard){
window.location.href=`ide.html?project=${projectCard.dataset.projectId}`;
return;
}
if(!target.closest('.project-menu-container')){
document.querySelectorAll('.project-menu.active').forEach(m=>m.classList.remove('active'));
}
}
function toggleProjectMenu(menuBtn){
const menu=menuBtn.nextElementSibling;
const isActive=menu.classList.contains('active');
document.querySelectorAll('.project-menu.active').forEach(m=>m.classList.remove('active'));
if(!isActive){
menu.classList.add('active');
}
}
async function handleRenameProject(projectId){
const project=await getProject(projectId);
const newName=prompt("Enter a new name for the project:", project.name);
if(newName&&newName.trim()!==""){
project.name=newName.trim();
project.lastModified=new Date();
await saveProject(project);
await loadProjects();
}
}
async function handleDeleteProject(projectId){
if(confirm(`Are you sure you want to delete this project? This cannot be undone.`)){
await deleteProject(projectId);
await loadProjects();
}
}
async function handleDuplicateProject(projectId){
const originalProject=await getProject(projectId);
const duplicatedProject=JSON.parse(JSON.stringify(originalProject));
delete duplicatedProject.id;
duplicatedProject.name=`${originalProject.name} (Copy)`;
duplicatedProject.created=new Date();
duplicatedProject.lastModified=new Date();
await saveProject(duplicatedProject);
await loadProjects();
}
async function handleExportProject(projectId){
if(typeof JSZip==='undefined'){
alert('Could not load the zip library. Please check your connection.');
return;
}
const project=await getProject(projectId);
const zip=new JSZip();
project.files.forEach(file=>{
zip.file(file.name, file.content);
});
const zipBlob=await zip.generateAsync({ type:'blob' });
const timestamp=getFormattedTimestamp();
const filename=`${project.name}_${timestamp}.zip`;
const link=document.createElement('a');
link.href=URL.createObjectURL(zipBlob);
link.download=filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}
async function loadProjects(){
const projects=await getAllProjects();
const grid=document.getElementById('projects-grid');
const emptyState=document.getElementById('empty-state');
grid.innerHTML='';
if(projects.length===0){
emptyState.classList.remove('hidden');
}else{
emptyState.classList.add('hidden');
projects.forEach(project=>{
grid.appendChild(createProjectCard(project));
});
}
}
function createProjectCard(project){
const card=document.createElement('div');
card.className='project-card';
card.dataset.projectId=project.id;
card.innerHTML=`
<div class="card-icon"><i class="fa-solid fa-code-branch"></i></div>
<div class="card-content">
<h3>${project.name}</h3>
<p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
</div>
<div class="project-menu-container">
<button class="project-menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
<div class="project-menu">
<a href="#" class="rename-btn"><i class="fa-solid fa-pen-to-square"></i> Rename</a>
<a href="#" class="duplicate-btn"><i class="fa-solid fa-copy"></i> Duplicate</a>
<a href="#" class="export-btn"><i class="fa-solid fa-file-zipper"></i> Export (.zip)</a>
<a href="#" class="delete-btn danger-text"><i class="fa-solid fa-trash-can"></i> Delete</a>
</div>
</div>
`;
return card;
}
async function handleCreateProject(){
const projectName=prompt("Enter a name for your new project:", "My New Project");
if(projectName&&projectName.trim()!==""){
try{
const newProjectId=await createNewProject(projectName.trim());
window.location.href=`ide.html?project=${newProjectId}`;
}catch(error){
console.error("Failed to create project:", error);
alert("Error: Could not create the project.");
}
}
}
