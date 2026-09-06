import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { registerNativeAudioBridge } from "@/lib/alarm";

const AUDIO_BRIDGE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background: transparent; margin: 0; padding: 0;">
<script>
  var audioCtx = null;
  var isPlaying = false;
  var loopTimer = null;
  var currentVolume = 1.0;

  function getAudioContext() {
    if (!audioCtx) {
      var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playOkadaGoChime(volMultiplier) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      var vol = typeof volMultiplier === 'number' ? volMultiplier : currentVolume;
      var now = ctx.currentTime;

      // Professional, attention-grabbing ascending harmonic chime
      // Rapid 4-note arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      var notes = [
        { freq: 523.25, time: 0.00, dur: 0.14 },
        { freq: 659.25, time: 0.12, dur: 0.14 },
        { freq: 783.99, time: 0.24, dur: 0.14 },
        { freq: 1046.50, time: 0.36, dur: 0.45 }
      ];

      notes.forEach(function(n) {
        // Fundamental sine wave
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(vol * 0.85, now + n.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);

        // 2nd harmonic (octave overtone) to cut through traffic noise
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(n.freq * 2, now + n.time);

        gain2.gain.setValueAtTime(vol * 0.35, now + n.time);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + n.time);
        osc2.stop(now + n.time + n.dur);
      });
    } catch(err) {
      // Audio execution error
    }
  }

  function startChimeLoop(vol) {
    currentVolume = typeof vol === 'number' ? vol : 1.0;
    isPlaying = true;
    if (loopTimer) clearInterval(loopTimer);

    // Initial chime
    playOkadaGoChime(currentVolume);

    // Repeat every 1150ms while request is pending
    loopTimer = setInterval(function() {
      if (!isPlaying) {
        clearInterval(loopTimer);
        return;
      }
      playOkadaGoChime(currentVolume);
    }, 1150);
  }

  function stopChimeLoop() {
    isPlaying = false;
    if (loopTimer) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
  }

  // Support both window message & document message
  function handleMsg(raw) {
    try {
      var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (data.action === 'PLAY') {
        startChimeLoop(data.volume);
      } else if (data.action === 'STOP') {
        stopChimeLoop();
      }
    } catch(e) {}
  }

  window.addEventListener('message', function(e) { handleMsg(e.data); });
  document.addEventListener('message', function(e) { handleMsg(e.data); });
</script>
</body>
</html>`;

export function AudioBridge() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Only register WebView bridge on mobile native platforms
    if (Platform.OS === "web") return;

    const unregister = registerNativeAudioBridge({
      play: (volume: number) => {
        try {
          const js = `startChimeLoop(${volume}); true;`;
          webViewRef.current?.injectJavaScript(js);
        } catch {
          // bridge inject failure
        }
      },
      stop: () => {
        try {
          const js = `stopChimeLoop(); true;`;
          webViewRef.current?.injectJavaScript(js);
        } catch {
          // bridge inject failure
        }
      },
    });

    return unregister;
  }, []);

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <View style={styles.hiddenContainer} pointerEvents="none" aria-hidden={true}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: AUDIO_BRIDGE_HTML }}
        style={styles.hiddenWebView}
        javaScriptEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    zIndex: -999,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    backgroundColor: "transparent",
  },
});
