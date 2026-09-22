from playwright.sync_api import sync_playwright
import json
from pathlib import Path
import time

def scrape_leiden_programmes():
    """Scrape study programmes from Universiteit Leiden"""
    
    base_url = "https://www.universiteitleiden.nl/en/education/study-programmes?pageNumber="
    
    print(f"Fetching programmes from Leiden University...")
    
    all_programmes = []
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        # Loop through pages 1-18
        for page_num in range(1, 19):
            url = f"{base_url}{page_num}"
            
            print(f"\n{'='*80}")
            print(f"Processing page {page_num}/18")
            print(f"URL: {url}")
            print('='*80)
            
            print("Navigating to page...")
            page.goto(url, wait_until="networkidle")
            
            print("Waiting for page to load...")
            time.sleep(2)
            
            # Click accept cookies button if it appears (only on first page)
            if page_num == 1:
                print("Looking for cookie consent button...")
                try:
                    cookie_button = page.query_selector('button.accept[name="cookie"][value="accept"]')
                    if cookie_button:
                        print("Found cookie button, clicking...")
                        cookie_button.click()
                        time.sleep(1)
                        print("✓ Clicked accept cookies")
                    else:
                        print("No cookie button found")
                except Exception as e:
                    print(f"Note: Could not click cookie button: {e}")
            
            # Get the page content
            print("Extracting programme links...")
            
            # Find all li elements with class "has-edit-button"
            programme_items = page.query_selector_all('li.has-edit-button')
            
            print(f"Found {len(programme_items)} programme items on this page")
            
            page_programmes = []
            for item in programme_items:
                try:
                    # Get the anchor tag
                    link = item.query_selector('a')
                    if link:
                        href = link.get_attribute('href')
                        
                        # Get meta (Bachelor/Master)
                        meta = item.query_selector('span.meta.alt')
                        meta_text = meta.inner_text().strip() if meta else ""
                        
                        # Get title
                        title = item.query_selector('strong')
                        title_text = title.inner_text().strip() if title else ""
                        
                        programme = {
                            'url': href,
                            'type': meta_text,
                            'title': title_text
                        }
                        page_programmes.append(programme)
                        all_programmes.append(programme)
                        
                        print(f"  - {meta_text}: {title_text}")
                except Exception as e:
                    print(f"Error parsing item: {e}")
            
            print(f"✓ Extracted {len(page_programmes)} programmes from page {page_num}")
            
            # Small delay between pages
            time.sleep(1)
        
        # Save to JSON
        output_dir = Path(__file__).parent.parent / 'RAG' / 'Leiden'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        json_file = output_dir / 'leiden_programmes.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(all_programmes, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Saved {len(all_programmes)} programmes to: {json_file}")
        
        print("\nKeeping browser open for 5 seconds...")
        time.sleep(5)
        browser.close()

if __name__ == "__main__":
    scrape_leiden_programmes()
