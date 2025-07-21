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
if(action==='toggle-sidebar'){
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
}
function renderFileTree(){
const fileTreeContainer=document.getElementById('file-tree');
fileTreeContainer.innerHTML='';
currentProject.files.forEach(file=>{
const fileElement=document.createElement('div');
fileElement.textContent=file.name;
fileElement.dataset.fileId=file.id;
fileElement.className='file-item unselectable';
fileTreeContainer.appendChild(fileElement);
});
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
if(language==='html'){
const doc=previewFrame.contentWindow.document;
doc.open();
doc.write(code);
doc.close();
}else{
alert(`Runner for "${language}" is not implemented yet.`);
}
}
