const canvas = document.getElementById('selectionCanvas');
const infoDiv = document.getElementById('info');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isDrawing = false;
let startX, startY, rect = {};

// Draw a semi-transparent overlay
ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Tell the main process that the UI is ready for interaction
window.api.setupReady();

// Load previously saved coordinates and draw them
window.api.onLoadCoords((coords) => {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)'; // Green for saved area
    ctx.lineWidth = 2;
    ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
});

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    infoDiv.style.display = 'none'; // Hide info text on draw
    startX = e.clientX;
    startY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    // Clear canvas and redraw overlay + saved rect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.api.onLoadCoords((coords) => {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
    });

    // Draw the new selection rectangle
    rect.x = Math.min(e.clientX, startX);
    rect.y = Math.min(e.clientY, startY);
    rect.width = Math.abs(e.clientX - startX);
    rect.height = Math.abs(e.clientY - startY);
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
});

canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    isDrawing = false;
    if (rect.width > 10 && rect.height > 10) {
        // Send the final coordinates to the main process
        window.api.saveCoords(rect);
    } else {
        // If selection is too small, just close without saving
        window.api.closeSetup();
    }
});

// Allow closing the setup window with the Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.api.closeSetup();
    }
});