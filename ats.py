import re
import sys
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer

def clean_text(text):
    text = re.sub(r'/[A-Z][A-Za-z0-9]*', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.replace('Node.js', 'nodejs').lower()

def extract_section(text, section_name, stop_sections):
    stop_pattern = '|'.join(stop_sections)
    pattern = rf'(?i){section_name}[\s\S]*?(?={stop_pattern}|$)'
    match = re.search(pattern, text, re.DOTALL)
    return match.group(0).strip() if match else ""

def parse_resume(resume_text):
    cleaned_text = clean_text(resume_text)
    return {
        "work_experience": extract_section(cleaned_text, 'work experience', ['education', 'skills', 'projects', 'certifications', 'awards']),
        "skills": extract_section(cleaned_text, 'skills', ['education', 'work experience', 'projects', 'certifications', 'awards']),
        "education": extract_section(cleaned_text, 'education', ['skills', 'work experience', 'projects', 'certifications', 'awards'])
    }

def extract_keywords_by_section(job_description):
    job_description = clean_text(job_description)
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=50)
    tfidf_matrix = vectorizer.fit_transform([job_description])
    keywords = vectorizer.get_feature_names_out()
    keyword_list = [kw.lower() for kw in keywords]

    return {
        "work_experience": [kw for kw in keyword_list if any(v in kw for v in ['manage', 'lead', 'develop', 'test', 'maintain', 'coordinate', 'developer'])],
        "skills": [kw for kw in keyword_list if any(t in kw for t in ['python', 'excel', 'react', 'nodejs', 'marketing', 'design', 'sql', 'aws'])],
        "education": [kw for kw in keyword_list if any(e in kw for e in ['bachelor', 'master', 'degree', 'diploma', 'certification'])]
    }

def keyword_in_text(keyword, text):
    return any(word in text for word in keyword.split())

def calculate_score(resume_data, job_keywords):
    scores = {
        section: sum(1 for kw in job_keywords[section] if keyword_in_text(kw, resume_data[section]))
        for section in job_keywords
    }
    totals = {section: len(job_keywords[section]) for section in job_keywords}
    percentages = {
        section: (scores[section] / totals[section]) * 100 if totals[section] > 0 else 0
        for section in scores
    }
    return (percentages['work_experience'] * 0.4 +
            percentages['skills'] * 0.4 +
            percentages['education'] * 0.2)

def identify_missing_keywords(resume_data, job_keywords):
    return {
        section: [kw for kw in job_keywords[section] if not keyword_in_text(kw, resume_data[section])]
        for section in job_keywords
    }

def generate_feedback(missing_keywords, score):
    feedback = []
    for section, keywords in missing_keywords.items():
        if keywords:
            feedback.append(f"{section.capitalize()}: Missing {', '.join(keywords)}")
        else:
            feedback.append(f"{section.capitalize()}: All relevant keywords are present ✅")
    if score == 100 and not any(missing_keywords.values()):
        feedback.append("Fantastic! Your resume is perfectly aligned with the job description.")
    return feedback

def ats_process(resume_file, job_description_text):
    try:
        resume_text = resume_file.read().decode('utf-8', errors='ignore')
    except UnicodeDecodeError:
        resume_text = resume_file.read().decode('latin-1')

    job_keywords = extract_keywords_by_section(job_description_text)
    resume_data = parse_resume(resume_text)

    print("DEBUG job_keywords:", job_keywords, file=sys.stderr)
    print("DEBUG resume_data:", resume_data, file=sys.stderr)

    score = calculate_score(resume_data, job_keywords)
    missing = identify_missing_keywords(resume_data, job_keywords)
    feedback = generate_feedback(missing, score)

    return {
        "score": score,
        "feedback": feedback
    }

if __name__ == "__main__":
    resume_file_path = sys.argv[1]
    job_description_path = sys.argv[2]

    with open(resume_file_path, 'rb') as resume_file, open(job_description_path, 'r', encoding='utf-8') as jd_file:
        job_description_text = jd_file.read()
        result = ats_process(resume_file, job_description_text)
        print(json.dumps(result, indent=2))

    try:
        os.remove(job_description_path)
    except Exception:
        pass
 