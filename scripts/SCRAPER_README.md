# UvA Course Scraper - Installation & Usage

## Install Playwright (Fastest Browser Automation)

```powershell
# Install Python package
pip install playwright

# Install browser binaries (only needed once)
playwright install chromium
```

## Usage

### Basic Scrape (Fast - 3 pages)
```powershell
python scripts/scrape_uva_playwright.py
```

### Full Scrape (All pages)
Edit the script and change:
```python
courses = await scraper.scrape_all_courses(max_pages=3, detailed=False)
```
to:
```python
courses = await scraper.scrape_all_courses(max_pages=None, detailed=False)
```

### Detailed Scrape (Slow - includes full course details)
Uncomment lines 245-249 in the script.

## Features

✅ **Fastest**: Playwright is faster than Selenium
✅ **Reliable**: Automatic waiting, no flaky timeouts
✅ **Modern**: Async/await syntax
✅ **Headless**: Runs in background (set `headless=False` to see browser)
✅ **Rate Limited**: Respects server resources

## Output Files

- `uva_courses_basic.json` - Course names, URLs, credits
- `uva_courses_detailed.json` - Full course details (if detailed=True)

## Why Playwright?

| Feature | Playwright | Selenium | BeautifulSoup |
|---------|-----------|----------|---------------|
| Speed | ⚡⚡⚡ Fastest | ⚡⚡ Fast | ⚡ Static only |
| JavaScript | ✅ Yes | ✅ Yes | ❌ No |
| Auto-wait | ✅ Built-in | ❌ Manual | N/A |
| Modern API | ✅ Async | ❌ Sync | N/A |
| Browser Support | Chrome, Firefox, Safari | Chrome, Firefox | N/A |

## Troubleshooting

**Error: playwright not found**
```powershell
pip install playwright
```

**Error: Executable doesn't exist**
```powershell
playwright install chromium
```

**Too slow?**
- Reduce `max_pages` parameter
- Set `detailed=False`
- Set `headless=True`
