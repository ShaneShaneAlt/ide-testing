// js/main.js
import { getAllProjects, createNewProject } from './db.js';
import { handleOnboarding } from './common.js'; // <-- Import from common.js

window.addEventListener('DOMContentLoaded', () => {
    // Check for onboarding using the common function
    handleOnboarding();

    // Load and display projects
    loadProjects();

    // Add event listeners
    document.getElementById('create-project-btn').addEventListener('click', handleCreateProject);
});

// The showOnboarding function is now removed from this file.

async function loadProjects() {
    const projects = await getAllProjects();
    const grid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = ''; // Clear existing projects

    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        projects.forEach(project => {
            const card = createProjectCard(project);
            grid.appendChild(card);
        });
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;

    // Card structure remains the same
    card.innerHTML = `
        <div class="card-icon"><i class="fa-brands fa-html5"></i></div>
        <div class="card-content">
            <h3>${project.name}</h3>
            <p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.location.href = `ide.html?project=${project.id}`;
    });

    return card;
}

async function handleCreateProject() {
    const projectName = prompt("Enter a name for your new project:", "My Awesome App");
    if (projectName) {
        try {
            const newProjectId = await createNewProject(projectName, 'html');
            window.location.href = `ide.html?project=${newProjectId}`;
        } catch (error) {
            console.error("Failed to create project:", error);
            alert("Error: Could not create the project.");
        }
    }
}
