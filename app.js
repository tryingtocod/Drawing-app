const canvas = document.getElementById('canvas');
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', endDraw);


canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', endDraw);


colorInput.addEventListener('input', () => {
if (!usingEraser) ctx.strokeStyle = colorInput.value;
});
sizeInput.addEventListener('input', () => {
ctx.lineWidth = Number(sizeInput.value);
sizeVal.textContent = sizeInput.value;
});


toolPen.addEventListener('click', () => setActiveTool(false));
toolEraser.addEventListener('click', () => setActiveTool(true));


undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);


clearBtn.addEventListener('click', () => {
ctx.clearRect(0, 0, canvas.width, canvas.height);
fillWhiteBackground();
pushHistory();
});


saveBtn.addEventListener('click', () => {
const exportCanvas = document.createElement('canvas');
exportCanvas.width = canvas.width;
exportCanvas.height = canvas.height;
const ectx = exportCanvas.getContext('2d');
ectx.fillStyle = '#ffffff';
ectx.fillRect(0,0,exportCanvas.width, exportCanvas.height);
ectx.drawImage(canvas, 0, 0);
const url = exportCanvas.toDataURL('image/png');
const a = document.createElement('a');
a.href = url;
a.download = 'desenho.png';
a.click();
});


window.addEventListener('keydown', (e) => {
if (e.ctrlKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
if (e.shiftKey) redo(); else undo();
}
if (e.ctrlKey && e.key.toLowerCase() === 's') {
e.preventDefault();
saveBtn.click();
}
if (e.ctrlKey && e.key.toLowerCase() === 'k') {
e.preventDefault();
clearBtn.click();
}
if (e.key.toLowerCase() === 'p') setActiveTool(false);
if (e.key.toLowerCase() === 'e') setActiveTool(true);
});


const ro = new ResizeObserver(() => setCanvasSize());
ro.observe(wrap);


setActiveTool(false);
setCanvasSize();