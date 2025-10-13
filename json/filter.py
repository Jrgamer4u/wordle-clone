import json

with open('./json/dictionary.json', 'r') as file:
    data = json.load(file)
length = 5
data = ([word for word in data if len(word) == length])
with open('./json/targetWords.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
with open('./json/targetLetters.json', 'w', encoding='utf-8') as f:
    json.dump(list(set(''.join(data))), f, ensure_ascii=False, indent=4)