import { chromium } from 'playwright';

export async function getExchangeRate(currency = "THB", amount = "10000") {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--single-process']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    await page.goto("https://terminal.public.bankhapoalim.co.il/ng-portals/terminal/he/order", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForSelector("#currencies-select-0", { timeout: 10000 });
    await page.click("#currencies-select-0");

    const selector = `text=${currency} -`;
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);

    await page.waitForSelector("#event-amount", { timeout: 10000 });
    await page.fill("#event-amount", amount);

    await page.waitForSelector("#amount-currency >> text=₪", { timeout: 10000 });
    const resultText = await page.innerText("#amount-currency");

    const match = resultText.match(/שַׁעַר\s+([\d.]+)/);
    await browser.close();

    if (match) {
      const rate = parseFloat(match[1]);
      return {
        exchange_rate: rate,
        inverse_rate: +(1 / rate).toFixed(6),
        raw_text: resultText
      };
    } else {
      return { error: "Exchange rate not found", raw_text: resultText };
    }
  } catch (err) {
    await browser.close();
    return { error: err.message };
  }
}
