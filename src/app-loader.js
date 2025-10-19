// APP LOADER - Loads the complete application content
// FAST PATH TO MARKET approach - loads pre-built HTML content

// Import HTML content as raw string (Vite feature)
import htmlContent from './app-content.html?raw';

export async function initializeApp() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('❌ App container not found!');
    return false;
  }

  try {
    // Load the HTML content directly from imported string
    app.innerHTML = htmlContent;

    console.log('✅ App content loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load app:', error);
    app.innerHTML = `
      <div class="error-message" style="padding: 20px; color: var(--bad); text-align: center;">
        <h2>Failed to load application</h2>
        <p>${error.message}</p>
      </div>
    `;
    return false;
  }
}
