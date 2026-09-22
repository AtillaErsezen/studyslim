# pip install -U tls-client
import tls_client
import json

def create_session() -> tls_client.Session:
    """Create a TLS client session that mimics a real browser"""
    sess = tls_client.Session(
        client_identifier="chrome_120",
        random_tls_extension_order=True,
    )
    sess.headers.update({
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "tr-TR,tr;q=0.6",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "sec-ch-ua": '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Referer": "https://studiegids.vu.nl/en/courses/2025-2026",
    })
    return sess

def fetch_vu_courses():
    """Fetch all courses from VU API"""
    
    url = "https://studiegids.vu.nl/api/studyguide/en/2025-2026/courses"
    
    print(f"Fetching VU courses from API...")
    print(f"URL: {url}")
    
    session = create_session()
    
    try:
        resp = session.get(url, timeout_seconds=30)
        
        if resp.status_code != 200:
            print(f"Error: HTTP {resp.status_code}")
            return None
        
        print(f"Success! Status: {resp.status_code}")
        
        # Parse JSON response
        courses = resp.json()
        
        print(f"Received {len(courses)} courses")
        
        # Save to file
        output_file = 'vu_courses.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved to {output_file}")
        
        # Print some stats
        if courses and len(courses) > 0:
            print(f"\nSample course:")
            print(json.dumps(courses[0], indent=2, ensure_ascii=False)[:500] + "...")
        
        return courses
        
    except Exception as e:
        print(f"Exception occurred: {e}")
        return None

if __name__ == "__main__":
    fetch_vu_courses()
