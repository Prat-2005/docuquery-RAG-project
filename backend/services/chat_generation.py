from backend.services.ai_client import AIClient

class GenerativeGPT:

    def __init__(self):
        self.system_prompt = (
            "You are a document reader. " \
            "Your task is to help users answer questions about their uploaded documents. " \
            "Use only the provided document context. " \
            "Infer a concise, descriptive conversation title from the discussion, " \
            "but do not include the title in your answer unless the user asks for it. " \
            "If the answer is not in the context, say you do not know or no information "
            "available for this query."                  
        )
        self.ai_client = AIClient()
        self.answer = ""

    def generate(self, context: str, question: str) -> str:
        print("Generation: preparing the answer request...", flush=True)
        prompt = (
            f"{self.system_prompt}\n\n"
            f"Document context:\n{context}\n\n"
            f"Question:\n{question}"
        )
        self.answer = self.ai_client.generate(prompt)
        print("Generation: answer ready.", flush=True)
        return self.answer

    def generate_title(self, question: str, answer: str) -> str:
        prompt = (
            "Generate a concise, descriptive title for this conversation. "
            "Use 3 to 8 words, return only the title, and do not use quotation marks.\n\n"
            f"User question:\n{question}\n\n"
            f"Assistant answer:\n{answer}"
        )
        generated_title = self.ai_client.generate(prompt).strip()
        if not generated_title:
            return ""
        title = generated_title.splitlines()[0]
        return title.strip("\"'` ")[:120]

    def regenerate(self, context: str, question: str, previous_answer: str) -> str:
        if not previous_answer:
            raise RuntimeError(
                "Call generate() before regenerate()"
            )

        prompt = (
            f"{self.system_prompt}\n\n"
            f"Document context:\n{context}\n\n"
            f"Question:\n{question}\n\n"
            f"Previous answer:\n{previous_answer}\n\n"
            "Improve the previous answer using only the context. OR Find "
            "your own relevance from your trained data or research."
        )
        self.answer = self.ai_client.generate(prompt)
        return self.answer

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