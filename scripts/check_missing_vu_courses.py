import json
from pathlib import Path
from collections import Counter

def check_missing_courses():
    """Compare vu_courses.json with downloaded PDFs to find missing courses"""
    
    # Load vu_courses.json
    courses_file = Path(__file__).parent.parent / 'RAG' / 'VU' / 'vu_courses.json'
    with open(courses_file, 'r', encoding='utf-8') as f:
        courses = json.load(f)
    
    print(f"Total courses in vu_courses.json: {len(courses)}")
    
    # Load vu_course_urls.json
    urls_file = Path(__file__).parent.parent / 'RAG' / 'VU' / 'vu_course_urls.json'
    with open(urls_file, 'r', encoding='utf-8') as f:
        course_urls = json.load(f)
    
    print(f"Total URLs in vu_course_urls.json: {len(course_urls)}")
    
    # Create a mapping of course code to URL
    code_to_url = {}
    for url in course_urls:
        # Extract code from URL: https://studiegids.vu.nl/en/vakken/2025-2026/<code>
        if '/en/vakken/2025-2026/' in url:
            code = url.split('/en/vakken/2025-2026/')[-1]
            code_to_url[code] = url
    
    print(f"Mapped {len(code_to_url)} course codes to URLs")
    
    # Find duplicate course names
    course_names = [c.get('name', '') for c in courses]
    name_counter = Counter(course_names)
    duplicate_names = {name for name, count in name_counter.items() if count > 1}
    
    print(f"\nDuplicate course names found: {len(duplicate_names)}")
    total_duplicate_courses = sum(count for name, count in name_counter.items() if count > 1)
    print(f"Total courses with duplicate names: {total_duplicate_courses}")
    
    # Get list of downloaded PDF files
    pdf_dir = Path(__file__).parent.parent / 'RAG' / 'VU' / 'course_pdfs'
    if not pdf_dir.exists():
        print(f"PDF directory not found: {pdf_dir}")
        return
    
    downloaded_files = list(pdf_dir.glob('*.pdf'))
    print(f"Total PDF files downloaded: {len(downloaded_files)}")
    
    # Get filenames without extension
    downloaded_names = {f.stem for f in downloaded_files}
    
    # Check which courses are missing (those with duplicate names that don't have code suffix)
    missing_courses = []
    
    for course in courses:
        course_name = course.get('name', '')
        course_id = course.get('id', '')
        course_code = course.get('code', '')
        
        # Clean the course name same way as in vu_click.py
        clean_name = course_name.replace('\n', ' ').strip()
        safe_filename = clean_name.replace('/', '-').replace('\\', '-').replace(':', '-').replace('*', '-').replace('?', '-').replace('"', '').replace('<', '-').replace('>', '-').replace('|', '-')
        
        # Check if this course has a duplicate name
        if course_name in duplicate_names:
            # For duplicate names, we need the file with code suffix: <course_name>(<code>)
            filename_with_code = f"{safe_filename}({course_code})"
            
            if filename_with_code not in downloaded_names:
                # Find the matching URL for this course code
                url = code_to_url.get(course_code, None)
                if not url and course_code:
                    # Try constructing the URL if not found in mapping
                    url = f"https://studiegids.vu.nl/en/vakken/2025-2026/{course_code}"
                
                missing_courses.append({
                    'id': course_id,
                    'name': course_name,
                    'code': course_code,
                    'expected_filename': f"{safe_filename}({course_code}).pdf",
                    'url': url,
                    'reason': 'duplicate_name'
                })
        else:
            # For non-duplicate names, check both formats
            found = False
            
            # Check format: <course_name>
            if safe_filename in downloaded_names:
                found = True
            
            # Check format: <course_name>(<code>)
            filename_with_code = f"{safe_filename}({course_code})"
            if filename_with_code in downloaded_names:
                found = True
            
            if not found:
                # Find the matching URL for this course code
                url = code_to_url.get(course_code, None)
                if not url and course_code:
                    # Try constructing the URL if not found in mapping
                    url = f"https://studiegids.vu.nl/en/vakken/2025-2026/{course_code}"
                
                missing_courses.append({
                    'id': course_id,
                    'name': course_name,
                    'code': course_code,
                    'expected_filename': safe_filename + '.pdf',
                    'url': url,
                    'reason': 'not_found'
                })
    
    print(f"\nMissing courses: {len(missing_courses)}")
    
    if missing_courses:
        print("\n" + "="*80)
        print("MISSING COURSES")
        print("="*80)
        
        for i, course in enumerate(missing_courses, 1):
            print(f"\n{i}. ID: {course['id']}")
            print(f"   Code: {course['code']}")
            print(f"   Name: {course['name']}")
            print(f"   Expected file: {course['expected_filename']}")
            print(f"   URL: {course['url']}")
            print(f"   Reason: {course['reason']}")
        
        # Save missing courses to a file
        output_file = pdf_dir / 'missing_courses.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(missing_courses, f, indent=2, ensure_ascii=False)
        
        print(f"\n{'='*80}")
        print(f"Missing courses saved to: {output_file}")
        
        # Also create a list of course IDs for easy retry
        missing_ids = [c['id'] for c in missing_courses]
        ids_file = pdf_dir / 'missing_course_ids.json'
        with open(ids_file, 'w', encoding='utf-8') as f:
            json.dump(missing_ids, f, indent=2)
        
        print(f"Missing course IDs saved to: {ids_file}")
    else:
        print("\n✓ All courses have been downloaded!")
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print("="*80)
    print(f"Total courses: {len(courses)}")
    print(f"Downloaded: {len(downloaded_files)}")
    print(f"Missing: {len(missing_courses)}")
    print(f"Download rate: {len(downloaded_files)/len(courses)*100:.1f}%")

if __name__ == "__main__":
    check_missing_courses()
