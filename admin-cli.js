const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const DATA_FILE_PATH = path.join(__dirname, 'js', 'projects-data.js');
const IMAGE_DIR_PATH = path.join(__dirname, 'image');

// Helper to ask a question and return a Promise
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n==================================================');
  console.log('   🛠️  AJOUT DE PROJET AU PORTFOLIO STATIQUE  🛠️   ');
  console.log('==================================================\n');

  try {
    // 1. Ask for Project Name
    let name = '';
    while (!name.trim()) {
      name = await askQuestion('👉 Nom du projet (requis) : ');
      if (!name.trim()) {
        console.log('❌ Le nom du projet ne peut pas être vide.');
      }
    }

    // 2. Ask for Summary
    let summary = '';
    while (!summary.trim()) {
      summary = await askQuestion('👉 Résumé court du projet (pour les cartes, max 150 caractères) : ');
      if (!summary.trim()) {
        console.log('❌ Le résumé court ne peut pas être vide.');
      }
    }

    // 2.5 Ask for Detailed Description
    let description = '';
    while (!description.trim()) {
      description = await askQuestion('👉 Description détaillée (HTML accepté, pour la page de détails) : ');
      if (!description.trim()) {
        console.log('❌ La description détaillée ne peut pas être vide.');
      }
    }

    // 3. Ask for Cover Image Path
    let imageSourcePath = '';
    let imageDestFilename = '';
    while (true) {
      const inputPath = await askQuestion('👉 Chemin local de l\'image de couverture (Cover) (requis) : ');
      if (!inputPath.trim()) {
        console.log('⚠️ Aucune image fournie. Un espace réservé ou un placeholder sera utilisé.');
        imageDestFilename = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_placeholder.png';
        break;
      }
      
      const resolvedPath = path.resolve(inputPath.trim().replace(/^['"]|['"]$/g, ''));
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        imageSourcePath = resolvedPath;
        const ext = path.extname(imageSourcePath) || '.png';
        imageDestFilename = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + ext;
        break;
      } else {
        console.log(`❌ Fichier introuvable au chemin : "${resolvedPath}". Veuillez réessayer.`);
      }
    }

    // 3.5 Ask for Gallery screenshots
    const galleryInput = await askQuestion('👉 Captures d\'écrans additionnelles pour la galerie (chemins séparés par des virgules, ex: C:\\sc1.png, C:\\sc2.jpg) (facultatif) : ');
    const galleryPaths = [];
    if (galleryInput.trim()) {
      galleryInput.split(',').forEach(pStr => {
        const cleanP = pStr.trim().replace(/^['"]|['"]$/g, '');
        if (cleanP) {
          const resolvedP = path.resolve(cleanP);
          if (fs.existsSync(resolvedP) && fs.statSync(resolvedP).isFile()) {
            galleryPaths.push(resolvedP);
          } else {
            console.log(`⚠️ Image de galerie introuvable au chemin : "${resolvedP}". Passée.`);
          }
        }
      });
    }

    // 4. Ask for GitHub Link
    const githubUrl = await askQuestion('👉 URL du dépôt GitHub (facultatif) : ');

    // 5. Ask for Demo Link
    const demoUrl = await askQuestion('👉 URL de la démo en ligne (facultatif) : ');

    // 6. Ask for Custom Links
    const customLinksInput = await askQuestion('👉 Autres liens (format Label:URL, séparés par des virgules. Ex: Itch.io:https://..., Steam:https://...) : ');
    const links = [];
    if (customLinksInput.trim()) {
      customLinksInput.split(',').forEach(part => {
        const colonIndex = part.indexOf(':');
        if (colonIndex !== -1) {
          const label = part.substring(0, colonIndex).trim();
          const url = part.substring(colonIndex + 1).trim();
          if (label && url) {
            links.push({ label, url });
          }
        }
      });
    }

    // 7. Ask for Tech Tags
    const tagsInput = await askQuestion('👉 Tags de technologies (séparés par des virgules, ex: React, Node, CSS) : ');
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // 8. Ask for Highlight choice
    const highlightInput = await askQuestion('👉 Mettre ce projet en avant (Highlight) ? (y/n) [n] : ');
    const isHighlighted = highlightInput.trim().toLowerCase() === 'y';

    // 9. Process Projects Array
    let projects = [];
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const jsonStart = fileContent.indexOf('[');
        const jsonEnd = fileContent.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = fileContent.substring(jsonStart, jsonEnd);
          projects = JSON.parse(jsonStr);
        }
      } catch (err) {
        console.error('⚠️ Erreur lors de la lecture ou du parsing du JS existant. Un nouveau tableau sera créé.');
        projects = [];
      }
    }

    // Generate New ID
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;

    // Handle Cover Image Copy
    if (imageSourcePath) {
      if (!fs.existsSync(IMAGE_DIR_PATH)) {
        fs.mkdirSync(IMAGE_DIR_PATH, { recursive: true });
      }
      const destPath = path.join(IMAGE_DIR_PATH, imageDestFilename);
      fs.copyFileSync(imageSourcePath, destPath);
      console.log(`\n📸 Image de couverture copiée dans : image/${imageDestFilename}`);
    }

    // Handle Gallery Screenshots Copy
    const galleryDestFilenames = [];
    if (galleryPaths.length > 0) {
      if (!fs.existsSync(IMAGE_DIR_PATH)) {
        fs.mkdirSync(IMAGE_DIR_PATH, { recursive: true });
      }
      galleryPaths.forEach((resolvedP, idx) => {
        const ext = path.extname(resolvedP) || '.png';
        const destFilename = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_screenshot_${idx + 1}${ext}`;
        const destPath = path.join(IMAGE_DIR_PATH, destFilename);
        fs.copyFileSync(resolvedP, destPath);
        galleryDestFilenames.push(destFilename);
        console.log(`📸 Image de galerie copiée dans : image/${destFilename}`);
      });
    }

    // Create New Project Object
    const newProject = {
      id: newId,
      name: name.trim(),
      summary: summary.trim(),
      description: description.trim(),
      coverImage: imageDestFilename,
      images: galleryDestFilenames,
      githubUrl: githubUrl.trim() || null,
      demoUrl: demoUrl.trim() || null,
      links: links,
      isHighlighted: isHighlighted,
      tags: tags,
      createdAt: new Date().toISOString()
    };

    projects.push(newProject);

    // Write back to projects-data.js
    fs.writeFileSync(DATA_FILE_PATH, `const projectsData = ${JSON.stringify(projects, null, 2)};\n`, 'utf8');
    console.log(`\n💾 Le projet "${name}" a été ajouté à js/projects-data.js !`);

    // 9. Automate Git commit & push
    console.log('\n==================================================');
    console.log('   🚀 DÉPLOIEMENT AUTOMATIQUE SUR GITHUB   ');
    console.log('==================================================\n');

    const gitPushChoice = await askQuestion('👉 Voulez-vous pousser ces modifications sur GitHub maintenant ? (y/n) [y] : ');
    if (gitPushChoice.trim().toLowerCase() !== 'n') {
      try {
        console.log('\nExécution de: git add . ...');
        execSync('git add .', { stdio: 'inherit' });

        console.log(`Exécution de: git commit -m "Add project: ${name}" ...`);
        execSync(`git commit -m "Add project: ${name}"`, { stdio: 'inherit' });

        console.log('Exécution de: git push ...');
        execSync('git push', { stdio: 'inherit' });

        console.log('\n🎉 Tout est en ligne ! GitHub Pages va se mettre à jour dans quelques minutes.');
      } catch (gitErr) {
        console.error('\n❌ Une erreur est survenue lors de l\'exécution des commandes Git.');
        console.error('Veuillez vérifier que vous êtes bien dans un dépôt Git configuré avec une branche distante (origin) et que vous disposez des droits d\'écriture.');
      }
    } else {
      console.log('\n💡 Modifications enregistrées localement. N\'oubliez pas de faire un git push manuellement.');
    }

  } catch (error) {
    console.error('❌ Une erreur inattendue est survenue :', error);
  } finally {
    rl.close();
    console.log('\n👋 À bientôt !\n');
  }
}

main();
