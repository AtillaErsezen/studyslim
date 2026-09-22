# pip install playwright
# playwright install chromium
from playwright.sync_api import sync_playwright
import json
import time

def fetch_vu_course_urls():
    """Use Playwright to fetch all course URLs from VU study guide"""
    
    url = "https://studiegids.vu.nl/en/courses/2025-2026#/"
    
    print(f"Opening {url} with Playwright...")
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        print("Navigating to page...")
        page.goto(url, wait_until="networkidle")
        
        print("Waiting for content to load...")
        time.sleep(3)
        
        all_course_urls = []
        page_num = 1
        
        while True:
            print(f"\n{'='*60}")
            print(f"Processing page {page_num}")
            print(f"{'='*60}")
            
            # Try to find course links
            print("Looking for course links...")
            
            # Get all links on the page
            links = page.query_selector_all('a[href*="en/vakken"]')
            
            print(f"Found {len(links)} course links on this page")
            
            for link in links:
                href = link.get_attribute('href')
                if href:
                    # Make absolute URL if needed
                    if href.startswith('/'):
                        href = f"https://studiegids.vu.nl{href}"
                    elif href.startswith('en/vakken'):
                        href = f"https://studiegids.vu.nl/{href}"
                    
                    # Only add if it contains 'en/vakken'
                    if 'en/vakken' in href and href not in all_course_urls:
                        all_course_urls.append(href)
            
            print(f"Total unique URLs so far: {len(all_course_urls)}")
            
            # Click the next button (right chevron)
            print("\nLooking for next button...")
            try:
                # Get all matching buttons and click the last one (right arrow)
                buttons = page.query_selector_all('li button:has(i.fa-chevron-right)')
                if buttons:
                    # Check if the button is disabled
                    last_button = buttons[-1]
                    is_disabled = last_button.get_attribute('disabled')
                    
                    if is_disabled:
                        print("Next button is disabled - reached last page")
                        break
                    
                    print(f"Found {len(buttons)} chevron buttons, clicking the last one...")
                    last_button.click()
                    print("✓ Clicked next button")
                    
                    # Wait for navigation/content to load
                    page.wait_for_load_state("networkidle")
                    time.sleep(2)
                    
                    page_num += 1
                else:
                    print("No chevron buttons found - stopping")
                    break
            except Exception as e:
                print(f"Could not click next button: {e}")
                break
        
        print(f"\n{'='*60}")
        print(f"COMPLETED")
        print(f"{'='*60}")
        print(f"Total pages processed: {page_num}")
        print(f"Total unique course URLs: {len(all_course_urls)}")
        
        # Save to file
        output_file = 'vu_course_urls.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_course_urls, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved to {output_file}")
        
        # Print some samples
        if all_course_urls:
            print(f"\nSample URLs:")
            for url in all_course_urls[:5]:
                print(f"  - {url}")
        
        time.sleep(5)
        browser.close()
        
        return all_course_urls

if __name__ == "__main__":
    fetch_vu_course_urls()
