// Drawing App - full implementation (restored)
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const wrap = document.getElementById('wrap');
const colorInput = document.getElementById('color');
const sizeInput = document.getElementById('size');
const sizeVal = document.getElementById('sizeVal');
const toolPen = document.getElementById('tool-pen');
const toolEraser = document.getElementById('tool-eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const clearBtn = document.getElementById('clear');
const saveBtn = document.getElementById('save');
const saveProjectBtn = document.getElementById('save-project');
const loadProjectBtn = document.getElementById('load-project');
const projectFileInput = document.getElementById('project-file');
const restoreAutosaveBtn = document.getElementById('restore-autosave');
const autosaveCheckbox = document.getElementById('autosave');
const smoothCheckbox = document.getElementById('smooth');
const brushSelect = document.getElementById('brush');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let usingEraser = false;
let smoothEnabled = true;
let brushType = 'pen'; // pen | marker | paint | spray | eraser

const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 50;

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = colorInput ? colorInput.value : '#000';
ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 6;

function getPointerPos(e) {
	const rect = canvas.getBoundingClientRect();
	if (e.touches && e.touches.length) {
		return {
			x: (e.touches[0].clientX - rect.left),
			y: (e.touches[0].clientY - rect.top)
		};
	}
	return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function setActiveTool(eraser) {
	usingEraser = eraser;
	if (usingEraser) {
		toolEraser.classList.add('active');
		toolPen.classList.remove('active');
		brushType = 'eraser';
	} else {
		toolPen.classList.add('active');
		toolEraser.classList.remove('active');
		if (brushType === 'eraser') brushType = 'pen';
	}
}

function startDraw(e) {
	if (e instanceof TouchEvent) e.preventDefault();
	isDrawing = true;
	const p = getPointerPos(e);
	lastX = p.x;
	lastY = p.y;
	ctx.beginPath();
	ctx.moveTo(lastX, lastY);
}

function draw(e) {
	if (!isDrawing) return;
	if (e instanceof TouchEvent) e.preventDefault();
	const p = getPointerPos(e);

	ctx.lineWidth = Number(sizeInput.value || 6);

	if (brushType === 'eraser' || usingEraser) {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,1)';
		ctx.strokeStyle = 'rgba(0,0,0,1)';
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(p.x, p.y);
		ctx.stroke();
	} else if (brushType === 'spray') {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = colorInput.value;
		const density = Math.max(10, Math.floor(Number(sizeInput.value) * 2));
		for (let i = 0; i < density; i++) {
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * Number(sizeInput.value);
			const sx = p.x + Math.cos(angle) * radius;
			const sy = p.y + Math.sin(angle) * radius;
			ctx.fillRect(sx, sy, 1.5, 1.5);
		}
	} else if (brushType === 'paint') {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = colorInput.value;
		ctx.globalAlpha = 0.12;
		const r = Math.max(1, Number(sizeInput.value) * 1.5);
		ctx.beginPath();
		ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;
	} else if (brushType === 'marker') {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = colorInput.value;
		ctx.lineWidth = Number(sizeInput.value) * 1.6;
		ctx.globalAlpha = 0.9;
		const jitterX = (Math.random() - 0.5) * (Number(sizeInput.value) * 0.2);
		const jitterY = (Math.random() - 0.5) * (Number(sizeInput.value) * 0.2);
		ctx.beginPath();
		ctx.moveTo(lastX + jitterX, lastY + jitterY);
		ctx.lineTo(p.x + jitterX, p.y + jitterY);
		ctx.stroke();
		ctx.globalAlpha = 1;
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = colorInput.value;
		if (smoothEnabled) {
			const midX = (lastX + p.x) / 2;
			const midY = (lastY + p.y) / 2;
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
			ctx.quadraticCurveTo(lastX, lastY, midX, midY);
			ctx.stroke();
		} else {
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
			ctx.lineTo(p.x, p.y);
			ctx.stroke();
		}
	}

	lastX = p.x; lastY = p.y;
}

function endDraw() {
	if (!isDrawing) return;
	isDrawing = false;
	pushHistory();
}

function pushHistory() {
	try {
		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		undoStack.push(imgData);
		if (undoStack.length > MAX_HISTORY) undoStack.shift();
		redoStack.length = 0;
		if (autosaveCheckbox && autosaveCheckbox.checked) saveAutosaveToLocalStorage();
	} catch (err) {
		console.warn('History push failed', err);
	}
}

function undo() {
	if (undoStack.length <= 1) return;
	const current = undoStack.pop();
	redoStack.push(current);
	const previous = undoStack[undoStack.length - 1];
	if (previous) ctx.putImageData(previous, 0, 0);
}

function redo() {
	if (!redoStack.length) return;
	const imgData = redoStack.pop();
	ctx.putImageData(imgData, 0, 0);
	undoStack.push(imgData);
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	pushHistory();
}

function saveImage() {
	const exportCanvas = document.createElement('canvas');
	exportCanvas.width = canvas.width;
	exportCanvas.height = canvas.height;
	const ectx = exportCanvas.getContext('2d');
	ectx.fillStyle = '#ffffff';
	ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
	ectx.drawImage(canvas, 0, 0);
	const url = exportCanvas.toDataURL('image/png');
	const a = document.createElement('a');
	a.href = url;
	a.download = 'desenho.png';
	a.click();
}

function saveProjectToFile() {
	const exportCanvas = document.createElement('canvas');
	exportCanvas.width = canvas.width;
	exportCanvas.height = canvas.height;
	const ectx = exportCanvas.getContext('2d');
	ectx.fillStyle = '#ffffff';
	ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
	ectx.drawImage(canvas, 0, 0);
	const imageDataUrl = exportCanvas.toDataURL('image/png');
	const project = { width: canvas.width, height: canvas.height, image: imageDataUrl, created: Date.now() };
	const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'desenho.project.json';
	a.click();
}

function loadProjectFromFile(file) {
	const reader = new FileReader();
	reader.onload = () => {
		try {
			const data = JSON.parse(reader.result);
			if (data && data.image) {
				const img = new Image();
				img.onload = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					const ratio = window.devicePixelRatio || 1;
					ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
					pushHistory();
				};
				img.src = data.image;
			}
		} catch (err) {
			console.error('Failed to load project', err);
		}
	};
	reader.readAsText(file);
}

function saveAutosaveToLocalStorage() {
	try {
		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = canvas.width;
		exportCanvas.height = canvas.height;
		const ectx = exportCanvas.getContext('2d');
		ectx.fillStyle = '#ffffff';
		ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
		ectx.drawImage(canvas, 0, 0);
		const imageDataUrl = exportCanvas.toDataURL('image/png');
		const project = { image: imageDataUrl, ts: Date.now() };
		localStorage.setItem('drawing-app-autosave', JSON.stringify(project));
	} catch (err) {
		console.warn('Autosave failed', err);
	}
}

function restoreAutosaveFromLocalStorage() {
	try {
		const raw = localStorage.getItem('drawing-app-autosave');
		if (!raw) return alert('No autosave found');
		const data = JSON.parse(raw);
		if (data && data.image) {
			const img = new Image();
			img.onload = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				const ratio = window.devicePixelRatio || 1;
				ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
				pushHistory();
			};
			img.src = data.image;
		}
	} catch (err) {
		console.warn('Restore autosave failed', err);
	}
}

function setCanvasSize() {
	const data = canvas.toDataURL();
	const ratio = window.devicePixelRatio || 1;
	const rect = canvas.parentElement.getBoundingClientRect();
	canvas.width = Math.max(1, Math.floor(rect.width * ratio));
	canvas.height = Math.max(1, Math.floor(rect.height * ratio));
	canvas.style.width = rect.width + 'px';
	canvas.style.height = rect.height + 'px';
	ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
	const img = new Image();
	img.onload = () => ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
	img.src = data;
}

// Event wiring
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseout', endDraw);

canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', (e) => { if (e) e.preventDefault(); endDraw(); });

colorInput && colorInput.addEventListener('input', () => { if (!usingEraser) ctx.strokeStyle = colorInput.value; });
sizeInput && sizeInput.addEventListener('input', () => { ctx.lineWidth = Number(sizeInput.value); sizeVal.textContent = sizeInput.value; });

toolPen && toolPen.addEventListener('click', () => setActiveTool(false));
toolEraser && toolEraser.addEventListener('click', () => setActiveTool(true));

brushSelect && brushSelect.addEventListener('change', (e) => {
	brushType = e.target.value;
	if (brushType === 'eraser') setActiveTool(true); else setActiveTool(false);
});

undoBtn && undoBtn.addEventListener('click', undo);
redoBtn && redoBtn.addEventListener('click', redo);
clearBtn && clearBtn.addEventListener('click', clearCanvas);
saveBtn && saveBtn.addEventListener('click', saveImage);
saveProjectBtn && saveProjectBtn.addEventListener('click', saveProjectToFile);
loadProjectBtn && loadProjectBtn.addEventListener('click', () => projectFileInput.click());
projectFileInput && projectFileInput.addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) loadProjectFromFile(e.target.files[0]); });
restoreAutosaveBtn && restoreAutosaveBtn.addEventListener('click', restoreAutosaveFromLocalStorage);

smoothCheckbox && smoothCheckbox.addEventListener('change', () => { smoothEnabled = !!smoothCheckbox.checked; });

window.addEventListener('keydown', (e) => {
	if (e.ctrlKey && e.key.toLowerCase() === 'z') {
		e.preventDefault();
		if (e.shiftKey) redo(); else undo();
	}
	if (e.ctrlKey && e.key.toLowerCase() === 's') {
		e.preventDefault();
		saveImage();
	}
	if (e.ctrlKey && e.key.toLowerCase() === 'k') {
		e.preventDefault();
		clearCanvas();
	}
	if (e.key.toLowerCase() === 'p') setActiveTool(false);
	if (e.key.toLowerCase() === 'e') setActiveTool(true);
});

// ResizeObserver to keep canvas sized to its parent
const ro = new ResizeObserver(() => setCanvasSize());
ro.observe(canvas.parentElement);

// Initialize
setActiveTool(false);
setCanvasSize();
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
pushHistory();
