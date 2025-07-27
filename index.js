const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/test", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "پارامتر url اجباری است." });

    try {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const requests = [];
        page.on('requestfinished', req => requests.push(req.url()));

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const performanceTiming = JSON.parse(
            await page.evaluate(() => JSON.stringify(window.performance.timing))
        );

        await browser.close();

        res.json({
            url,
            total_requests: requests.length,
            load_time_ms: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
            requests: requests.slice(0, 10) // فقط 10 درخواست اول
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🟢 Puppeteer API running on port ${PORT}`);
});
