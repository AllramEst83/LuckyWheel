import './style.css';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

let items = ['Candy', 'Toy', 'Free Spin', 'Sticker', 'Balloon', 'Coupon'];
let currentRotation = 0;
let isSpinning = false;

const themes = {
  carnival: {
    slices: ['#ff4b4b', '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
    text: '#1a252f'
  },
  'pastel-ocean': {
    slices: ['#b2ebf2', '#80deea', '#4dd0e1', '#26c6da', '#00bcd4', '#00acc1'],
    text: '#004d40'
  },
  space: {
    slices: ['#c026d3', '#db2777', '#9333ea', '#4f46e5', '#2563eb', '#0ea5e9'],
    text: '#ffffff'
  }
};
let currentTheme = 'carnival';

// DOM Elements
const wheelSvg = document.getElementById('wheel');
const itemsInput = document.getElementById('items-input');
const updateBtn = document.getElementById('update-btn');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const closeModalBtn = document.getElementById('close-modal');
const themeBtns = document.querySelectorAll('.theme-btn');

function drawWheel() {
  wheelSvg.innerHTML = '';
  const n = items.length;
  if (n === 0) return;
  
  const wheelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wheelGroup.setAttribute('id', 'wheel-group');
  gsap.set(wheelGroup, { rotation: currentRotation, svgOrigin: "250 250" });
  
  const anglePerSlice = 360 / n;
  const cx = 250;
  const cy = 250;
  const r = 245;
  
  const palette = themes[currentTheme].slices;
  const textColor = themes[currentTheme].text;

  items.forEach((item, i) => {
    const startAngle = i * anglePerSlice;
    const endAngle = (i + 1) * anglePerSlice;
    
    const getCoordinatesForAngle = (angle) => {
      const angleInRadians = (angle - 90) * Math.PI / 180.0;
      return {
        x: cx + (r * Math.cos(angleInRadians)),
        y: cy + (r * Math.sin(angleInRadians))
      };
    };

    const start = getCoordinatesForAngle(startAngle);
    const end = getCoordinatesForAngle(endAngle);
    
    let pathData = '';
    if (n === 1) {
      pathData = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    } else {
      const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
      pathData = [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
        'Z'
      ].join(' ');
    }

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.classList.add('slice');
    
    // Accessibility
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', `Spin to win ${item}`);
    
    g.addEventListener('click', () => spinTo(i));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        spinTo(i);
      }
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', pathData);
    path.setAttribute('fill', palette[i % palette.length]);
    // Set a subtle border to match the theme background if needed, or white/dark
    path.setAttribute('stroke', currentTheme === 'space' ? '#0f172a' : '#ffffff');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('stroke-linejoin', 'round');
    
    g.appendChild(path);

    // Text
    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = r * 0.65; 
    const textAngleRad = (textAngle - 90) * Math.PI / 180.0;
    const tx = cx + (textRadius * Math.cos(textAngleRad));
    const ty = cy + (textRadius * Math.sin(textAngleRad));

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', tx);
    text.setAttribute('y', ty);
    text.setAttribute('fill', textColor);
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', '800');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.style.pointerEvents = 'none';
    
    let rot = textAngle;
    if (textAngle > 90 && textAngle < 270) {
      rot += 180;
    }
    
    if (n > 1) {
      text.setAttribute('transform', `rotate(${textAngle - 90}, ${tx}, ${ty})`);
    }
    text.textContent = item;

    g.appendChild(text);
    wheelGroup.appendChild(g);
  });
  
  wheelSvg.appendChild(wheelGroup);
}

function spinTo(targetIndex) {
  if (isSpinning) return;
  isSpinning = true;

  const n = items.length;
  const anglePerSlice = 360 / n;
  
  // Add a random offset within the slice so it doesn't always land in the exact center
  const padding = anglePerSlice * 0.15; // 15% padding from the edges
  const randomOffset = padding + (Math.random() * (anglePerSlice - 2 * padding));
  const sliceTargetAngle = targetIndex * anglePerSlice + randomOffset;
  
  const currentMod = currentRotation % 360;
  let targetMod = 360 - sliceTargetAngle;
  
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  
  // Visual effect: 5-8 extra spins
  const extraSpins = Math.floor(Math.random() * 4) + 5;
  delta += 360 * extraSpins;

  const newRotation = currentRotation + delta;

  gsap.to(wheelSvg.querySelector('#wheel-group'), {
    rotation: newRotation,
    svgOrigin: "250 250",
    duration: 5.5,
    ease: "power4.out",
    onComplete: () => {
      currentRotation = newRotation;
      isSpinning = false;
      showWinner(items[targetIndex]);
    }
  });
}

function showWinner(item) {
  winnerText.textContent = `Yay! You won: ${item}`;
  winnerModal.classList.add('visible');
  closeModalBtn.focus();
  
  const palette = themes[currentTheme].slices;
  
  // 1. Massive center burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: palette,
    zIndex: 2147483647
  });

  // 2. Left cannon burst shortly after
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.8 },
      colors: palette,
      zIndex: 2147483647
    });
  }, 250);

  // 3. Right cannon burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.8 },
      colors: palette,
      zIndex: 2147483647
    });
  }, 450);
}

const themePicker = document.getElementById('theme-picker');
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
  themePicker.classList.toggle('expanded');
});

// Close picker when clicking outside
document.addEventListener('click', (e) => {
  if (!themePicker.contains(e.target)) {
    themePicker.classList.remove('expanded');
  }
});

// Theme handling
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    themeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentTheme = btn.dataset.theme;
    document.body.className = currentTheme === 'carnival' ? '' : `theme-${currentTheme}`;
    
    themeToggle.innerHTML = btn.innerHTML; // update toggle button text
    themePicker.classList.remove('expanded'); // close dropdown on mobile
    
    drawWheel(); // redraw with new colors
  });
});

closeModalBtn.addEventListener('click', () => {
  winnerModal.classList.remove('visible');
});

winnerModal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    winnerModal.classList.remove('visible');
  }
});

updateBtn.addEventListener('click', () => {
  const val = itemsInput.value.trim();
  if (val) {
    items = val.split('\n').map(v => v.trim()).filter(v => v.length > 0);
    currentRotation = 0;
    const group = wheelSvg.querySelector('#wheel-group');
    if (group) gsap.to(group, { rotation: 0, svgOrigin: "250 250", duration: 0.5, ease: "power2.inOut" });
    setTimeout(() => drawWheel(), 500);
  }
});

// Initialization
itemsInput.value = items.join('\n');
drawWheel();

window.addEventListener('load', () => {
  // Add a tiny delay to ensure everything is visually ready and the animation looks intentional
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 400);
});
