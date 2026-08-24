const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContextClass();

const strings = [...document.querySelectorAll('.string')];
const chordButtons = [...document.querySelectorAll('.chord')];
const songButtons = [...document.querySelectorAll('.song-btn')];

const chordMap = {
  C: [2, 1, 0],
  G: [0, 1, 2],
  D: [1, 0, 2]
};

const tuneKeyMap = {
  q: 261.63,
  w: 293.66,
  e: 329.63,
  r: 349.23,
  t: 392.0,
  y: 440.0
};

const songs = {
  twinkle: [
    [261.63, 320], [261.63, 320], [392.0, 320], [392.0, 320], [440.0, 320], [440.0, 320], [392.0, 520],
    [349.23, 320], [349.23, 320], [329.63, 320], [329.63, 320], [293.66, 320], [293.66, 320], [261.63, 560]
  ],
  happy: [
    [293.66, 240], [293.66, 240], [329.63, 440], [293.66, 440], [392.0, 440], [369.99, 760],
    [293.66, 240], [293.66, 240], [329.63, 440], [293.66, 440], [440.0, 440], [392.0, 760]
  ],
  calm: [
    [261.63, 320], [293.66, 320], [329.63, 320], [392.0, 460], [329.63, 320], [293.66, 320], [261.63, 520]
  ]
};

function createPluck(frequency, time = audioContext.currentTime, duration = 1.1) {
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, time);

  const oscA = audioContext.createOscillator();
  const oscB = audioContext.createOscillator();

  oscA.type = 'triangle';
  oscB.type = 'sine';

  oscA.frequency.setValueAtTime(frequency, time);
  oscB.frequency.setValueAtTime(frequency * 1.003, time);

  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.exponentialRampToValueAtTime(0.22, time + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscA.start(time);
  oscB.start(time);
  oscA.stop(time + duration + 0.05);
  oscB.stop(time + duration + 0.05);
}

function animateString(button) {
  button.classList.remove('playing');
  void button.offsetWidth;
  button.classList.add('playing');
  setTimeout(() => button.classList.remove('playing'), 650);
}

function playString(button, delay = 0) {
  const run = () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const frequency = Number(button.dataset.freq);
    createPluck(frequency);
    animateString(button);
  };

  if (delay > 0) {
    setTimeout(run, delay);
  } else {
    run();
  }
}

function playChord(chordName) {
  const pattern = chordMap[chordName] || [];
  pattern.forEach((stringIndex, index) => {
    const button = strings[stringIndex];
    if (button) {
      playString(button, index * 70);
    }
  });
}

function playMelody(notes) {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  let stepDelay = 0;
  notes.forEach(([frequency, duration]) => {
    setTimeout(() => {
      createPluck(frequency, audioContext.currentTime, Math.max(0.5, duration / 900));
    }, stepDelay);
    stepDelay += duration;
  });
}

strings.forEach((button) => {
  button.addEventListener('click', () => playString(button));
});

chordButtons.forEach((button) => {
  button.addEventListener('click', () => playChord(button.dataset.chord));
});

songButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const songName = button.dataset.song;
    const notes = songs[songName];
    if (notes) {
      playMelody(notes);
    }
  });
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  const key = event.key.toLowerCase();

  const keyToStringIndex = {
    '1': 0,
    '2': 1,
    '3': 2,
    a: 0,
    s: 1,
    d: 2
  };

  if (key in keyToStringIndex) {
    const selectedString = strings[keyToStringIndex[key]];
    if (selectedString) {
      playString(selectedString);
    }
    return;
  }

  if (key === 'j') {
    playChord('C');
    return;
  }

  if (key === 'k') {
    playChord('G');
    return;
  }

  if (key === 'l') {
    playChord('D');
    return;
  }

  if (key === 'c' || key === 'g' || key === 'd') {
    playChord(key.toUpperCase());
    return;
  }

  if (key in tuneKeyMap) {
    createPluck(tuneKeyMap[key]);
    return;
  }

  if (key === 'z') {
    playMelody(songs.twinkle);
    return;
  }

  if (key === 'x') {
    playMelody(songs.happy);
    return;
  }

  if (key === 'n') {
    playMelody(songs.calm);
  }
});
