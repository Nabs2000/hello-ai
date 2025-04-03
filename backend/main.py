from flask import Flask, request, jsonify
import whisper
from openai import OpenAI

import os
from google.cloud import texttospeech
import yaml

with open('config.yaml', 'r') as file:
    data = yaml.safe_load(file)

client = OpenAI(api_key=data['OPENAI_API_KEY'])
app = Flask(__name__)
model = whisper.load_model("base")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = data['GOOGLE_APPLICATION_CREDENTIALS_JSON']
tts_client = texttospeech.TextToSpeechClient()

@app.route('/ask', methods=['POST'])
def ask():
    file = request.files['file']
    file.save("temp.wav")

    result = model.transcribe("temp.wav", language="Urdu")
    user_text = result["text"]
    print("User said:", user_text)

    gpt_response = client.chat.completions.create(model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "آپ ایک اردو بولنے والے مددگار ہیں۔"},
        {"role": "user", "content": user_text}
    ])
    reply = gpt_response.choices[0].message.content

    # Text-to-speech
    synthesis_input = texttospeech.SynthesisInput(text=reply)
    voice = texttospeech.VoiceSelectionParams(language_code="ur-PK", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL)
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)

    with open("reply.mp3", "wb") as out:
        out.write(response.audio_content)

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
