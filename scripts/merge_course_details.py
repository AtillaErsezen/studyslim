import json
from pathlib import Path

def merge_course_details():
    """Merge all course detail JSON files into a single file"""
    
    # Find all course detail files
    root_dir = Path('.')
    
    # Pattern: uva_course_details_progress_*.json and uva_course_details_complete.json
    detail_files = list(root_dir.glob('uva_course_details_progress_*.json'))
    complete_file = root_dir / 'uva_course_details_complete.json'
    
    if complete_file.exists():
        detail_files.append(complete_file)
    
    if not detail_files:
        print("No course detail files found!")
        return
    
    print(f"Found {len(detail_files)} course detail files:")
    for f in sorted(detail_files):
        print(f"  - {f.name}")
    
    # Load all courses and deduplicate by course_id
    all_courses = {}
    
    for file_path in detail_files:
        print(f"\nProcessing {file_path.name}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                courses = json.load(f)
                
            print(f"  Loaded {len(courses)} courses")
            
            # Add to dictionary (later files override earlier ones for same course_id)
            for course in courses:
                course_id = course.get('course_id')
                if course_id:
                    all_courses[course_id] = course
                    
        except Exception as e:
            print(f"  Error loading {file_path.name}: {e}")
    
    # Convert back to list
    merged_courses = list(all_courses.values())
    
    # Sort by course_id for consistency
    merged_courses.sort(key=lambda x: x.get('course_id', ''))
    
    # Save merged file
    output_file = 'uva_all_course_details.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_courses, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("MERGE SUMMARY")
    print("="*60)
    print(f"Total unique courses: {len(merged_courses)}")
    print(f"Output file: {output_file}")
    print(f"File size: {Path(output_file).stat().st_size / 1024 / 1024:.2f} MB")
    print("\n✓ Merge completed successfully!")

if __name__ == "__main__":
    merge_course_details()
