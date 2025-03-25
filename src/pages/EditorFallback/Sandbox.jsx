import React, { useEffect, useRef } from "react";

// Import all the utils
import addAudioToVideo from "./utils/addAudioToVideo";
import base64ToBlob from "./utils/base64toBlob";
import blobToArrayBuffer from "./utils/blobToArrayBuffer";
import fetchFile from "./utils/fetchFile";
import generateThumbstrips from "./utils/generateThumbstrips";
import getAudio from "./utils/getAudio";
import getFrame from "./utils/getFrame";
import hasAudio from "./utils/hasAudio";
import muteVideo from "./utils/muteVideo";
import reencodeVideo from "./utils/reencodeVideo";

const Sandbox = () => {
  const iframeRef = useRef(null);
  const triggerLoad = useRef(false);
  const ffmpegInstance = useRef(null);

  const sendMessage = (message) => {
    iframeRef.current.contentWindow.postMessage(message, "*");
  };

  const loadFfmpeg = async () => {
    sendMessage({ type: "ffmpeg-load-error", fallback: true });
  };

  const toBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
    });
  };

  const onMessage = async (message) => {
    if (message.type === "load-ffmpeg") {
      triggerLoad.current = true;
      loadFfmpeg();
    } else if (message.type === "add-audio-to-video") {
      try {
        const blob = await addAudioToVideo(
          ffmpegInstance.current,
          message.blob,
          message.audio,
          message.duration,
          message.volume,
          message.replaceAudio
        );
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "base64-to-blob") {
      try {
        const blob = await base64ToBlob(ffmpegInstance.current, message.base64);
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "blob-to-array-buffer") {
      try {
        const arrayBuffer = await blobToArrayBuffer(
          ffmpegInstance.current,
          message.blob
        );
        sendMessage({ type: "updated-array-buffer", arrayBuffer: arrayBuffer });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "fetch-file") {
      try {
        const blob = await fetchFile(message.url);
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "generate-thumbstrips") {
      try {
        const blob = await generateThumbstrips(
          ffmpegInstance.current,
          message.blob
        );
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "get-audio") {
      try {
        const blob = await getAudio(ffmpegInstance.current, message.video);
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "get-frame") {
      try {
        const blob = await getFrame(
          ffmpegInstance.current,
          message.blob,
          message.time
        );
        sendMessage({ type: "new-frame", frame: blob });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "has-audio") {
      try {
        const audio = await hasAudio(ffmpegInstance.current, message.video);
        sendMessage({ type: "updated-has-audio", hasAudio: audio });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "mute-video") {
      try {
        const blob = await muteVideo(
          ffmpegInstance.current,
          message.blob,
          message.startTime,
          message.endTime,
          message.duration
        );
        const base64 = await toBase64(blob);
        sendMessage({
          type: "updated-blob",
          base64: base64,
          addToHistory: true,
        });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    } else if (message.type === "reencode-video") {
      try {
        const blob = await reencodeVideo(
          ffmpegInstance.current,
          message.blob,
          message.duration
        );
        const base64 = await toBase64(blob);
        sendMessage({ type: "updated-blob", base64: base64 });
      } catch (error) {
        sendMessage({ type: "ffmpeg-error", error: JSON.stringify(error) });
      }
    }
  };

  useEffect(() => {
    window.addEventListener("message", (event) => {
      onMessage(event.data);
    });

    return () => {
      window.removeEventListener("message", (event) => {
        onMessage(event.data);
      });
    };
  }, []);

  return (
    <div>
      <iframe
        ref={iframeRef}
        src="sandbox.html"
        allowFullScreen={true}
        style={{
          width: "100%",
          border: "none",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      ></iframe>
    </div>
  );
};

export default Sandbox;
