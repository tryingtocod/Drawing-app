// Drawing App - full implementation
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

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let usingEraser = false;
let smoothEnabled = true;

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
	if (usingEraser) {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.strokeStyle = 'rgba(0,0,0,1)';
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = colorInput.value;
	}
	ctx.lineWidth = Number(sizeInput.value);
	// draw with optional smoothing
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
	lastX = p.x; lastY = p.y;
}

function endDraw() {
	if (!isDrawing) return;
	isDrawing = false;
	pushHistory();
}

function fillWhiteBackground() {
	// draw white background behind existing content
	const img = new Image();
	img.onload = () => {
		ctx.save();
		ctx.globalCompositeOperation = 'destination-over';
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		ctx.restore();
	};
	img.src = canvas.toDataURL();
}

function pushHistory() {
	try {
		const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		undoStack.push(imgData);
		if (undoStack.length > MAX_HISTORY) undoStack.shift();
		// new action clears redo
		redoStack.length = 0;
		// autosave to localStorage if enabled
		if (autosaveCheckbox && autosaveCheckbox.checked) saveAutosaveToLocalStorage();
	} catch (err) {
		console.warn('History push failed', err);
	}
}

function restoreFromDataURL(url) {
	const img = new Image();
	img.onload = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// draw image scaled to canvas CSS size (canvas.width is pixel scaled)
		const ratio = window.devicePixelRatio || 1;
		ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
	};
	img.src = url;
}

function undo() {
	if (undoStack.length <= 1) return; // keep at least initial state
	const current = undoStack.pop();
	redoStack.push(current);
	const previous = undoStack[undoStack.length - 1];
	if (previous) {
		ctx.putImageData(previous, 0, 0);
	}
}

function redo() {
	if (!redoStack.length) return;
	const imgData = redoStack.pop();
	ctx.putImageData(imgData, 0, 0);
	undoStack.push(imgData);
}

function clearCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// fill white background so exports have a white bg
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
