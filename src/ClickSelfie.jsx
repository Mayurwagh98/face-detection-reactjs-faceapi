import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function ClickSelfie() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (isCameraOn) {
      startVideo();
      loadModels();
    }
  }, [isCameraOn]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      faceMyDetect();
    });
  };

  const faceMyDetect = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        setIsFaceDetected(true);
      } else {
        setIsFaceDetected(false);
      }

      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      faceapi.matchDimensions(canvas, {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });

      const resized = faceapi.resizeResults(detections, {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceExpressions(canvas, resized);

      canvasRef.current.innerHTML = "";
      canvasRef.current.append(canvas);
    }, 1000);

    return () => clearInterval(interval);
  };

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/png"));
  };

  return (
    <div className="myapp">
      <h1>Face Detection</h1>
      {!isCameraOn ? (
        <button onClick={() => setIsCameraOn(true)}>Start Camera</button>
      ) : (
        <>
          {!capturedImage ? (
            <div>
              <video
                crossOrigin="anonymous"
                ref={videoRef}
                autoPlay
                muted
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  top: 100,
                  left: 0,
                  right: 80,
                  textAlign: "center",
                  zIndex: 0,
                  width: 640,
                  height: 480,
                }}
              ></video>
              <div
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  top: 100,
                  left: 0,
                  right: 80,
                  textAlign: "center",
                  zIndex: 9,
                  width: 640,
                  height: 480,
                }}
                ref={canvasRef}
              />
            </div>
          ) : (
            <div>
              <h2>Captured Image</h2>
              <img src={capturedImage} alt="Captured" />
            </div>
          )}

          {isFaceDetected && (
            <button onClick={captureImage}>Capture Image</button>
          )}
        </>
      )}
    </div>
  );
}

export default ClickSelfie;
