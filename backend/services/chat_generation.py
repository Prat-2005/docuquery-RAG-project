import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class GenerativeGPT:

    def __init__(self):
        self.system_prompt = (
            "You are a document reader. " \
            "Your task is to help users answer questions about their uploaded documents. " \
            "Use only the provided document context. " \
            "If the answer is not in the context, say you do not know or no information "
            "available for this query."                  
        )
        self.client = OpenAI(
            base_url=os.environ.get("LLM_URL"),
            api_key=os.environ.get("LLM_API_KEY"),
        )
        self.answer = ""

    def generate(self, context: str, question: str) -> str:
        response = self.client.chat.completions.create(
            model=os.environ.get("LLM_MODEL"),
            messages=[
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Document context:\n{context}\n\n"
                        f"Question:\n{question}"
                    ),
                },
            ],
        )

        self.answer = response.choices[0].message.content
        return self.answer

    def regenerate(self, context: str, question: str, previous_answer: str) -> str:
        if not previous_answer:
            raise RuntimeError(
                "Call generate() before regenerate()"
            )

        response = self.client.chat.completions.create(
            model=os.environ.get("LLM_MODEL"),
            messages=[
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Document context:\n{context}\n\n"
                        f"Question:\n{question}\n\n"
                        f"Previous answer:\n{previous_answer}\n\n"
                        "Improve the previous answer using only the context. OR Find "
                        "your own relevance from your trained data or research."
                    ),
                },
            ],
        )

        self.answer = response.choices[0].message.content
        return self.answer

    def summarize_document(self, content: str) -> str:
        max_characters = 25000
        sampled_content = content[:max_characters + 1]

        return self.generate(
            context=sampled_content,
            question=(
                "Provide a concise summary of this document. "
                "Mention its subject, purpose, key facts, and conclusions."
            ),
        )

""""
if __name__ == '__main__':
    from retrieval import DocumentRetriever

    file = r'sample_docs/short_stories_for_kids.pdf'
    question = "Name the characters of the story Snow White and the Seven Dwarfs?"

    retriever = DocumentRetriever()
    generator = GenerativeGPT()

    retriever.upload(file)
    retriever.chunk()
    retriever.embedding()

    summary = generator.summarize_document(retriever.chunks)
    print(f"File Summary: {summary}")

    retriever.retrieve(question, top_k=3)

    context = retriever.relevant_context()

    answer = generator.generate(context=context, question=question)
    print(f"First Answer: {answer}")

    improved_answer = generator.regenerate(
        context,
        question,
        answer,
    )

    print(f"Improved Answer: {improved_answer}")
"""