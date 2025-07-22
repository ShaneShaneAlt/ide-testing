import { getProject, saveProject } from './db.js';
console.log('[RDE] ide.js module loaded');
let editor;
let currentProject;
let openFileTabs=[];
let activeFileId=null;
let term;
const runtimes = {
python: { loaded: false, instance: null, loading: false },
php: { loaded: false, instance: null, loading: false }
};
const ideContainer=document.getElementById('ide-container');
const editorTabsContainer=document.getElementById('editor-tabs');
const searchInput=document.getElementById('search-input');
const searchResultsContainer=document.getElementById('search-results');
const consoleContainer=document.getElementById('console-container');
window.addEventListener('DOMContentLoaded', async ()=>{
logToIdeConsole('RDE Initializing...');
const urlParams=new URLSearchParams(window.location.search);
const projectId=parseInt(urlParams.get('project'), 10);
if(!projectId){
logToIdeConsole('No project ID found in URL.', 'error');
alert("No project ID specified!");
window.location.href='index.html';
return;
}
logToIdeConsole(`Project ID found: ${projectId}`);
currentProject=await getProject(projectId);
if(currentProject){
logToIdeConsole('Project data loaded successfully.');
document.title=`${currentProject.name} - RyxIDE`;
await initializeEditor();
initializeTerminal();
renderFileTree();
if(currentProject.files.length>0){
openFileInEditor(currentProject.files[0].id);
}
setupUIEventListeners();
logToIdeConsole('UI setup complete. Ready.');
}else{
logToIdeConsole(`Project with ID ${projectId} not found.`, 'error');
alert("Project not found!");
window.location.href='index.html';
}
});
async function initializeEditor(){
return new Promise((resolve) => {
if(typeof monaco !== 'undefined' && editor) return resolve();
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
roundedSelection:true,
scrollbar: {
verticalScrollbarSize: 10,
horizontalScrollbarSize: 10
}
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
logToIdeConsole('Monaco Editor instance created.');
resolve();
});
});
}
function initializeTerminal(){
try {
if (typeof jQuery === 'undefined' || typeof jQuery.fn.terminal === 'undefined') {
logToIdeConsole('jQuery or jQuery.terminal not found.', 'error');
return;
}
term = $('#terminal-container div').terminal(async (command) => {
if(command !== ''){
logToIdeConsole(`Terminal command: ${command}`);
term.echo(`Executing: ${command}...`);
}
}, {
greetings: 'RDE Console',
prompt: '> '
});
logToIdeConsole('jQuery Terminal instance created.');
} catch (error) {
logToIdeConsole(`Terminal initialization failed: ${error.message}`, 'error');
}
}
function logToIdeConsole(message, type = 'log') {
const logEntry = document.createElement('div');
logEntry.className = `console-${type}`;
logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
consoleContainer.appendChild(logEntry);
consoleContainer.scrollTop = consoleContainer.scrollHeight;
}
function setupUIEventListeners(){
document.getElementById('run-btn').addEventListener('click', runCode);
document.getElementById('file-tree').addEventListener('click', (event)=>{
const fileItem=event.target.closest('.file-item');
if(fileItem){
openFileInEditor(fileItem.dataset.fileId);
}
});
document.getElementById('activity-bar').addEventListener('click', (event) => {
const target = event.target.closest('i[data-action="toggle-sidebar"]');
if (target) {
const currentView = target.dataset.view;
const isMobile = window.innerWidth <= 800;
setActiveSidebarView(currentView);
if(isMobile) {
if (ideContainer.classList.contains('sidebar-visible-mobile')) {
if (document.querySelector('.sidebar-view.active').id.startsWith(currentView)) {
ideContainer.classList.remove('sidebar-visible-mobile');
}
} else {
ideContainer.classList.add('sidebar-visible-mobile');
}
} else {
ideContainer.classList.toggle('sidebar-collapsed');
}
}
});
document.getElementById('side-bar').addEventListener('click', (event) => {
const target = event.target.closest('i[data-action="close-sidebar"]');
if (target) {
ideContainer.classList.remove('sidebar-visible-mobile');
}
});
document.querySelector('.mobile-overlay').addEventListener('click', () => {
ideContainer.classList.remove('sidebar-visible-mobile');
});
document.getElementById('panel-toggle-btn').addEventListener('click', () => {
ideContainer.classList.toggle('panel-collapsed');
});
document.getElementById('panel-tabs').addEventListener('click', (event)=>{
const tab=event.target.closest('.tab');
if(tab){
setActivePanel(tab.dataset.panel);
if (ideContainer.classList.contains('panel-collapsed')) {
ideContainer.classList.remove('panel-collapsed');
}
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
document.querySelectorAll('.btn-install-runtime').forEach(btn => {
btn.addEventListener('click', () => installRuntime(btn.dataset.runtime, btn));
});
}
async function installRuntime(runtimeName, button){
if(runtimes[runtimeName]?.loading || runtimes[runtimeName]?.loaded) return;
button.textContent = 'Installing...';
button.disabled = true;
runtimes[runtimeName].loading = true;
logToIdeConsole(`Installing ${runtimeName} runtime...`);
try {
if(runtimeName === 'python') {
const pyodideSrc = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
const { loadPyodide } = await import(pyodideSrc);
runtimes.python.instance = await loadPyodide();
runtimes.python.loaded = true;
} else if (runtimeName === 'php') {
const { PhpWeb } = window.PlaygroundClient;
if (!PhpWeb) throw new Error('PlaygroundClient library not found.');
runtimes.php.instance = await PhpWeb.load('8.2');
runtimes.php.loaded = true;
}
logToIdeConsole(`${runtimeName} runtime installed successfully.`);
button.textContent = 'Installed';
} catch(error) {
logToIdeConsole(`Failed to install ${runtimeName}: ${error.message}`, 'error');
button.textContent = 'Error';
runtimes[runtimeName].loading = false;
button.disabled = false;
}
}
function performSearch(query) {
searchResultsContainer.innerHTML = '';
if (!query || query.length < 2) return;
const queryLower = query.toLowerCase();
currentProject.files.forEach(file => {
file.content.split('\n').forEach((line, index) => {
if (line.toLowerCase().includes(queryLower)) {
const resultEl = document.createElement('div');
resultEl.textContent = `${file.name}:${index + 1} - ${line.trim()}`;
searchResultsContainer.appendChild(resultEl);
}
});
});
}
function setActiveSidebarView(viewName){
logToIdeConsole(`Switching sidebar view to: ${viewName}`);
const sidebarTitle=document.getElementById('sidebar-title');
const activityBarIcons=document.querySelectorAll('#activity-bar i[data-view]');
const sidebarViews=document.querySelectorAll('#sidebar-content .sidebar-view');
sidebarTitle.textContent=viewName.toUpperCase();
activityBarIcons.forEach(icon=>icon.classList.toggle('active', icon.dataset.view===viewName));
sidebarViews.forEach(view=>view.classList.toggle('active', view.id===`${viewName}-view`));
}
function setActivePanel(panelName){
logToIdeConsole(`Switching panel to: ${panelName}`);
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
logToIdeConsole(`Opening file: ${fileId}`);
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
problemsContainer.innerHTML = '';
const model = editor.getModel();
if (!model) return;
const markers = monaco.editor.getModelMarkers({ resource: model.uri });
setActivePanel('problems');
if (markers.length === 0) {
problemsContainer.innerHTML = '<p class="p-2">No problems have been detected.</p>';
return;
}
markers.forEach(marker => {
const el = document.createElement('div');
el.textContent = `[${marker.severity}] ${marker.message} (Line: ${marker.startLineNumber}, Col: ${marker.startColumn})`;
problemsContainer.appendChild(el);
});
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
tabEl.innerHTML=`<i class="${getFileIcon(file.name)}"></i><span>${file.name}</span><i class="fa-solid fa-xmark tab-close"></i>`;
editorTabsContainer.appendChild(tabEl);
}
});
}
function closeFileTab(fileId){
const index=openFileTabs.indexOf(fileId);
if(index > -1) openFileTabs.splice(index, 1);
if(activeFileId === fileId) {
activeFileId = openFileTabs.length > 0 ? openFileTabs[openFileTabs.length - 1] : null;
}
if(activeFileId){
openFileInEditor(activeFileId);
} else {
editor.setModel(null);
document.getElementById('language-status').textContent = '';
renderFileTabs();
}
}
async function runCode(){
if(!editor) return;
const model=editor.getModel();
if (!model) return alert("No active file to run!");
const code=editor.getValue();
const language=model.getLanguageId();
logToIdeConsole(`Executing code as ${language}...`);
ideContainer.classList.remove('panel-collapsed');
term.clear();
switch(language) {
case 'html':
runHtmlProject();
break;
case 'javascript':
runJavascript(code);
break;
case 'python':
await runPython(code);
break;
case 'php':
await runPhp(code);
break;
default:
logToIdeConsole(`Runner for "${language}" is not implemented yet.`, 'error');
term.error(`Runner for "${language}" is not implemented yet.`);
}
}
function runHtmlProject(){
setActivePanel('preview');
logToIdeConsole('Rendering HTML project in preview pane.');
const htmlFile=currentProject.files.find(f => f.id === 'index.html');
const cssFile=currentProject.files.find(f => f.id === 'style.css');
const jsFile=currentProject.files.find(f => f.id === 'script.js');
let finalHtml = htmlFile ? htmlFile.content : '<h1>No index.html found</h1>';
if(cssFile){
finalHtml += `<style>${cssFile.content}</style>`;
}
if(jsFile){
finalHtml += `<script type="module">${jsFile.content}<\/script>`;
}
const previewFrame=document.getElementById('preview-iframe');
previewFrame.srcdoc = finalHtml;
}
function runJavascript(code){
setActivePanel('terminal');
logToIdeConsole('Running Javascript code...');
term.echo("Running JavaScript...");
try {
const result = (new Function(code))();
term.echo(`=> ${result}`);
} catch(e) {
term.error(e.message);
}
}
async function runPython(code) {
setActivePanel('terminal');
if (!runtimes.python.loaded) {
term.error("Python runtime not installed. Please install it from the Runtimes panel.");
return;
}
logToIdeConsole('Executing Python code with Pyodide...');
term.echo("Running Python...");
try {
const pyodide = runtimes.python.instance;
await pyodide.loadPackagesFromImports(code);
const result = await pyodide.runPythonAsync(code);
term.echo(String(result));
} catch(e) {
term.error(e.message);
}
}
async function runPhp(code) {
setActivePanel('terminal');
if (!runtimes.php.loaded) {
term.error("PHP runtime not installed. Please install it from the Runtimes panel.");
return;
}
logToIdeConsole('Executing PHP code with Playground...');
term.echo("Running PHP...");
try {
const php = runtimes.php.instance;
const output = await php.run({code: code});
if(output.errors) {
term.error(output.errors);
} else {
term.echo(output.text);
}
} catch(e) {
term.error(e.message);
}
}
