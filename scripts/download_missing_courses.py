# pip install playwright
# playwright install chromium
from playwright.sync_api import sync_playwright
import time
import json
from pathlib import Path

def download_missing_course(page, course, download_dir):
    """Download a single missing course PDF"""
    
    url = course['url']
    course_name = course['name']
    course_code = course['code']
    
    print(f"\n{'='*80}")
    print(f"Processing: {course_name}")
    print(f"Code: {course_code}")
    print(f"URL: {url}")
    print('='*80)
    
    try:
        print("Navigating to course page...")
        page.goto(url, wait_until="networkidle", timeout=30000)
        
        print("Waiting for page to load...")
        time.sleep(2)
        
        # Create filename from course name and code
        # Clean the course name (remove newlines and invalid characters)
        clean_name = course_name.replace('\n', ' ').strip()
        clean_name = clean_name.replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '-').replace('?', '-').replace('"', '').replace('<', '-').replace('>', '-').replace('|', '-')
        
        # Create filename: <course_name>(<code>).pdf
        filename = f"{clean_name}({course_code}).pdf"
        print(f"Target filename: {filename}")
        
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

def download_all_missing_courses():
    """Download all missing VU course PDFs from missing_courses.json"""
    
    # Load missing courses
    missing_file = Path(__file__).parent.parent / 'RAG' / 'VU' / 'course_pdfs' / 'missing_courses.json'
    
    if not missing_file.exists():
        print(f"✗ File not found: {missing_file}")
        return
    
    with open(missing_file, 'r', encoding='utf-8') as f:
        missing_courses = json.load(f)
    
    print(f"Found {len(missing_courses)} missing courses to download")
    
    # Set download directory
    download_dir = Path(__file__).parent.parent / 'RAG' / 'VU' / 'course_pdfs'
    download_dir.mkdir(exist_ok=True)
    print(f"Download directory: {download_dir}")
    
    # Track progress
    successful = 0
    failed = 0
    failed_courses = []
    
    with sync_playwright() as p:
        # Launch browser once for all downloads
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        
        for i, course in enumerate(missing_courses, 1):
            print(f"\n[{i}/{len(missing_courses)}]")
            
            success = download_missing_course(page, course, str(download_dir))
            
            if success:
                successful += 1
            else:
                failed += 1
                failed_courses.append(course)
        
        browser.close()
    
    # Summary
    print(f"\n{'='*80}")
    print("DOWNLOAD SUMMARY")
    print('='*80)
    print(f"Total missing courses: {len(missing_courses)}")
    print(f"✓ Successful: {successful}")
    print(f"✗ Failed: {failed}")
    
    if failed_courses:
        print(f"\nFailed courses:")
        for course in failed_courses:
            print(f"  - {course['code']}: {course['name']}")
        
        # Save failed courses to file
        failed_file = download_dir / 'failed_missing_downloads.json'
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed_courses, f, indent=2, ensure_ascii=False)
        print(f"\nFailed courses saved to: {failed_file}")
    else:
        print("\n✓ All missing courses downloaded successfully!")

if __name__ == "__main__":
    download_all_missing_courses()
