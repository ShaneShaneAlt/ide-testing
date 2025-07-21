import { getProject, saveProject } from './db.js';
let editor;
let currentProject;
const ideContainer=document.getElementById('ide-container');
window.addEventListener('DOMContentLoaded', async ()=>{
const urlParams=new URLSearchParams(window.location.search);
const projectId=parseInt(urlParams.get('project'), 10);
if(!projectId){
alert("No project ID specified!");
window.location.href='index.html';
return;
}
currentProject=await getProject(projectId);
if(currentProject){
document.title=`${currentProject.name} - RyxIDE`;
initializeEditor();
renderFileTree();
if(currentProject.files.length>0){
openFileInEditor(currentProject.files[0].id);
}
}else{
alert("Project not found!");
window.location.href='index.html';
}
setupUIEventListeners();
});
function initializeEditor(){
require.config({ paths:{ 'vs':'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
window.MonacoEnvironment={
getWorkerUrl:function (workerId, label){
return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/worker/workerMain.js');`
)}`;
}
};
require(["vs/editor/editor.main"], function (){
editor=monaco.editor.create(document.getElementById('editor-container'), {
value:`// Welcome to RyxIDE\n// Select a file from the explorer to begin.`,
language:'javascript',
theme:'vs-dark',
automaticLayout:true,
roundedSelection:true
});
editor.onDidChangeCursorPosition(e=>{
const pos=e.position;
document.getElementById('cursor-status').textContent=`Ln ${pos.lineNumber}, Col ${pos.column}`;
});
});
}
function setupUIEventListeners(){
document.getElementById('run-btn').addEventListener('click', runCode);
document.getElementById('file-tree').addEventListener('click', (event)=>{
const fileItem=event.target.closest('.file-item');
if(fileItem){
openFileInEditor(fileItem.dataset.fileId);
}
});
ideContainer.addEventListener('click', (event)=>{
const action=event.target.dataset.action;
const view=event.target.dataset.view;
if(action==='toggle-sidebar'){
setActiveSidebarView(view);
ideContainer.classList.add('sidebar-visible');
}
if(action==='close-sidebar'||event.target.id==='mobile-overlay'){
ideContainer.classList.remove('sidebar-visible');
ideContainer.classList.remove('panel-visible');
}
if(action==='toggle-panel'){
ideContainer.classList.toggle('panel-visible');
}
});
document.getElementById('panel-tabs').addEventListener('click', (event)=>{
const tab=event.target.closest('.tab');
if(tab){
setActivePanel(tab.dataset.panel);
}
});
}
function setActiveSidebarView(viewName){
const sidebarTitle=document.getElementById('sidebar-title');
const activityBarIcons=document.querySelectorAll('#activity-bar i[data-view]');
const sidebarViews=document.querySelectorAll('#sidebar-content .sidebar-view');
sidebarTitle.textContent=viewName.toUpperCase();
activityBarIcons.forEach(icon=>icon.classList.toggle('active', icon.dataset.view===viewName));
sidebarViews.forEach(view=>view.classList.toggle('active', view.id===`${viewName}-view`));
}
function setActivePanel(panelName){
document.querySelectorAll('#panel-tabs .tab').forEach(tab=>{
tab.classList.toggle('active', tab.dataset.panel===panelName);
});
document.querySelectorAll('.panel-content .panel-view').forEach(view=>{
view.classList.toggle('active', view.id===`${panelName}-container`);
});
}
function renderFileTree(){
const fileTreeContainer=document.getElementById('file-tree');
fileTreeContainer.innerHTML='';
currentProject.files.forEach(file=>{
const fileElement=document.createElement('div');
const iconClass=getFileIcon(file.name);
fileElement.className='file-item';
fileElement.dataset.fileId=file.id;
fileElement.innerHTML=`<i class="${iconClass}"></i><span>${file.name}</span>`;
fileTreeContainer.appendChild(fileElement);
});
}
function getFileIcon(filename){
const extension=filename.split('.').pop();
switch(extension){
case 'html':return 'fa-brands fa-html5';
case 'css':return 'fa-brands fa-css3-alt';
case 'js':return 'fa-brands fa-square-js';
case 'py':return 'fa-brands fa-python';
case 'php':return 'fa-brands fa-php';
case 'ts':return 'fa-brands fa-node-js';
default:return 'fa-solid fa-file';
}
}
function openFileInEditor(fileId){
document.querySelectorAll('#file-tree .file-item').forEach(el=>{
el.classList.toggle('active', el.dataset.fileId===fileId);
});
const file=currentProject.files.find(f=>f.id===fileId);
if(file&&editor){
editor.setValue(file.content);
const extension=file.name.split('.').pop();
let language='plaintext';
switch(extension){
case 'js':language='javascript';break;
case 'html':language='html';break;
case 'css':language='css';break;
case 'py':language='python';break;
case 'php':language='php';break;
case 'ts':language='typescript';break;
}
monaco.editor.setModelLanguage(editor.getModel(), language);
document.getElementById('language-status').textContent=language.toUpperCase();
}
}
function runCode(){
if(!editor)return;
const code=editor.getValue();
const language=editor.getModel().getLanguageId();
const previewFrame=document.getElementById('preview-iframe');
console.log(`Running code in language: ${language}`);
ideContainer.classList.add('panel-visible');
setActivePanel('preview');
if(language==='html'){
const doc=previewFrame.contentWindow.document;
doc.open();
doc.write(code);
doc.close();
}else{
alert(`Runner for "${language}" is not implemented yet.`);
}
}
