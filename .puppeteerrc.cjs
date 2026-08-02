/**
 * Do not download Chromium during install.
 *
 * whatsapp-web.js depends on puppeteer, whose postinstall otherwise fetches a
 * ~170 MB browser. Nothing in the Next.js app imports it: only the standalone
 * scripts/whatsapp-bot.js does, and that runs on a machine where a browser can
 * be installed once, by hand.
 *
 * On a build host that download is pure cost, and on some it fails outright and
 * takes the build with it.
 *
 * To run the WhatsApp bot locally, install the browser once:
 *   npx puppeteer browsers install chrome
 */
module.exports = {
  skipDownload: true,
};
