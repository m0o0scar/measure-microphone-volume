/**
 * Callback for measure microphone volume
 * @callback MeasureMicrophoneVolumeCallback
 * @param {object} volume
 * @param {number} volume.value - the current volume value
 * @param {number} volume.avg - the average volume value
 */

/**
 * @typedef {object} MeasureMicrophoneVolumeOptions
 * @property {number} [avgDuration=2000] - the average volume value
 * @property {number} [amplify=10]
 */

/**
 * Measures the volume of audio captured from the user's microphone.
 * @param {MeasureMicrophoneVolumeCallback} callback
 * @param {MeasureMicrophoneVolumeOptions} [options]
 * @see {@link https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/}
 */
export async function measureMicrophoneVolume(callback, options) {
  const { avgDuration = 2000, amplify = 10 } = options || {};

  // get the microphone stream
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  // use the Web Audio API to create an audio context and connect it to the microphone stream.
  const audioContext = new AudioContext();
  const mediaStreamAudioSourceNode =
    audioContext.createMediaStreamSource(stream);

  // use an analyser node to analyze the audio data and calculate the volume.
  const analyserNode = audioContext.createAnalyser();
  mediaStreamAudioSourceNode.connect(analyserNode);

  const pcmData = new Float32Array(analyserNode.fftSize);

  let volumes = [];

  /**
   * @param {number} timestamp
   */
  const onFrame = (timestamp) => {
    analyserNode.getFloatTimeDomainData(pcmData);

    // calculate volume
    let sumSquares = 0.0;
    for (const amplitude of pcmData) {
      sumSquares += amplitude * amplitude;
    }
    const volume = Math.sqrt(sumSquares / pcmData.length) * amplify;

    // update avg volume
    volumes = [
      ...volumes.filter((v) => timestamp - v.timestamp < avgDuration),
      { volume, timestamp },
    ];
    const avgVolume =
      volumes.reduce((a, b) => a + b.volume, 0) / volumes.length;

    callback({ value: volume, avg: avgVolume });
    window.requestAnimationFrame(onFrame);
  };

  window.requestAnimationFrame(onFrame);
}
