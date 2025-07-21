// js/main.js
import { getAllProjects, createNewProject, deleteProject, getProject, saveProject } from './db.js';
import { handleOnboarding } from './common.js';

window.addEventListener('DOMContentLoaded', async () => {
    handleOnboarding();
    await loadProjects(); // Ensure projects are loaded before attaching listeners

    // This listener needs to be on the body to handle clicks on dynamically created elements
    document.body.addEventListener('click', handleBodyClick);
});

function handleBodyClick(event) {
    const createBtn = event.target.closest('#create-project-btn');
    const projectCard = event.target.closest('.project-card');
    const menuBtn = event.target.closest('.project-menu-btn');
    const deleteBtn = event.target.closest('.delete-btn');
    const duplicateBtn = event.target.closest('.duplicate-btn');

    if (createBtn) {
        handleCreateProject();
    } else if (menuBtn) {
        event.stopPropagation(); // Prevent card click event
        toggleProjectMenu(menuBtn);
    } else if (deleteBtn) {
        event.stopPropagation();
        handleDeleteProject(deleteBtn);
    } else if (duplicateBtn) {
        event.stopPropagation();
        handleDuplicateProject(duplicateBtn);
    } else if (projectCard) {
        // Only trigger navigation if we didn't click on a menu-related button
        window.location.href = `ide.html?project=${projectCard.dataset.projectId}`;
    }
}

function toggleProjectMenu(menuBtn) {
    const menu = menuBtn.nextElementSibling;
    // Close all other menus
    document.querySelectorAll('.project-menu.active').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    // Toggle the current menu
    menu.classList.toggle('active');
}

async function handleDeleteProject(deleteBtn) {
    const projectId = parseInt(deleteBtn.closest('.project-card').dataset.projectId, 10);
    if (confirm(`Are you sure you want to delete this project? This cannot be undone.`)) {
        await deleteProject(projectId);
        await loadProjects(); // Refresh the list
    }
}

async function handleDuplicateProject(duplicateBtn) {
    const projectId = parseInt(duplicateBtn.closest('.project-card').dataset.projectId, 10);
    const originalProject = await getProject(projectId);
    
    // Create a deep copy and modify it
    const duplicatedProject = JSON.parse(JSON.stringify(originalProject));
    delete duplicatedProject.id; // Remove ID so a new one is generated
    duplicatedProject.name = `${originalProject.name} (Copy)`;
    duplicatedProject.created = new Date();
    duplicatedProject.lastModified = new Date();

    await saveProject(duplicatedProject);
    await loadProjects(); // Refresh the list
}

async function loadProjects() {
    const projects = await getAllProjects();
    const grid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';

    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        projects.forEach(project => {
            grid.appendChild(createProjectCard(project));
        });
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;

    card.innerHTML = `
        <div class="card-icon"><i class="fa-brands fa-html5"></i></div>
        <div class="card-content">
            <h3>${project.name}</h3>
            <p>Last modified: ${new Date(project.lastModified).toLocaleDateString()}</p>
        </div>
        <div class="project-menu-container">
            <button class="project-menu-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            <div class="project-menu">
                <a href="#" class="duplicate-btn"><i class="fa-solid fa-copy"></i> Duplicate</a>
                <a href="#"><i class="fa-solid fa-file-export"></i> Export (.zip)</a>
                <a href="#" class="delete-btn danger-text"><i class="fa-solid fa-trash-can"></i> Delete</a>
            </div>
        </div>
    `;
    return card;
}

async function handleCreateProject() {
    const projectName = prompt("Enter a name for your new project:", "My New Project");
    if (projectName) {
        try {
            const newProjectId = await createNewProject(projectName);
            window.location.href = `ide.html?project=${newProjectId}`;
        } catch (error) {
            console.error("Failed to create project:", error);
            alert("Error: Could not create the project.");
        }
    }
}
