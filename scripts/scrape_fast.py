# pip install -U tls-client beautifulsoup4
import tls_client
import json
from urllib.parse import urlencode
from bs4 import BeautifulSoup

SEARCH_URL = "https://studiegids.uva.nl/xmlpages/plspub/uva_tangelo.uva_search.courses_pls"
SEARCH_PAGE = ("https://studiegids.uva.nl/xmlpages/page/2025-2026-en/search-course"
               "?p_institute=&p_programme=&p_credits=&p_instr_lang=&p_open_course="
               "&p_period_start=&p_course_year=&p_search_inside=&p_searchwords=&shareable=true")

def create_session() -> tls_client.Session:
    sess = tls_client.Session(
        client_identifier="chrome_120",   # modern Chrome JA3/TLS fingerprint
        random_tls_extension_order=True,
    )
    # Set headers exactly as in browser request
    sess.headers.update({
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "tr-TR,tr;q=0.6",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://studiegids.uva.nl",
        "Referer": SEARCH_PAGE,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    })
    return sess

def warmup(sess: tls_client.Session):
    # Let server set JSESSIONID etc. Avoid pasting stale cookies.
    sess.get(SEARCH_PAGE, timeout_seconds=30)

def post_course_search(sess: tls_client.Session, payload: dict) -> str:
    body = urlencode(payload)
    resp = sess.post(SEARCH_URL, data=body, timeout_seconds=30)
    
    if resp.status_code != 200:
        print(f"Error: HTTP {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        raise RuntimeError(f"HTTP {resp.status_code}")
    
    return resp.text

def parse_courses(html: str) -> list:
    """Parse courses from HTML response"""
    soup = BeautifulSoup(html, 'html.parser')
    courses = []
    
    # Find all course rows - each course has class="result"
    for row in soup.select('tr.result'):
        try:
            # Get course name from the link with class "icon-arrow"
            name_link = row.select_one('a.icon-arrow')
            if not name_link:
                continue
            
            name = name_link.get_text(strip=True)
            
            # Get credits from the last td
            credits_cell = row.select_one('td:last-child')
            credits = credits_cell.get_text(strip=True) if credits_cell else ''
            
            # The detailed info is in the next row (tr.slideout)
            next_row = row.find_next_sibling('tr', class_='slideout')
            if next_row:
                # Get course ID and URL from the "More info" link
                more_link = next_row.select_one('a.more')
                if more_link:
                    course_id = more_link.get('data-id', '')
                    href = more_link.get('href', '')
                    url = f"https://studiegids.uva.nl{href}" if href and not href.startswith('http') else href
                else:
                    course_id = ''
                    url = ''
                
                # Get course code - look for the row with "Course catalogue number" label
                code = ''
                detail_rows = next_row.select('table tr')
                for detail_row in detail_rows:
                    cells = detail_row.select('td')
                    if len(cells) >= 2:
                        label_cell = cells[0].get_text(strip=True)
                        if 'Course catalogue number' in label_cell:
                            code = cells[1].get_text(strip=True)
                            break
            else:
                course_id = ''
                url = ''
                code = ''
            
            courses.append({
                'name': name,
                'code': code,
                'course_id': course_id,
                'credits': credits,
                'url': url
            })
            
        except Exception as e:
            continue
    
    return courses

if __name__ == "__main__":
    sess = create_session()
    warmup(sess)

    # Configuration
    MAX_PAGES = 192  # Change this to scrape more pages (3829 courses / 20 per page = ~192 pages)
    
    all_courses = []
    
    for page_num in range(1, MAX_PAGES + 1):
        print(f"\n{'='*60}")
        print(f"Scraping page {page_num}/{MAX_PAGES}...")
        print(f"{'='*60}")
        
        payload = {
            "p_institute": "",
            "p_programme": "",
            "p_credits": "",
            "p_instr_lang": "",
            "p_open_course": "",
            "p_period_start": "",
            "p_fetch_size": "20",  # Results per page
            "p_course_year": "",
            "p_rsrcpath": "/xmlpages/resources/TXP/uva/studiegidswebsite/",
            "p_page": str(page_num),  # Page number
            "p_ctxparam": "/xmlpages/page/2025-2026-en/",
            "p_searchpagetype": "courses",
            "p_strip": "",
            "p_site_lang": "en",
            "p_site_year": "2025-2026",
            "p_search_inside": "",
            "p_searchwords": "",  # e.g., "machine learning"
        }

        html = post_course_search(sess, payload)
        courses = parse_courses(html)
        
        print(f"\nParsed {len(courses)} courses:")
        for i, course in enumerate(courses, 1):
            print(f"  {i}. {course['name'][:60]}... ({course['code']}) - {course['credits']} EC")
        
        all_courses.extend(courses)
        
        # Small delay between requests to be polite
        if page_num < MAX_PAGES:
            import time
            time.sleep(1)
    
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Total courses scraped: {len(all_courses)}")
    print(f"Pages scraped: {MAX_PAGES}")
    print(f"Estimated total courses: 3829")
    print(f"Estimated total pages: ~192")
    
    # Save to JSON
    if all_courses:
        with open('uva_courses.json', 'w', encoding='utf-8') as f:
            json.dump(all_courses, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Saved {len(all_courses)} courses to uva_courses.json")
