import re
import sys
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def cosine_section_scores(resume_data, job_description):
    sections = ['work_experience','skills','education']
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1,2))
    docs = [job_description] + [resume_data[s] or "" for s in sections]
    tfidf = vectorizer.fit_transform(docs)
    jd_vec = tfidf[0]
    scores = {}
    for i, s in enumerate(sections, start=1):
        sim = cosine_similarity(jd_vec, tfidf[i])[0][0]  # between 0.0 and 1.0
        scores[s] = sim * 100
    final = scores['work_experience'] * 0.4 + scores['skills'] * 0.4 + scores['education'] * 0.2
    return final, scores

def clean_text(text):
    if not text:
        return ""
    # remove non-printable chars, normalize spaces, lowercase
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)         # remove weird unicode
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace('Node.js', 'nodejs')
    return text.lower()

def extract_section(text, section_name, stop_sections):
    # Build a safe regex: look for heading lines that contain section_name
    # and capture until the next heading in stop_sections or end of text.
    escaped_stops = [re.escape(s) for s in stop_sections]
    stop_pattern = r'|'.join(escaped_stops)
    pattern = rf'(?ims)^\s*{re.escape(section_name)}\b.*?(?=^\s*(?:{stop_pattern})\b|\Z)'
    m = re.search(pattern, text)
    return m.group(0).strip() if m else ""

def parse_resume(resume_text):
    cleaned_text = clean_text(resume_text)
    return {
        "work_experience": extract_section(cleaned_text, 'work experience', ['education', 'skills', 'projects', 'certifications', 'awards']),
        "skills": extract_section(cleaned_text, 'skills', ['education', 'work experience', 'projects', 'certifications', 'awards']),
        "education": extract_section(cleaned_text, 'education', ['skills', 'work experience', 'projects', 'certifications', 'awards'])
    }

def extract_keywords_by_section(job_description):
    job_description = clean_text(job_description)
    vectorizer = CountVectorizer(stop_words='english', ngram_range=(1,2), max_features=100)
    X = vectorizer.fit_transform([job_description])
    keywords = vectorizer.get_feature_names_out()
    kws = [kw.lower() for kw in keywords]

    return {
        "work_experience": [kw for kw in kws if any(v in kw for v in ['manage', 'lead', 'develop', 'test', 'maintain', 'coordinate', 'developer'])],
        "skills": [kw for kw in kws if any(t in kw for t in ['python', 'excel', 'react', 'nodejs', 'marketing', 'design', 'sql', 'aws'])],
        "education": [kw for kw in kws if any(e in kw for e in ['bachelor', 'master', 'degree', 'diploma', 'certification'])]
    }

def keyword_in_text(keyword, text):
    if not keyword or not text:
        return False
    # match the whole phrase or single word, case-insensitive (text should already be lowered)
    pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
    return re.search(pattern, text) is not None


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
 
 