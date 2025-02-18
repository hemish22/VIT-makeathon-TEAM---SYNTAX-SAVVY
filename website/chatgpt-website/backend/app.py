from flask import Flask, request, jsonify
from groq import Groq
import os
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd

app = Flask(__name__)

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Initialize DataFrame
df = pd.DataFrame(columns=['column1'])
df.loc[len(df)] = ["correct the code and if correct just return correct"]

# Initialize TF-IDF vectorizer
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df['column1'])

def retrieve(query, k=3):
    query_vec = vectorizer.transform([query])
    scores = cosine_similarity(query_vec, X).flatten()
    top_k_indices = scores.argsort()[-k:][::-1]
    return df.iloc[top_k_indices]

def generate_response(query, retrieved_docs):
    text_column_name = df.columns[0]
    context = " ".join(retrieved_docs[text_column_name].tolist())
    prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",
    )
    return chat_completion.choices[0].message.content

def rag_system(query):
    retrieved_docs = retrieve(query)
    response = generate_response(query, retrieved_docs)
    return response

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    response = rag_system(query)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True)