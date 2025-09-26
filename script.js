// Character mapping
const MAPPING = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'd', 'e', 'f', 'g', 'h', 'n', 'q', 'r', 't'
];

// DOM elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clear-button');
const brushSlider = document.getElementById('brush-slider');
const resultSpan = document.getElementById('result');
const statusSpan = document.getElementById('status');
const predictionsContainer = document.getElementById('predictions-container');

// State
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let hasDrawn = false;
let predictionTimeout;
let brushSize = 16;

// Initialize canvas
function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resultSpan.innerHTML = '<span class="empty-state">?</span>';
    statusSpan.textContent = 'Ready to recognize';
    hasDrawn = false;
    clearTimeout(predictionTimeout);
    
    // Reset top 3 predictions
    const items = predictionsContainer.querySelectorAll('.prediction-item');
    items.forEach((item, index) => {
        const charSpan = item.querySelector('.prediction-char');
        const confidence = item.querySelector('.prediction-confidence');
        charSpan.textContent = '-';
        confidence.textContent = '0%';
        item.style.background = '#FEFEFE';
    });
}

// Drawing functions
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPosition(e);
    [lastX, lastY] = [pos.x, pos.y];
    statusSpan.textContent = 'Drawing...';
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPosition(e);
    
    ctx.strokeStyle = '#2D2D2D';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    [lastX, lastY] = [pos.x, pos.y];
    hasDrawn = true;

    // Auto-predict with debouncing
    clearTimeout(predictionTimeout);
    predictionTimeout = setTimeout(predict, 400);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        if (hasDrawn) {
            clearTimeout(predictionTimeout);
            predictionTimeout = setTimeout(predict, 200);
        }
    }
}

// Check if canvas is blank
function isCanvasBlank() {
    if (!hasDrawn) return true;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let nonWhitePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) {
            nonWhitePixels++;
        }
    }
    
    return nonWhitePixels < 30;
}

// Prediction function
async function predict() {
    if (isCanvasBlank()) {
        resultSpan.innerHTML = '<span class="empty-state">?</span>';
        statusSpan.textContent = 'Ready to recognize';
        
        // Reset top 3 predictions
        const items = predictionsContainer.querySelectorAll('.prediction-item');
        items.forEach((item, index) => {
            const charSpan = item.querySelector('.prediction-char');
            const confidence = item.querySelector('.prediction-confidence');
            charSpan.textContent = '-';
            confidence.textContent = '0%';
            item.style.background = '#FEFEFE';
        });
        return;
    }

    resultSpan.innerHTML = '<div class="loading">⟳</div>';
    statusSpan.textContent = 'Analyzing...';

    try {
        // Preprocessing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, 28, 28);
        tempCtx.drawImage(canvas, 0, 0, 28, 28);
        
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const data = imageData.data;
        const inputData = new Float32Array(28 * 28);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = (r + g + b) / 3;
            inputData[i / 4] = (255 - gray) / 255;
        }

        const inputTensor = new ort.Tensor('float32', inputData, [1, 28, 28, 1]);
        
        // Run model
        const session = await ort.InferenceSession.create('./model.onnx');
        const inputName = session.inputNames[0];
        const feeds = { [inputName]: inputTensor };
        const results = await session.run(feeds);
        const outputName = session.outputNames[0];
        const outputData = Array.from(results[outputName].data);
        
        // Get top 3 predictions
        const predictions = outputData
            .map((confidence, index) => ({ char: MAPPING[index], confidence }))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);

        const topPrediction = predictions[0];
        
        // Update main result
        resultSpan.textContent = topPrediction.char;
        statusSpan.textContent = `${(topPrediction.confidence * 100).toFixed(1)}% confident`;
        
        // Update top 3 prediction items
        const items = predictionsContainer.querySelectorAll('.prediction-item');
        items.forEach((item, index) => {
            const charSpan = item.querySelector('.prediction-char');
            const confidenceSpan = item.querySelector('.prediction-confidence');
            
            if (predictions[index]) {
                const prediction = predictions[index];
                const percentage = (prediction.confidence * 100).toFixed(1);
                
                charSpan.textContent = prediction.char;
                confidenceSpan.textContent = `${percentage}%`;
                
                // Highlight top prediction
                if (index === 0) {
                    item.style.background = '#ABC4AA';
                } else {
                    item.style.background = '#FEFEFE';
                }
            } else {
                charSpan.textContent = '-';
                confidenceSpan.textContent = '0%';
                item.style.background = '#FEFEFE';
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        resultSpan.textContent = 'ERR';
        statusSpan.textContent = 'Recognition failed';
    }
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

clearButton.addEventListener('click', clearCanvas);

brushSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
});

// Initialize
clearCanvas();