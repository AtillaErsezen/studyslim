# pip install -U tls-client beautifulsoup4
import tls_client
import json
from bs4 import BeautifulSoup

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

def fetch_course_details(course_id: str, session: tls_client.Session = None) -> dict:
    """Fetch detailed course information from course detail page"""
    
    if session is None:
        session = create_session()
    
    url = f"https://studiegids.uva.nl/xmlpages/page/2025-2026-en/search-course/course/{course_id}"
    
    print(f"Fetching course {course_id}...")
    
    resp = session.get(url, timeout_seconds=30)
    
    if resp.status_code != 200:
        print(f"Error: HTTP {resp.status_code}")
        return None
    
    print(f"Success! Received {len(resp.text)} characters")
    
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

if __name__ == "__main__":
    # Example: Fetch a single course
    course_id = "133045"  # Competitive & Cooperative Strategy
    
    session = create_session()
    course_details = fetch_course_details(course_id, session)
    
    if course_details:
        print(f"\n{'='*60}")
        print("COURSE DETAILS")
        print(f"{'='*60}")
        for key, value in course_details.items():
            # Truncate long values for display
            display_value = str(value)[:100] + "..." if len(str(value)) > 100 else value
            print(f"{key}: {display_value}")
        
        # Save to JSON
        output_file = f"course_{course_id}_details.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(course_details, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Saved to {output_file}")
