import { getProject, saveProject } from './db.js';
let editor;
let currentProject;
let openFileTabs=[];
let activeFileId=null;
let term;
const ideContainer=document.getElementById('ide-container');
const editorTabsContainer=document.getElementById('editor-tabs');
const searchInput=document.getElementById('search-input');
const searchResultsContainer=document.getElementById('search-results');
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
initializeTerminal();
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
value:`// Select a file to begin coding`,
language:'plaintext',
theme:'vs-dark',
automaticLayout:true,
roundedSelection:true
});
editor.onDidChangeCursorPosition(e=>{
const pos=e.position;
document.getElementById('cursor-status').textContent=`Ln ${pos.lineNumber}, Col ${pos.column}`;
});
monaco.editor.onDidCreateModel(model => {
model.onDidChangeContent(() => {
updateProblemsPanel();
});
});
});
}
function initializeTerminal(){
term = new Terminal({
cursorBlink: true,
theme: {
background: '#2a2a2a',
foreground: '#e8e8e8',
},
fontFamily: 'var(--font-mono)'
});
term.open(document.getElementById('terminal-container'));
term.write('RyxIDE Terminal (Bash loaded)\r\n$ ');
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
editorTabsContainer.addEventListener('click', (event) => {
const tab=event.target.closest('.tab');
const closeBtn=event.target.closest('.tab-close');
if(closeBtn){
event.stopPropagation();
closeFileTab(closeBtn.parentElement.dataset.fileId);
} else if(tab){
openFileInEditor(tab.dataset.fileId);
}
});
searchInput.addEventListener('input', (e) => performSearch(e.target.value));
}
function performSearch(query) {
searchResultsContainer.innerHTML = '';
if (!query || query.length < 2) {
return;
}
const queryLower = query.toLowerCase();
currentProject.files.forEach(file => {
const lines = file.content.split('\n');
lines.forEach((line, index) => {
if (line.toLowerCase().includes(queryLower)) {
const resultEl = document.createElement('div');
resultEl.textContent = `${file.name}:${index + 1} - ${line.trim()}`;
searchResultsContainer.appendChild(resultEl);
}
});
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
case 'rb':return 'fa-solid fa-gem';
case 'cs':return 'fa-solid fa-hashtag';
case 'json':return 'fa-solid fa-code';
case 'sql':return 'fa-solid fa-database';
case 'md':return 'fa-brands fa-markdown';
case 'xml':return 'fa-solid fa-file-code';
case 'sh':return 'fa-solid fa-terminal';
default:return 'fa-solid fa-file';
}
}
function openFileInEditor(fileId){
activeFileId = fileId;
if(!openFileTabs.includes(fileId)){
openFileTabs.push(fileId);
}
renderFileTabs();
document.querySelectorAll('#file-tree .file-item').forEach(el=>{
el.classList.toggle('active', el.dataset.fileId===fileId);
});
const file=currentProject.files.find(f=>f.id===fileId);
if(file&&editor){
let model = monaco.editor.getModels().find(m => m.uri.toString() === file.id);
if (!model) {
model = monaco.editor.createModel(file.content, getLanguageForFile(file.name), monaco.Uri.parse(file.id));
}
editor.setModel(model);
updateProblemsPanel();
document.getElementById('language-status').textContent=getLanguageForFile(file.name).toUpperCase();
}
}
function getLanguageForFile(filename) {
const extension = filename.split('.').pop();
switch(extension){
case 'js': return 'javascript';
case 'html': return 'html';
case 'css': return 'css';
case 'py': return 'python';
case 'php': return 'php';
case 'ts': return 'typescript';
case 'rb': return 'ruby';
case 'cs': return 'csharp';
case 'json': return 'json';
case 'sql': return 'sql';
case 'md': return 'markdown';
case 'xml': return 'xml';
case 'sh': return 'shell';
default: return 'plaintext';
}
}
function updateProblemsPanel() {
const problemsContainer = document.getElementById('problems-container');
const model = editor.getModel();
const markers = monaco.editor.getModelMarkers({ owner: model.getLanguageId() });
if (markers.length === 0) {
problemsContainer.innerHTML = '<p class="p-2">No problems have been detected.</p>';
return;
}
let html = '';
markers.forEach(marker => {
html += `<div>Error: ${marker.message} at line ${marker.startLineNumber}</div>`;
});
problemsContainer.innerHTML = html;
}
function renderFileTabs(){
editorTabsContainer.innerHTML='';
openFileTabs.forEach(fileId => {
const file=currentProject.files.find(f => f.id === fileId);
if(file){
const tabEl=document.createElement('div');
tabEl.className='tab';
tabEl.dataset.fileId=file.id;
if(file.id===activeFileId){
tabEl.classList.add('active');
}
tabEl.innerHTML=`
<i class="${getFileIcon(file.name)}"></i>
<span>${file.name}</span>
<i class="fa-solid fa-xmark tab-close"></i>
`;
editorTabsContainer.appendChild(tabEl);
}
});
}
function closeFileTab(fileId){
const index=openFileTabs.indexOf(fileId);
if(index > -1){
openFileTabs.splice(index, 1);
}
if(activeFileId === fileId) {
activeFileId = openFileTabs.length > 0 ? openFileTabs[openFileTabs.length - 1] : null;
}
if(activeFileId){
openFileInEditor(activeFileId);
} else {
editor.setModel(null);
editor.setValue('// All files closed.');
document.getElementById('language-status').textContent = '';
renderFileTabs();
}
}
function runCode(){
if(!editor)return;
const model=editor.getModel();
if (!model) {
alert("No active file to run!");
return;
}
const code=editor.getValue();
const language=model.getLanguageId();
const previewFrame=document.getElementById('preview-iframe');
console.log(`Running code in language: ${language}`);
ideContainer.classList.add('panel-visible');
setActivePanel('preview');
if(language==='html'){
const htmlFile=currentProject.files.find(f => f.name.endsWith('.html'));
const cssFile=currentProject.files.find(f => f.name.endsWith('.css'));
const jsFile=currentProject.files.find(f => f.name.endsWith('.js'));
let finalHtml=htmlFile ? htmlFile.content : '<h1>No index.html found</h1>';
if(cssFile){
finalHtml += `<style>${cssFile.content}</style>`;
}
if(jsFile){
finalHtml += `<script>${jsFile.content}<\/script>`;
}
const doc=previewFrame.contentWindow.document;
doc.open();
doc.write(finalHtml);
doc.close();
} else if(language === 'javascript') {
setActivePanel('terminal');
term.clear();
try {
const result = eval(code);
term.write(`> ${result}\r\n$ `);
} catch(e) {
term.write(`Error: ${e.message}\r\n$ `);
}
}
else{
alert(`Runner for "${language}" is not implemented yet.`);
}
}
