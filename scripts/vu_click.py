# pip install playwright
# playwright install chromium
from playwright.sync_api import sync_playwright
import time
import json
from pathlib import Path

def download_course_info(page, url, download_dir):
    """Download course info PDF for a single course URL"""
    
    print(f"\n{'='*80}")
    print(f"Processing: {url}")
    print('='*80)
    
    try:
        # Extract course code from URL
        course_code = url.split('/')[-1]
        
        print("Navigating to course page...")
        page.goto(url, wait_until="networkidle", timeout=30000)
        
        print("Waiting for page to load...")
        time.sleep(2)
        
        # Extract course name from the title
        print("Extracting course name...")
        try:
            title_element = page.query_selector('#title h2')
            if title_element:
                course_name = title_element.inner_text().strip()
                print(f"Course name: {course_name}")
                print(f"Course code: {course_code}")
                # Clean the filename (remove newlines and invalid characters)
                clean_name = course_name.replace('\n', ' ').strip()
                safe_filename = clean_name.replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '-').replace('?', '-').replace('"', '').replace('<', '-').replace('>', '-').replace('|', '-')
                # Create filename with code: <course_name>(<code>).pdf
                filename = f"{safe_filename}({course_code}).pdf"
            else:
                print("⚠ Title element not found, using code-based filename")
                filename = f"{course_code}.pdf"
        except Exception as e:
            print(f"⚠ Error extracting course name: {e}")
            filename = f"{course_code}.pdf"
        
        # Click the download button
        print("Looking for download button...")
        download_button = page.query_selector('#download-button')
        
        if not download_button:
            print("✗ Download button not found")
            return False
        
        print("Found download button, clicking...")
        
        # Start waiting for download before clicking
        with page.expect_download(timeout=30000) as download_info:
            download_button.click()
        
        download = download_info.value
        
        # Save the download to the specified path with custom filename
        download_path = f"{download_dir}/{filename}"
        print(f"Saving file as: {download_path}")
        download.save_as(download_path)
        
        print(f"✓ File downloaded successfully!")
        
        # Small delay between downloads
        time.sleep(1)
        return True
        
    except Exception as e:
        print(f"✗ Error downloading file: {e}")
        import traceback
        traceback.print_exc()
        return False

def download_all_courses():
    """Download all VU course PDFs from URLs in vu_course_urls.json"""
    
    # Load course URLs
    urls_file = Path(__file__).parent.parent / 'RAG' / 'VU' / 'vu_course_urls.json'
    
    if not urls_file.exists():
        print(f"✗ File not found: {urls_file}")
        return
    
    with open(urls_file, 'r', encoding='utf-8') as f:
        course_urls = json.load(f)
    
    print(f"Found {len(course_urls)} course URLs to process")
    
    # Set download directory
    download_dir = Path(__file__).parent.parent / 'RAG' / 'VU' / 'course_pdfs'
    download_dir.mkdir(exist_ok=True)
    print(f"Download directory: {download_dir}")
    
    # Track progress
    successful = 0
    failed = 0
    failed_urls = []
    
    with sync_playwright() as p:
        # Launch browser once for all downloads
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        
        for i, url in enumerate(course_urls, 1):
            print(f"\n[{i}/{len(course_urls)}]")
            
            # Make sure URL is complete
            if not url.startswith('http'):
                url = f"https://studiegids.vu.nl{url}"
            
            success = download_course_info(page, url, str(download_dir))
            
            if success:
                successful += 1
            else:
                failed += 1
                failed_urls.append(url)
        
        browser.close()
    
    # Summary
    print(f"\n{'='*80}")
    print("DOWNLOAD SUMMARY")
    print('='*80)
    print(f"Total URLs: {len(course_urls)}")
    print(f"✓ Successful: {successful}")
    print(f"✗ Failed: {failed}")
    
    if failed_urls:
        print(f"\nFailed URLs:")
        for url in failed_urls:
            print(f"  - {url}")
        
        # Save failed URLs to file
        failed_file = download_dir / 'failed_downloads.json'
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed_urls, f, indent=2)
        print(f"\nFailed URLs saved to: {failed_file}")

if __name__ == "__main__":
    download_all_courses()
