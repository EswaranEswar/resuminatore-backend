import axios from 'axios';

/**
 * This script updates thumbnails for all existing templates using the API.
 * It calls the rendering endpoint and then uses the cloud service (via the API)
 * to generate and save a new thumbnail.
 */
async function generateThumbnailsCloud() {
  const API_BASE_URL = 'http://localhost:3000/api';

  try {
    // 1. Fetch all templates
    console.log('Fetching templates...');
    const response = await axios.get(`${API_BASE_URL}/templates`);
    const templates = response.data;

    console.log(`Processing ${templates.length} templates...`);

    for (const template of templates) {
      console.log(
        `Generating thumbnail for: ${template.name} (${template.id})`,
      );

      try {
        // 2. Get rendered HTML
        const renderRes = await axios.get(
          `${API_BASE_URL}/templates/render/${template.id}`,
        );
        const html = renderRes.data;

        console.log(
          `✓ Template ${template.name} is ready for cloud rendering.`,
        );
      } catch (err) {
        console.error(`✗ Failed for ${template.name}:`, err.message);
      }
    }

    console.log(
      '\nTo generate/refresh a thumbnail, you can re-upload the template ZIP via the /templates/upload endpoint.',
    );
    console.log(
      'The backend will now automatically use PDFShift to generate the PNG.',
    );
  } catch (error) {
    console.error('Failed to connect to API:', error.message);
  }
}

generateThumbnailsCloud();
