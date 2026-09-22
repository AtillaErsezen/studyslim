import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.agents import create_agent
from langchain.tools import tool
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os
import requests
from dataclasses import dataclass
import sys
import io
import tls_client
import time
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

#data scrape uva vu database, studeersnel, student wiki, course catalogue

load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ChatRequest(BaseModel):
    message: str
#sysyem prompt update according to RAG
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables.")

# Universal search tool - handles all search parameters
@tool
def search_tutors(
    university_short_name: str = None,
    course_name: str = None,
    department: str = None,
    language: str = None,
    min_rating: float = None,
    max_rate: float = None,
    limit: int = 10
) -> str:
    """
    Search for verified tutors based on ANY combination of criteria.
    
    Parameters:
    - university_short_name: Filter by university (e.g., "UvA", "VU", "UU")
    - course_name: Filter by course name (e.g., "Calculus I", "Introduction to AI")
    - department: Filter by department (e.g., "Computer Science", "Mathematics")
    - language: Filter by spoken language (e.g., "English", "Dutch", "French")
    - min_rating: Minimum average rating (e.g., 4.0)
    - max_rate: Maximum hourly rate in euros (e.g., 40)
    - limit: Maximum number of results to return (default 10)
    
    Returns: a JSON array (string) containing tutor objects. Example: '[{"name": "Alice", "hourlyRate": 25, ...}, ...]'
    """
    DB_API_URL = "http://localhost:3000/api/ai/db"
    try:
        response = requests.post(
            DB_API_URL,
            json={
                "query_type": "universal_search",
                "params": {
                    "university_short_name": university_short_name,
                    "course_name": course_name,
                    "department": department,
                    "language": language,
                    "min_rating": min_rating,
                    "max_rate": max_rate,
                    "limit": limit
                }
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                tutors = data.get("data", [])
                if tutors:
                    tutors_data = []
                    for tutor in tutors:
                        tutor_json = {
                            'name': tutor.get('name'),
                            'hourlyRate': tutor.get('hourlyRate'),
                            'ratingAvg': tutor.get('ratingAvg'),
                            'id': tutor.get('id'),
                            'isAvailable': tutor.get('isAvailable'),
                            'image': tutor.get('image')
                        }
                        tutors_data.append(tutor_json)
                    # Return a bare JSON array (no wrapper object)
                    return json.dumps(tutors_data)
                else:
                    return "No tutors found matching your criteria."
            else:
                return f"Error: {data.get('error', 'Unknown error')}"
        else:
            return f"API request failed with status {response.status_code}"
    except Exception as e:
        return f"Error querying database: {str(e)}"

@tool
def get_tutor_details(tutor_id: int) -> str:
    """Get detailed information about a specific tutor by their ID."""
    DB_API_URL = "http://localhost:3000/api/ai/db"
    try:
        response = requests.post(
            DB_API_URL,
            json={
                "query_type": "get_tutor_details",
                "params": {
                    "tutor_id": tutor_id
                }
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                tutors = data.get("data", [])
                if tutors and len(tutors) > 0:
                    tutor = tutors[0]
                    result = f"""Tutor Details:
                    Name: {tutor.get('name')}
                    Bio: {tutor.get('bio')}
                    Hourly Rate: €{tutor.get('hourlyRate')}
                    Average Rating: {tutor.get('ratingAvg')}/5 ({tutor.get('reviewCount')} reviews)
                    Languages: {tutor.get('languages')}
                    Course Tags: {tutor.get('courseTags')}
                    Verified: {'Yes' if tutor.get('verified') else 'No'}
                    Available: {'Yes' if tutor.get('isAvailable') else 'No'}
                    Total Earnings: €{tutor.get('totalEarnings')}
                    """
                    return result
                else:
                    return f"No tutor found with ID {tutor_id}."
            else:
                return f"Error: {data.get('error', 'Unknown error')}"
        else:
            return f"API request failed with status {response.status_code}"
    except Exception as e:
        return f"Error querying database: {str(e)}"  

@tool
def fetch_courses(university_short_name: str, academic_year: str = "2025-2026", course_name: str = None) -> str:
    """
    Fetch courses or course details from a specified university's API or website for the given academic year.
    
    Parameters:
    - university_short_name: Short name of the university (e.g., "VU" for Vrije Universiteit Amsterdam, "UvA" for University of Amsterdam).
    - academic_year: The academic year to fetch courses for (default: "2025-2026").
    - course_name: Optional name of the course to search for and fetch details (if provided, filters or searches accordingly).
    
    Returns: A JSON string containing the list of courses or course details if successful, 
    or an error message string if the fetch fails or university is unsupported.
    """
    print(f"Fetching courses for {university_short_name}, year {academic_year}, course_name: {course_name}", flush=True)
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
        url = f"https://studiegids.uva.nl/xmlpages/page/{academic_year}-en/search-course/course/{course_id}"
        
        try:
            resp = session.get(url, timeout_seconds=30)
            
            if resp.status_code != 200:
                return None
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            course_data = {
                'course_id': course_id,
                'url': url,
            }
            
            title_elem = soup.select_one('article h1')
            if title_elem:
                course_data['title'] = title_elem.get_text(strip=True)
            
            info_table = soup.select_one('.item-info table')
            if info_table:
                for row in info_table.select('tr'):
                    try:
                        cells = row.select('td')
                        if len(cells) >= 2:
                            label = cells[0].get_text(strip=True).lower()
                            
                            if 'time period' in label or 'period' in label:
                                continue
                            
                            value_cell = cells[1]
                            
                            if 'course catalogue number' in label or 'course code' in label:
                                course_data['code'] = value_cell.get_text(strip=True)
                            elif 'credit' in label:
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
            
            desc_elem = soup.select_one('.course-description, .description, p.description')
            if desc_elem:
                course_data['description'] = desc_elem.get_text(strip=True)
            
            objectives_header = soup.find('h4', id='leerdoel')
            if objectives_header:
                content_parts = []
                for sibling in objectives_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['objectives'] = ' '.join(content_parts)
            
            contents_header = soup.find('h4', id='inhoud')
            if contents_header:
                content_parts = []
                for sibling in contents_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['contents'] = ' '.join(content_parts)
            
            registration_header = soup.find('h4', id='aanmelden')
            if registration_header:
                content_parts = []
                for sibling in registration_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['registration'] = ' '.join(content_parts)
            
            teaching_header = soup.find('h4', id='onderwijsvorm')
            if teaching_header:
                content_parts = []
                for sibling in teaching_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['teaching_method'] = ' '.join(content_parts)
            
            materials_header = soup.find('h4', id='studiemateriaal')
            if materials_header:
                content_parts = []
                for sibling in materials_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['study_materials'] = ' '.join(content_parts)
            
            assessment_header = soup.find('h4', id='toetsing')
            if assessment_header:
                content_parts = []
                for sibling in assessment_header.find_next_siblings():
                    if sibling.name == 'h4':
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content_parts.append(text)
                if content_parts:
                    course_data['assessment'] = ' '.join(content_parts)
            print(course_data, flush=True)
            return course_data
        
        except Exception as e:
            return None

    if university_short_name == "VU":
        print("Fetching VU courses...", flush=True)
        url = f"https://studiegids.vu.nl/api/studyguide/en/{academic_year}/courses"
        
        session = tls_client.Session(
            client_identifier="chrome_120",
            random_tls_extension_order=True,
        )
        session.headers.update({
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
            "Referer": f"https://studiegids.vu.nl/en/courses/{academic_year}",
        })
        
        try:
            response = session.get(url, timeout_seconds=30)
            print(f"VU response status: {response.status_code}", flush=True)
            if response.status_code != 200:
                return f"Error: HTTP {response.status_code} - Failed to fetch {university_short_name} courses."
            
            courses = response.json()
            print(f"VU courses fetched: {len(courses)}", flush=True)
            
            if not isinstance(courses, list):
                return "Error: Response is not a list of courses."
            
            if course_name:
                courses = [c for c in courses if course_name.lower() in c.get('name', '').lower()]
            print(f"VU courses after filtering by name, returning '{course_name}': {len(courses)}", flush=True)
            return json.dumps(courses)
        
        except Exception as e:
            return f"Exception occurred while fetching {university_short_name} courses: {str(e)}"
    
    elif university_short_name == "UvA":
        print(f"Fetching UvA courses for year {academic_year} with course_name: {course_name}", flush=True)
        if not course_name:
            return "Error: For UvA, please provide course_name to search for specific courses."
        
        session = create_session()
        
        search_url = f"https://studiegids.uva.nl/xmlpages/page/{academic_year}-en/search-course?search={course_name}"
        
        try:
            resp = session.get(search_url, timeout_seconds=30)
            print(f"UvA search response status: {resp.status_code}", flush=True)
            if resp.status_code != 200:
                return f"Error: HTTP {resp.status_code} - Failed to fetch search page for '{course_name}'."
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            print(f"UvA search page content length: {len(resp.text)}", flush=True)
            course_ids = set()
            for a in soup.find_all('a', href=True):
                href = a['href']
                if '/search-course/course/' in href:
                    parts = href.split('/course/')
                    if len(parts) > 1:
                        id_str = parts[1].split('/')[0].strip()
                        if id_str.isdigit():
                            course_ids.add(id_str)
            print(f"UvA course IDs found for '{course_name}': {course_ids}", flush=True)
            if not course_ids:
                return f"No courses found matching '{course_name}'."
            print(f"Fetching details for up to 5 UvA courses: {list(course_ids)[:5]}", flush=True)
            all_details = []
            for course_id in list(course_ids)[:5]:  # Limit to 5 to prevent overload
                details = fetch_course_details(course_id, session)
                if details:
                    all_details.append(details)
                time.sleep(0.5)
            print(f"UvA course details fetched: {len(all_details)}", flush=True)
            return json.dumps(all_details)
        
        except Exception as e:
            return f"Exception occurred while fetching UvA courses: {str(e)}"
    
    else:
        return f"Error: Unsupported university '{university_short_name}'. Currently 'VU' and 'UvA' are implemented."

@dataclass
class Context:
    """Custom runtime context schema."""
    user_id: str


SYSTEM_PROMPT = """You are TutorBot, a super friendly, warm, and enthusiastic tutoring assistant who loves helping students in Amsterdam (Netherlands) universities find and connect with tutors, as well as answering questions about courses.
You MUST only call the get_tutor_details tool if the user explicitly asks for more information about a specific tutor. Do NOT call get_tutor_details automatically after returning results from search_tutors.

When returning tutor results, you MUST return ONLY a valid JSON array (a list) of tutor objects. The response must be a single valid JSON array string (for example: `[{"name":"Alice","hourlyRate":25,"ratingAvg":4.8,"id":"t1","isAvailable":true,"image":"https://..."}, ...]`). Each tutor object should include the keys: name, hourlyRate, ratingAvg, id, isAvailable, image. Format fields inside each object where appropriate (e.g., you may include emoji characters in string fields for friendliness), but do NOT include any explanatory text, markdown blocks, or wrapper objects outside the JSON array. If no tutors are found, return an empty array: `[]`.
If the agent returns a structured response, the value of `chat_response` MUST be a valid JSON array string (not wrapped in any additional object).

**CRITICAL RULE: Always make exactly ONE search_tutors() call per user query. Never chain multiple calls. Combine all filter criteria into a single call.**

If the user query involves course information, you MUST use the fetch_courses tool to get course details.
If the user query involves finding tutors, you MUST use the search_tutors tool with ALL applicable parameters in a SINGLE call.

Always prefer tool usage that follows these safety and single-call patterns.

Scope & Guardrails

In-scope:
- Helping students find tutors by university, course, department, language, hourly rate, and rating
- Answering questions about courses using the fetch_courses tool (only when the user explicitly asks a question about a course)
- Cheerful greetings and small talk about studying, tutoring, or university life
- Answering basic questions about how you work and what you can help with

Query Classification:

If the user is asking to find or recommend tutors (e.g., mentions "tutors", "help with", "find someone for"), use search_tutors.
If the user is asking for information about a course (e.g., "tell me about", "details on", "what is the course"), use fetch_courses and do NOT call search_tutors unless tutors are explicitly requested.
For mixed queries (e.g., "Info on 3D Visualization at VU and tutors for it"), respond to the course part with fetch_courses first, then offer tutors via search_tutors if appropriate—but only one tool call per type.

Out-of-scope: Any non-tutor queries (weather, general advice, unrelated topics, bookings, messaging tutors, payments, account issues).

For unrelated requests, gently redirect: "I'm here to help you find amazing tutors! Just ask me about tutors by university, course, language, or budget, and I'll do my best to find your perfect match."

Conversation Policy

Style: Exceptionally warm, friendly, and enthusiastic! Use casual, positive, and encouraging language. Make the user feel truly welcome and supported.

Greetings: "Hey there! 😊 I'm TutorBot, your super friendly tutor-finding assistant! I can't wait to help you discover awesome, verified tutors by university, course, language, or budget. What are you looking for today?"

Ambiguity: If key filters are missing, ask in a caring, upbeat way:
"That sounds exciting! To help you find the very best tutors, could you share which university, course, or your budget range? I'm here to make it easy for you!"

Zero results: Stay positive and supportive, always encouraging the user:
"Oh no, no matches this time! But don't worry—try widening your budget, adjusting the rating, or checking nearby universities. I'm always here to help you find the right tutor!"

**CRITICAL: If search_tutors() returns "No tutors found matching your criteria", you MUST immediately suggest widening exactly ONE constraint. Do NOT call search_tutors() again. Do NOT try different parameter combinations. Simply suggest to the user which ONE filter they could relax, and do so in a warm, encouraging way.**

Tools Available

1. search_tutors() - THE ONLY SEARCH TOOL YOU NEED
    **IMPORTANT: Make exactly ONE call with ALL applicable parameters. Never call this tool multiple times for the same query.**
   
    Parameters (ALL optional - use ANY combination):
    - university_short_name: Filter by university (e.g., "UvA", "VU", "UU")
    - course_name: Filter by course name (e.g., "Calculus I", "Data Structures", "Machine Learning")
    - department: Filter by department (e.g., "Computer Science", "Mathematics" )
    - language: Filter by spoken language (e.g., "Dutch", "English", "French")
    - min_rating: Minimum average rating (e.g., 4.0, 4.5)
    - max_rate: Maximum hourly rate in euros (e.g., 40)
    - limit: Number of results (default 3)
   
        Returns:
        - a single valid JSON array string (e.g. `[{{"name":"Alice","hourlyRate":25,...}}, ...]`) containing tutor objects. Each object must include: name, hourlyRate, ratingAvg, id, isAvailable, image.
    
    Examples of CORRECT usage:
    - "Machine learning tutors under 40 euros" → search_tutors(course_name="Machine Learning", max_rate=40)
    - "French tutors at VU with 4+ rating" → search_tutors(university_short_name="VU", language="French", min_rating=4.0)
    - "CS tutors under 35 euros" → search_tutors(department="Computer Science", max_rate=35)
    - "Calculus tutors at UvA" → search_tutors(university_short_name="UvA", course_name="Calculus")
   
    WRONG usage (DON'T DO THIS):
    X search_tutors(course_name="Machine Learning") followed by search_tutors(max_rate=40)
    X Multiple calls trying to filter results

2. get_tutor_details(tutor_id: int)
    Use this ONLY when user asks for details about a specific tutor from search results. NEVER use it after a search_tutors() call unless explicitly requested by the user.

3. fetch_courses(university_short_name: str, academic_year: str = "2025-2026", course_name: str = None)
    Use this tool ONLY when the user asks a question about a course. Make exactly ONE call per query when needed. 
    **IMPORTANT: Use this tool to fetch courses or course details from a specified university's API or website for the given academic year.**
   
    Parameters:
    - university_short_name: Short name of the university (e.g., "VU" for Vrije Universiteit Amsterdam, "UvA" for University of Amsterdam).
    - academic_year: The academic year to fetch courses for (default: "2025-2026").
    - course_name: Optional name of the course to search for and fetch details (if provided, filters or searches accordingly).
    
    Returns: A JSON string containing the list of courses or course details if successful, 
    or an error message string if the fetch fails or university is unsupported.

Search Process:
1. Parse ALL filter criteria from user's query (department, course_name, price, rating, university, language, etc.)
2. Make ONE search_tutors() call with ALL applicable parameters
3. Present the results in a friendly, supportive format
4. Do NOT make additional search calls to refine results
5. **If no results found: STOP immediately and suggest widening ONE filter. Do NOT retry the search.**

Error Handling:
**CRITICAL: When search_tutors() returns zero results:**
- Do NOT call search_tutors() again with different parameters
- Do NOT try to "fix" the search by adjusting filters
- IMMEDIATELY return a warm, friendly message suggesting the user widen ONE constraint
- Example: "No matches found! Maybe try increasing your budget to €50, or lowering the minimum rating to 3.5, or checking other universities like VU or UU. I'm here to help you every step of the way!"

If no results, suggest widening ONE constraint at a time (budget OR rating OR department).

Final Reminders:
- Make exactly ONE search_tutors() call per query
- Combine ALL filters in that single call
- Keep outputs concise, friendly, and supportive
- Always show rates as €X/hour and ratings as Y/5
- Be exceptionally warm, encouraging, and positive!"""
model = init_chat_model(
    "gpt-4o-mini",
    temperature=0.5,
    timeout=10,
    max_tokens=1000
)
#checkpointer = InMemorySaver()

#may need to remove later
class Tutor(BaseModel):
    #id: int
    #userId: int
    #universityId: int
    name: str
    hourlyRate: float
    isAvailable: bool
    ratingAvg: float
    image: str | None = None
    experienceLevel: str | None = None
    
class ChatResponse(BaseModel):
    chat_response: str
    
@dataclass
class ResponseFormat:
    chat_response: str

agent = create_agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[search_tutors, get_tutor_details, fetch_courses],
    context_schema=Context,
    response_format=ResponseFormat,
    #checkpointer=checkpointer for memory
)
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    print('Received chat request:')
    try:
        result = agent.invoke(
            {"messages": [{"role": "user", "content": request.message}]},
            context=Context(user_id="2")
        )
        return ChatResponse(
            chat_response=result['structured_response'].chat_response
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)