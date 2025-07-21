// js/main.js
import { getAllProjects, createNewProject } from './db.js';

window.addEventListener('DOMContentLoaded', () => {
    // Check for onboarding
    const onboardingComplete = localStorage.getItem('ryxide_onboarding_complete');
    if (!onboardingComplete) {
        showOnboarding();
    }

    // Load and display projects
    loadProjects();

    // Add event listeners
    document.getElementById('create-project-btn').addEventListener('click', handleCreateProject);
});

function showOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.remove('hidden');

    document.getElementById('start-onboarding-btn').addEventListener('click', () => {
        localStorage.setItem('ryxide_onboarding_complete', 'true');
        overlay.classList.add('hidden');
    });
}

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
    card.dataset.projectId = project.id; // Store project ID on the element

    card.innerHTML = `
        <i class="fa-brands fa-html5"></i>
        <h3>${project.name}</h3>
        <p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
    `;
    
    // Navigate to IDE page on click
    card.addEventListener('click', () => {
        window.location.href = `ide.html?project=${project.id}`;
    });

    return card;
}

async function handleCreateProject() {
    const projectName = prompt("Enter a name for your new project:", "My Awesome App");
    if (projectName) {
        try {
            await createNewProject(projectName, 'html');
            loadProjects(); // Reload the project list to show the new one
        } catch (error) {
            console.error("Failed to create project:", error);
            alert("Error: Could not create the project.");
        }
    }
}
