const puppeteer = require('puppeteer');

(async () => {
  // コマンドライン引数からtrackingNumberを取得
  const trackingNumber = process.argv[2];
  if (!trackingNumber) {
    console.error('Usage: node track.js <trackingNumber>');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://toi.kuronekoyamato.co.jp/cgi-bin/tneko');
  await page.type('input[name="number01"]', trackingNumber);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.tracking-invoice-block-state-title', { timeout: 10000 });

  const result = await page.evaluate(() => {
    const stateTitle = document.querySelector('.tracking-invoice-block-state-title');
    const latestStatus = stateTitle ? stateTitle.innerText.trim() : '取得できませんでした';

    let deliveryDate = null;
    let scheduledDate = null;

    const items = Array.from(document.querySelectorAll('.tracking-invoice-block-summary .item'));
    for (let i = 0; i < items.length; i++) {
      const label = items[i].innerText;
      const dataDiv = items[i].nextElementSibling;
      if (label.includes('お届け希望日時') && dataDiv && dataDiv.classList.contains('data')) {
        deliveryDate = dataDiv.innerText.trim();
      }
      if (label.includes('お届け予定日時') && dataDiv && dataDiv.classList.contains('data')) {
        scheduledDate = dataDiv.innerText.trim();
      }
    }
    return { latestStatus, deliveryDate, scheduledDate };
  });

  // 結果をJSONで出力（GASからパースしやすいように）
  console.log(JSON.stringify(result));

  await browser.close();
})();
