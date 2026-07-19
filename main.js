import './style.css';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

let items = [
  'Ali', 
  'Beatriz', 
  'Charles', 
  'Diya', 
  'Eric', 
  'Fatima'
];
let currentRotation = 0;
let isSpinning = false;
let winningIndex = -1;

const wheelColors = [
  '#3369E8', '#D50F25', '#EEB211', '#009925', 
  '#FF7E00', '#8A2BE2', '#FF007F', '#00BCD4'
];
const textColor = '#ffffff';

const wheelSvg = document.getElementById('wheel');
const itemsInput = document.getElementById('items-input');
const entryCount = document.getElementById('entry-count');
const spinCenterBtn = document.getElementById('spin-center-btn');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const closeModalBtn = document.getElementById('close-modal');
const removeWinnerBtn = document.getElementById('remove-winner-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeToggleText = document.querySelector('.nav-btn-text');
const shuffleBtn = document.getElementById('shuffle-btn');
const sortBtn = document.getElementById('sort-btn');

function drawWheel() {
  wheelSvg.innerHTML = '';
  const n = items.length;
  if (n === 0) {
    const emptyCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    emptyCircle.setAttribute('cx', '250');
    emptyCircle.setAttribute('cy', '250');
    emptyCircle.setAttribute('r', '245');
    emptyCircle.setAttribute('fill', '#e0e0e0');
    wheelSvg.appendChild(emptyCircle);
    return;
  }
  
  const wheelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  wheelGroup.setAttribute('id', 'wheel-group');
  gsap.set(wheelGroup, { rotation: currentRotation, svgOrigin: "250 250" });
  
  const anglePerSlice = 360 / n;
  const cx = 250;
  const cy = 250;
  const r = 245;

  items.forEach((item, i) => {
    const startAngle = i * anglePerSlice;
    const endAngle = (i + 1) * anglePerSlice;
    
    const getCoordinatesForAngle = (angle) => {
      const angleInRadians = angle * Math.PI / 180.0;
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
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => spin(i));
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', pathData);
    path.setAttribute('fill', wheelColors[i % wheelColors.length]);
    path.setAttribute('stroke', '#ffffff');
    path.setAttribute('stroke-width', '2');
    
    const isDark = document.body.classList.contains('dark-mode');
    path.setAttribute('stroke', isDark ? '#202124' : '#ffffff');

    g.appendChild(path);

    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = r * 0.6; 
    const textAngleRad = textAngle * Math.PI / 180.0;
    const tx = cx + (textRadius * Math.cos(textAngleRad));
    const ty = cy + (textRadius * Math.sin(textAngleRad));

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', tx);
    text.setAttribute('y', ty);
    text.setAttribute('fill', textColor);
    text.setAttribute('font-size', n > 20 ? '12' : n > 10 ? '16' : '22');
    text.setAttribute('font-family', 'Roboto, sans-serif');
    text.setAttribute('font-weight', '500');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.style.pointerEvents = 'none';
    
    let rot = textAngle;
    if (textAngle > 90 && textAngle < 270) {
      rot += 180;
    }
    
    if (n > 1) {
      text.setAttribute('transform', `rotate(${rot}, ${tx}, ${ty})`);
    }
    
    let displayItem = item;
    if (displayItem.length > 15) displayItem = displayItem.substring(0, 15) + '...';
    text.textContent = displayItem;

    g.appendChild(text);
    wheelGroup.appendChild(g);
  });
  
  wheelSvg.appendChild(wheelGroup);
}

function spin(forcedIndex = -1) {
  if (isSpinning || items.length === 0) return;
  isSpinning = true;

  const n = items.length;
  winningIndex = (typeof forcedIndex === 'number' && forcedIndex >= 0 && forcedIndex < n) 
    ? forcedIndex 
    : Math.floor(Math.random() * n);
  
  const anglePerSlice = 360 / n;
  const randomOffset = (Math.random() * 0.8 + 0.1) * anglePerSlice; 
  const targetAngle = winningIndex * anglePerSlice + randomOffset;
  
  const currentMod = currentRotation % 360;
  let targetMod = 360 - targetAngle;
  if (targetMod === 360) targetMod = 0;
  
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  
  const extraSpins = 8 + Math.floor(Math.random() * 3);
  delta += 360 * extraSpins;

  const newRotation = currentRotation + delta;

  gsap.to(wheelSvg.querySelector('#wheel-group'), {
    rotation: newRotation,
    svgOrigin: "250 250",
    duration: 6,
    ease: "power3.out",
    onComplete: () => {
      currentRotation = newRotation;
      isSpinning = false;
      showWinner(items[winningIndex]);
    }
  });
}

spinCenterBtn.addEventListener('click', () => spin());

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body && !winnerModal.classList.contains('visible')) {
    e.preventDefault();
    spin();
  }
});

const confettiCanvas = document.getElementById('confetti-canvas');
const modalConfetti = confetti.create(confettiCanvas, {
  resize: true,
  useWorker: true
});

function showWinner(item) {
  winnerText.textContent = `We have a winner!\n${item}`;
  winnerModal.classList.add('visible');
  closeModalBtn.focus();
  
  modalConfetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: wheelColors
  });
}

function updateItemsFromInput() {
  const val = itemsInput.value;
  const newItems = val.split('\n').map(v => v.trim()).filter(v => v.length > 0);
  items = newItems;
  entryCount.textContent = items.length;
  currentRotation = 0;
  const group = wheelSvg.querySelector('#wheel-group');
  if (group) {
    gsap.to(group, { rotation: 0, svgOrigin: "250 250", duration: 0.3 });
  }
  setTimeout(drawWheel, 300);
}

itemsInput.addEventListener('input', updateItemsFromInput);

shuffleBtn.addEventListener('click', () => {
  if (items.length <= 1) return;
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  itemsInput.value = items.join('\n');
  updateItemsFromInput();
});

sortBtn.addEventListener('click', () => {
  items.sort((a, b) => a.localeCompare(b));
  itemsInput.value = items.join('\n');
  updateItemsFromInput();
});

closeModalBtn.addEventListener('click', () => {
  winnerModal.classList.remove('visible');
});

removeWinnerBtn.addEventListener('click', () => {
  winnerModal.classList.remove('visible');
  if (winningIndex >= 0 && winningIndex < items.length) {
    items.splice(winningIndex, 1);
    itemsInput.value = items.join('\n');
    updateItemsFromInput();
  }
});

winnerModal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') winnerModal.classList.remove('visible');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  themeToggleText.textContent = isDark ? 'Light' : 'Dark';
  
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  drawWheel();
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggleText.textContent = 'Light';
} else if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark-mode');
  themeToggleText.textContent = 'Light';
}

itemsInput.value = items.join('\n');
entryCount.textContent = items.length;
drawWheel();

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 200);
});
