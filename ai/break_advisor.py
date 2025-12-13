def get_break_advice(stats):
    prompt = build_prompt(stats)
    response = gemini.generate(prompt)
    return json.loads(response)
