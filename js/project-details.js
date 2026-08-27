document.addEventListener('DOMContentLoaded', () => {
  const badgeContainer = document.getElementById('project-badge-container');
  const titleEl = document.getElementById('project-title');
  const imageEl = document.getElementById('project-image');
  const descriptionEl = document.getElementById('project-description');
  const tagsContainer = document.getElementById('project-tags-container');
  const linksContainer = document.getElementById('project-links-container');

  // Parse ID from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = parseInt(urlParams.get('id'), 10);

  if (isNaN(projectId)) {
    showError('Identifiant de projet invalide.');
    return;
  }

  // Load projects data directly from global variable
  if (typeof projectsData !== 'undefined') {
    const project = projectsData.find(p => p.id === projectId);
    if (project) {
      renderProjectDetails(project);
    } else {
      showError('Projet introuvable.');
    }
  } else {
    console.error('Error: projectsData is not defined');
    showError('Impossible de charger les détails du projet pour le moment.');
  }

  function renderProjectDetails(project) {
    // Document Title update
    document.title = `${project.name} | Portfolio Julien`;

    // Title
    titleEl.textContent = project.name;

    // Highlight badge
    if (project.isHighlighted) {
      badgeContainer.innerHTML = '<span class="badge">Sélectionné</span>';
    } else {
      badgeContainer.innerHTML = '';
    }

    // Image
    imageEl.src = `image/${project.coverImage}`;
    imageEl.alt = project.name;
    imageEl.onerror = function() {
      this.src = `https://placehold.co/1200x675/111827/f3f4f6?text=${encodeURIComponent(project.name)}`;
    };
    imageEl.style.opacity = '1';

    // Description
    descriptionEl.innerHTML = project.description;

    // Tags
    if (project.tags && project.tags.length) {
      tagsContainer.innerHTML = project.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
    } else {
      tagsContainer.innerHTML = '<span class="tag">Aucun tag</span>';
    }

    // Action Links
    let linksHTML = '';
    
    if (project.githubUrl) {
      linksHTML += `<a href="${project.githubUrl}" target="_blank" class="btn btn-primary">GitHub</a>`;
    }
    
    if (project.demoUrl) {
      linksHTML += `<a href="${project.demoUrl}" target="_blank" class="btn btn-secondary">Démo en ligne</a>`;
    }
    
    // Custom Links (e.g. Itch.io, Steam, etc.)
    if (project.links && project.links.length) {
      project.links.forEach(link => {
        linksHTML += `<a href="${link.url}" target="_blank" class="btn btn-secondary">${escapeHTML(link.label)}</a>`;
      });
    }

    if (!linksHTML) {
      linksHTML = '<span style="color: var(--text-muted); font-size: 0.95rem;">Aucun lien disponible</span>';
    }

    linksContainer.innerHTML = linksHTML;

    // Render Gallery Images
    const gallerySection = document.getElementById('gallery-section');
    const galleryContainer = document.getElementById('project-gallery-container');
    
    if (project.images && project.images.length) {
      gallerySection.style.display = 'block';
      galleryContainer.innerHTML = project.images.map(img => `
        <div class="gallery-item">
          <img src="image/${img}" alt="Screenshot for ${escapeHTML(project.name)}" onerror="this.src='https://placehold.co/600x400/111827/f3f4f6?text=Image'">
        </div>
      `).join('');
      
      // Setup Lightbox Modal
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = lightbox.querySelector('.lightbox-img');
      const lightboxClose = lightbox.querySelector('.lightbox-close');
      const galleryItems = Array.from(galleryContainer.querySelectorAll('.gallery-item img'));
      
      galleryItems.forEach(item => {
        item.addEventListener('click', () => {
          lightboxImg.src = item.src;
          lightbox.classList.add('active');
        });
      });
      
      lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
      });
      
      // Click outside image to close
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          lightbox.classList.remove('active');
        }
      });
    } else {
      gallerySection.style.display = 'none';
    }
  }

  function showError(message) {
    titleEl.textContent = 'Erreur';
    descriptionEl.innerHTML = `<span style="color: var(--accent-pink);">${escapeHTML(message)}</span>`;
    imageEl.style.display = 'none';
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
