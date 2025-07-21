// js/ide.js
import { getProject } from './db.js';

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('project'), 10);

    if (!projectId) {
        alert("No project specified!");
        window.location.href = 'index.html';
        return;
    }
    
    const project = await getProject(projectId);
    
    if (project) {
        console.log("Loading project:", project);
        // We will build the IDE interface here in the next step
    } else {
        alert("Project not found!");
        window.location.href = 'index.html';
    }
});
