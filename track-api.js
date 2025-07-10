const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/track', async (req, res) => {
  const trackingNumber = req.query.number;
  if (!trackingNumber) return res.status(400).json({ error: 'number required' });

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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

    await browser.close();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
