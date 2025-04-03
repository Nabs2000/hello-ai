import React, { useState, useRef } from 'react';
import { View, Button, Text, StyleSheet, Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import axios from 'axios';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    setIsRecording(false);
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      console.log('Recording stopped and stored at:', uri);

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'user_audio.wav',
        type: 'audio/wav',
      } as any);

      try {
        const response = await axios.post('https://b334-51-143-4-81.ngrok-free.app/ask', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setResponseText(response.data.reply);

        // Optionally play the returned reply.mp3 file from server
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: 'https://b334-51-143-4-81.ngrok-free.app/static/reply.mp3' });
        soundRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
      />
      <Text style={styles.response}>{responseText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  response: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
});
