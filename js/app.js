document.addEventListener('DOMContentLoaded', () => {
  const highlightSection = document.getElementById('highlight-section');
  const highlightContainer = document.getElementById('highlight-project-container');
  const projectsGrid = document.getElementById('projects-grid-container');

  // Load projects data directly from global variable
  if (typeof projectsData !== 'undefined') {
    renderPortfolio(projectsData);
  } else {
    console.error('Error: projectsData is not defined');
    projectsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <p>Désolé, impossible de charger les projets pour le moment.</p>
      </div>
    `;
  }

  function renderPortfolio(projects) {
    if (!projects || !projects.length) {
      projectsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
          <p>Aucun projet à afficher pour le moment.</p>
        </div>
      `;
      return;
    }

    // Find all highlighted projects
    const highlightedProjects = projects.filter(p => p.isHighlighted);
    
    if (highlightedProjects.length > 0) {
      highlightSection.style.display = 'block';
      
      let slidesHTML = '';
      let dotsHTML = '';
      
      highlightedProjects.forEach((proj, idx) => {
        slidesHTML += `
          <div class="carousel-slide">
            <div class="highlight-card">
              <div class="highlight-image-wrapper">
                <img src="image/${proj.coverImage}" alt="${proj.name}" class="highlight-image" onerror="this.src='https://placehold.co/600x400/111827/f3f4f6?text=${encodeURIComponent(proj.name)}'">
              </div>
              <div class="highlight-content">
                <span class="badge">Sélectionné</span>
                <h3 class="highlight-title">${escapeHTML(proj.name)}</h3>
                <p class="highlight-desc">${escapeHTML(proj.summary || proj.description.replace(/<[^>]*>/g, '').substring(0, 160) + '...')}</p>
                <div class="tags">
                  ${(proj.tags || []).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
                </div>
                <div class="btn-group">
                  <a href="project.html?id=${proj.id}" class="btn btn-primary">En savoir plus</a>
                  ${proj.githubUrl ? `<a href="${proj.githubUrl}" target="_blank" class="btn btn-secondary">GitHub</a>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
        dotsHTML += `<span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`;
      });
      
      let carouselControlsHTML = '';
      if (highlightedProjects.length > 1) {
        carouselControlsHTML = `
          <button class="carousel-btn prev-btn" aria-label="Projet précédent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="carousel-btn next-btn" aria-label="Projet suivant">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div class="carousel-dots">
            ${dotsHTML}
          </div>
        `;
      }
      
      highlightContainer.innerHTML = `
        <div class="carousel-container">
          <div class="carousel-track" id="carousel-track">
            ${slidesHTML}
          </div>
          ${carouselControlsHTML}
        </div>
      `;
      
      if (highlightedProjects.length > 1) {
        setupCarousel();
      }
    } else {
      highlightSection.style.display = 'none';
    }

    // Render other projects in grid (or all projects if there are no non-highlighted ones)
    const otherProjects = projects.filter(p => !p.isHighlighted);
    const gridProjects = otherProjects.length ? otherProjects : projects;

    projectsGrid.innerHTML = gridProjects.map(project => `
      <div class="project-card">
        <div class="project-image-wrapper">
          <img src="image/${project.coverImage}" alt="${project.name}" class="project-image" onerror="this.src='https://placehold.co/600x400/111827/f3f4f6?text=${encodeURIComponent(project.name)}'">
        </div>
        <div class="project-body">
          <h3 class="project-card-title">${escapeHTML(project.name)}</h3>
          <p class="project-card-desc">${escapeHTML(project.summary || project.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...')}</p>
          <div class="tags">
            ${(project.tags || []).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
          </div>
          <div class="btn-group">
            <a href="project.html?id=${project.id}" class="btn btn-secondary">Détails</a>
            ${project.demoUrl ? `<a href="${project.demoUrl}" target="_blank" class="btn btn-primary" style="flex: 1;">Démo</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    function setupCarousel() {
      const track = document.getElementById('carousel-track');
      const prevBtn = highlightContainer.querySelector('.prev-btn');
      const nextBtn = highlightContainer.querySelector('.next-btn');
      const dots = Array.from(highlightContainer.querySelectorAll('.carousel-dot'));
      
      let currentIndex = 0;
      const slideCount = dots.length;
      let autoPlayTimer = null;
      
      function updateCarousel(index) {
        currentIndex = index;
        if (currentIndex < 0) {
          currentIndex = slideCount - 1;
        } else if (currentIndex >= slideCount) {
          currentIndex = 0;
        }
        
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
      
      function nextSlide() {
        updateCarousel(currentIndex + 1);
      }
      
      function prevSlide() {
        updateCarousel(currentIndex - 1);
      }
      
      nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
      });
      
      prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
      });
      
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          const targetIndex = parseInt(e.target.getAttribute('data-index'), 10);
          updateCarousel(targetIndex);
          resetAutoPlay();
        });
      });
      
      function startAutoPlay() {
        autoPlayTimer = setInterval(nextSlide, 5000);
      }
      
      function stopAutoPlay() {
        if (autoPlayTimer) {
          clearInterval(autoPlayTimer);
          autoPlayTimer = null;
        }
      }
      
      function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
      }
      
      const container = highlightContainer.querySelector('.carousel-container');
      container.addEventListener('mouseenter', stopAutoPlay);
      container.addEventListener('mouseleave', startAutoPlay);
      
      startAutoPlay();
    }
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
