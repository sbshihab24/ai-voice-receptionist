let pc;
let dc;
let localStream;
let remoteAudio;

function setButtons(isInCall) {
  const startBtn = document.getElementById("startBtn");
  const endBtn = document.getElementById("endBtn");

  if (startBtn) startBtn.disabled = isInCall;
  if (endBtn) endBtn.disabled = !isInCall;
}

function setStatus(message, state = "idle") {
  const el = document.getElementById("status");
  if (el) {
    el.textContent = message;
    el.dataset.state = state;
  }
}

function sendEvent(event) {
  if (dc && dc.readyState === "open") {
    dc.send(JSON.stringify(event));
  }
}

async function startCall() {
  try {
    setButtons(true);
    setStatus("Connecting to voice session...", "connecting");

    const res = await fetch("http://localhost:8000/session");
    if (!res.ok) {
      throw new Error(`Session API failed: ${res.status}`);
    }
    const data = await res.json();

    const token = data?.client_secret?.value;
    const model = data?.model || "gpt-4o-realtime-preview";
    if (!token) {
      throw new Error("Missing client_secret token from /session");
    }

    pc = new RTCPeerConnection();

    remoteAudio = document.createElement("audio");
    remoteAudio.autoplay = true;
    const audioMount = document.getElementById("audioMount");
    if (audioMount) {
      audioMount.appendChild(remoteAudio);
    } else {
      document.body.appendChild(remoteAudio);
    }

    pc.ontrack = (e) => {
      remoteAudio.srcObject = e.streams[0];
    };

    dc = pc.createDataChannel("oai-events");

    dc.onopen = () => {
      setStatus("Connected. Listening...", "live");
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "response.done") {
          setStatus("Listening... Speak now.", "live");
        }
      } catch {
        // Ignore non-JSON events.
      }
    };

    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const answerRes = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!answerRes.ok) {
      throw new Error(`Realtime SDP failed: ${answerRes.status}`);
    }

    const answer = {
      type: "answer",
      sdp: await answerRes.text()
    };

    await pc.setRemoteDescription(answer);
  } catch (error) {
    setButtons(false);
    setStatus(`Error: ${error.message}`, "error");
  }
}

function endCall() {
  if (dc) {
    dc.close();
    dc = null;
  }

  if (pc) {
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteAudio) {
    remoteAudio.srcObject = null;
    remoteAudio.remove();
    remoteAudio = null;
  }

  setButtons(false);
  setStatus("Call ended.", "idle");
}

setButtons(false);