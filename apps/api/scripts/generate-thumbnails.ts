import puppeteer from 'puppeteer';
import axios from 'axios';

async function generateThumbnails() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // 1. Fetch all templates from the API
    const response = await axios.get('http://localhost:3000/api/templates');
    const templates = response.data;

    console.log(
      `Starting thumbnail generation for ${templates.length} templates...`,
    );

    for (const template of templates) {
      const page = await browser.newPage();

      // Set viewport to resume size (approx A4 aspect ratio)
      await page.setViewport({ width: 800, height: 1040 });

      // Navigate to the render endpoint
      const url = `http://localhost:3000/api/templates/render/${template.id}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Wait for content to load
        await page.waitForSelector('.resume-container');

        // Ensure the directory exists
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(
          process.cwd(),
          'apps/api/public/templates/thumbnails',
        );
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Take screenshot
        const outputPath = path.join(dir, `${template.id}.png`);
        await page.screenshot({
          path: outputPath,
          fullPage: false,
        });

        console.log(
          `✓ Generated thumbnail for ${template.name} -> ${template.id}.png`,
        );
      } catch (error) {
        console.error(
          `✗ Failed to generate thumbnail for ${template.name}:`,
          error.message,
        );
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error(
      'Failed to fetch templates or connect to API:',
      error.message,
    );
  }

  await browser.close();
  console.log('Thumbnail generation complete!');
}

generateThumbnails();
