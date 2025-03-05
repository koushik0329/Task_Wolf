const { chromium } = require("playwright");

function parseRelativeTime(time) {
  const match = time.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const now = new Date();
  if (unit === "minute") return now - value * 60000;
  if (unit === "hour") return now - value * 3600000;
  if (unit === "day") return now - value * 86400000;

  return 0;
}

async function sortHackerNewsArticles() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/newest");

  const articles = await page.$$eval(".athing", (nodes) =>
    nodes.slice(0, 100).map((node) => {
      const title = node.querySelector(".titleline a")?.innerText;
      const id = node.getAttribute("id");
      return { title, id };
    })
  );

  const times = await page.$$eval(".subtext", (nodes) =>
    nodes.slice(0, 100).map((node) => {
      const ageText = node.querySelector(".age a")?.innerText;
      return ageText;
    })
  );

  const articleData = articles.map((article, index) => ({
    ...article,
    time: times[index],
    parsedTime: parseRelativeTime(times[index]),
  }));

  console.log(articleData);

  const isSorted = articleData.every(
    (article, index) =>
      index === 0 || article.parsedTime <= articleData[index - 1].parsedTime
  );

  console.log(
    isSorted
      ? "✅ Articles are sorted correctly"
      : "❌ Articles are NOT sorted correctly"
  );

  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();
