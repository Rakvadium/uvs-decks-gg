const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8090';
const AUTH_TOKEN = '21756fdf57a808c36f5a3459baf0c3b828dd5783feb1434b';
const LOGIN_URL = `${BASE_URL}/agent-login?token=${AUTH_TOKEN}&next=/gallery`;

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 } // iPhone 12 Pro aspect ratio
};

const ROUTES = [
  { path: '/gallery', name: 'gallery' },
  { path: '/decks', name: 'decks', needsDeckId: true },
  { path: '/admin', name: 'admin' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(process.cwd(), 'screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      console.log(`\n=== Capturing ${viewportName} viewport ===`);

      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      try {
        // Sign in
        console.log(`Navigating to login URL...`);
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });
        await sleep(3000); // Wait for session to load

        console.log('Signed in, now capturing routes...');

        // Capture /gallery
        console.log('Capturing /gallery...');
        await page.goto(`${BASE_URL}/gallery`, { waitUntil: 'networkidle' });
        await sleep(2000);
        const galleryPath = path.join(screenshotsDir, `before-gallery-${viewportName}-closed.png`);
        await page.screenshot({ path: galleryPath, fullPage: true });
        console.log(`  Saved: ${galleryPath}`);

        // Try to open right sidebar on gallery if exists
        const rightSidebarToggle = await page.$('[data-testid="right-sidebar-toggle"], [class*="sidebar"][class*="right"]');
        if (rightSidebarToggle) {
          console.log('Opening right sidebar...');
          await rightSidebarToggle.click();
          await sleep(1000);
          const galleryOpenPath = path.join(screenshotsDir, `before-gallery-${viewportName}-open.png`);
          await page.screenshot({ path: galleryOpenPath, fullPage: true });
          console.log(`  Saved: ${galleryOpenPath}`);
        }

        // Capture /decks - first get a list of decks
        console.log('Navigating to decks list...');
        await page.goto(`${BASE_URL}/decks`, { waitUntil: 'networkidle' });
        await sleep(2000);

        // Look for first deck link
        const deckLink = await page.$('a[href*="/decks/"]');
        if (deckLink) {
          const href = await deckLink.getAttribute('href');
          console.log(`Found deck: ${href}`);
          await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
          await sleep(2000);
          const deckPath = path.join(screenshotsDir, `before-decks-${viewportName}-closed.png`);
          await page.screenshot({ path: deckPath, fullPage: true });
          console.log(`  Saved: ${deckPath}`);

          // Try to open right sidebar on deck
          const deckSidebarToggle = await page.$('[data-testid="right-sidebar-toggle"], [class*="sidebar"][class*="right"]');
          if (deckSidebarToggle) {
            console.log('Opening right sidebar on deck...');
            await deckSidebarToggle.click();
            await sleep(1000);
            const deckOpenPath = path.join(screenshotsDir, `before-decks-${viewportName}-open.png`);
            await page.screenshot({ path: deckOpenPath, fullPage: true });
            console.log(`  Saved: ${deckOpenPath}`);
          }
        }

        // Capture /admin
        console.log('Capturing /admin...');
        await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
        await sleep(2000);
        const adminPath = path.join(screenshotsDir, `before-admin-${viewportName}-closed.png`);
        await page.screenshot({ path: adminPath, fullPage: true });
        console.log(`  Saved: ${adminPath}`);

        // Try to open right sidebar on admin
        const adminSidebarToggle = await page.$('[data-testid="right-sidebar-toggle"], [class*="sidebar"][class*="right"]');
        if (adminSidebarToggle) {
          console.log('Opening right sidebar on admin...');
          await adminSidebarToggle.click();
          await sleep(1000);
          const adminOpenPath = path.join(screenshotsDir, `before-admin-${viewportName}-open.png`);
          await page.screenshot({ path: adminOpenPath, fullPage: true });
          console.log(`  Saved: ${adminOpenPath}`);
        }

      } finally {
        await context.close();
      }
    }

    console.log('\n=== Capture complete ===');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
