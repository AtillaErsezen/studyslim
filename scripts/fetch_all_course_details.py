# pip install -U tls-client beautifulsoup4
import tls_client
import json
import time
from bs4 import BeautifulSoup
from pathlib import Path

def create_session() -> tls_client.Session:
    sess = tls_client.Session(
        client_identifier="chrome_120",
        random_tls_extension_order=True,
    )
    sess.headers.update({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-GPC": "1",
    })
    return sess

def fetch_course_details(course_id: str, session: tls_client.Session) -> dict:
    """Fetch detailed course information from course detail page"""
    
    url = f"https://studiegids.uva.nl/xmlpages/page/2025-2026-en/search-course/course/{course_id}"
    
    try:
        resp = session.get(url, timeout_seconds=30)
        
        if resp.status_code != 200:
            print(f"  ✗ Error: HTTP {resp.status_code}")
            return None
        
        # Parse the HTML
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        course_data = {
            'course_id': course_id,
            'url': url,
        }
        
        # Extract course title from h1 in article
        title_elem = soup.select_one('article h1')
        if title_elem:
            course_data['title'] = title_elem.get_text(strip=True)
        
        # Extract all the detail fields from the table in item-info
        info_table = soup.select_one('.item-info table')
        if info_table:
            for row in info_table.select('tr'):
                try:
                    cells = row.select('td')
                    if len(cells) >= 2:
                        label = cells[0].get_text(strip=True).lower()
                        
                        # Skip time period row (has nested table)
                        if 'time period' in label or 'period' in label:
                            continue
                        
                        # Get text content, excluding nested links
                        value_cell = cells[1]
                        
                        # Map common fields
                        if 'course catalogue number' in label or 'course code' in label:
                            course_data['code'] = value_cell.get_text(strip=True)
                        elif 'credit' in label:
                            # Extract just the number (e.g., "4 EC" -> "4 EC")
                            course_data['credits'] = value_cell.get_text(strip=True)
                        elif 'language of instruction' in label:
                            course_data['language'] = value_cell.get_text(strip=True)
                        elif 'level' in label or 'course level' in label:
                            course_data['level'] = value_cell.get_text(strip=True)
                        elif 'college' in label or 'faculty' in label or 'graduate' in label:
                            course_data['institute'] = value_cell.get_text(strip=True)
                        elif 'lecturer' in label or 'coordinator' in label:
                            course_data['lecturer'] = value_cell.get_text(strip=True)
                        elif 'entry requirements' in label or 'prerequisites' in label:
                            course_data['prerequisites'] = value_cell.get_text(strip=True)
                        elif 'is part of' in label or 'programme' in label:
                            course_data['programmes'] = value_cell.get_text(strip=True)
                        elif 'contact' in label:
                            course_data['contact'] = value_cell.get_text(strip=True)
                except:
                    continue
        
        # Extract description from common locations
        if 'description' not in course_data:
            desc_elem = soup.select_one('.course-description, .description, p.description')
            if desc_elem:
                course_data['description'] = desc_elem.get_text(strip=True)
        
        # Parse objectives/learning outcomes - look for h4 with id="leerdoel"
        objectives_header = soup.find('h4', id='leerdoel')
        if objectives_header:
            content_parts = []
            for sibling in objectives_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['objectives'] = ' '.join(content_parts)
        
        # Parse course contents - look for h4 with id="inhoud"
        contents_header = soup.find('h4', id='inhoud')
        if contents_header:
            content_parts = []
            for sibling in contents_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['contents'] = ' '.join(content_parts)
        
        # Parse registration information - look for h4 with id="aanmelden"
        registration_header = soup.find('h4', id='aanmelden')
        if registration_header:
            content_parts = []
            for sibling in registration_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['registration'] = ' '.join(content_parts)
        
        # Parse teaching method - look for h4 with id="onderwijsvorm"
        teaching_header = soup.find('h4', id='onderwijsvorm')
        if teaching_header:
            content_parts = []
            for sibling in teaching_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['teaching_method'] = ' '.join(content_parts)
        
        # Parse study materials - look for h4 with id="studiemateriaal"
        materials_header = soup.find('h4', id='studiemateriaal')
        if materials_header:
            content_parts = []
            for sibling in materials_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['study_materials'] = ' '.join(content_parts)
        
        # Parse assessment - look for h4 with id="toetsing"
        assessment_header = soup.find('h4', id='toetsing')
        if assessment_header:
            content_parts = []
            for sibling in assessment_header.find_next_siblings():
                if sibling.name == 'h4':  # Stop at next section
                    break
                text = sibling.get_text(strip=True)
                if text:
                    content_parts.append(text)
            if content_parts:
                course_data['assessment'] = ' '.join(content_parts)
        
        return course_data
    
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        return None

def main():
    # Load the course list
    courses_file = Path('uva_courses.json')
    if not courses_file.exists():
        print(f"Error: {courses_file} not found!")
        return
    
    with open(courses_file, 'r', encoding='utf-8') as f:
        courses = json.load(f)
    
    print(f"Found {len(courses)} courses to process")
    print("="*60)
    
    # Create session
    session = create_session()
    
    # Process each course
    all_course_details = []
    failed_courses = []
    
    for i, course in enumerate(courses, 1):
        course_id = course.get('course_id')
        course_name = course.get('name', 'Unknown')
        
        print(f"[{i}/{len(courses)}] Processing: {course_name} (ID: {course_id})")
        
        details = fetch_course_details(course_id, session)
        
        if details:
            all_course_details.append(details)
            print(f"  ✓ Success")
        else:
            failed_courses.append({'course_id': course_id, 'name': course_name})
            print(f"  ✗ Failed")
        
        # Add a small delay to be respectful to the server
        if i < len(courses):
            time.sleep(0.5)
        
        # Save progress every 50 courses
        if i % 50 == 0:
            temp_output = f'uva_course_details_progress_{i}.json'
            with open(temp_output, 'w', encoding='utf-8') as f:
                json.dump(all_course_details, f, indent=2, ensure_ascii=False)
            print(f"  💾 Progress saved to {temp_output}")
    
    # Save final results
    output_file = 'uva_course_details_complete.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_course_details, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total courses processed: {len(courses)}")
    print(f"Successfully fetched: {len(all_course_details)}")
    print(f"Failed: {len(failed_courses)}")
    print(f"\n✓ Saved to {output_file}")
    
    if failed_courses:
        print(f"\nFailed courses:")
        for fc in failed_courses:
            print(f"  - {fc['name']} (ID: {fc['course_id']})")
        
        # Save failed courses list
        with open('failed_courses.json', 'w', encoding='utf-8') as f:
            json.dump(failed_courses, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Failed courses list saved to failed_courses.json")

if __name__ == "__main__":
    main()
