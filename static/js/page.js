let canvas, ctx;
let animationSpeed = 500; // Default speed (5x)
let isPlaying = true;
let currentStep = 0;
let animationFrame;
let animationSteps = [];
let pageSequence = [];
let frameCount = 3;

// Initialize canvas when the page loads
window.onload = function() {
    canvas = document.getElementById('visualization-canvas');
    ctx = canvas.getContext('2d');
    adjustCanvasSize();
    window.addEventListener('resize', adjustCanvasSize);
    
    // Initialize event listeners
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
    document.getElementById('reset-btn').addEventListener('click', resetAnimation);
    document.getElementById('animation-speed').addEventListener('input', function(e) {
        setAnimationSpeed(parseInt(e.target.value));
        document.getElementById('speed-value').textContent = e.target.value + 'x';
    });
};

function adjustCanvasSize() {
    const container = document.querySelector('.visualization-container');
    const minWidth = 800;
    const minHeight = 400;
    
    // Calculate required width based on reference string length
    const cellWidth = 60;
    const requiredWidth = Math.max(minWidth, pageSequence.length * cellWidth + 200);
    
    // Set canvas width with scrollable container
    canvas.width = requiredWidth;
    container.style.overflowX = requiredWidth > container.clientWidth ? 'auto' : 'hidden';
    
    // Calculate required height based on frame count
    const rowHeight = 60;
    const requiredHeight = Math.max(minHeight, (frameCount + 2) * rowHeight + 100);
    canvas.height = requiredHeight;
}

function setAnimationSpeed(value) {
    // Map slider value (1-10) to speed (2000ms to 200ms)
    animationSpeed = 2000 - (value * 180);
}

function runVisualization() {
    frameCount = parseInt(document.getElementById('frame-count').value);
    pageSequence = document.getElementById('page-sequence').value
        .split(',')
        .map(p => parseInt(p.trim()))
        .filter(p => !isNaN(p));
    
    if (pageSequence.length === 0) {
        alert('Please enter a valid page sequence');
        return;
    }
    
    adjustCanvasSize();
    const algorithm = document.getElementById('algorithm-select').value;
    
    currentStep = 0;
    isPlaying = true;
    document.getElementById('play-pause-btn').textContent = 'Pause';
    
    switch (algorithm) {
        case 'fifo':
            visualizeFIFO(pageSequence, frameCount);
            break;
        case 'lru':
            visualizeLRU(pageSequence, frameCount);
            break;
        case 'optimal':
            visualizeOptimal(pageSequence, frameCount);
            break;
    }
    
    animate();
}

function visualizeFIFO(sequence, frameCount) {
    animationSteps = [];
    const frames = new Array(frameCount).fill(-1);
    let fifoPointer = 0;
    let pageFaults = 0;
    
    sequence.forEach((page, i) => {
        const pageIndex = frames.indexOf(page);
        if (pageIndex === -1) {
            pageFaults++;
            const replacedPage = frames[fifoPointer];
            frames[fifoPointer] = page;
            fifoPointer = (fifoPointer + 1) % frameCount;
            
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: true,
                replacedPage,
                faultCount: pageFaults,
                sequenceIndex: i,
                explanation: `Page Fault: ${page} loaded into frame ${fifoPointer === 0 ? frameCount : fifoPointer}${replacedPage !== -1 ? `, replacing ${replacedPage}` : ''}`
            });
        } else {
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: false,
                faultCount: pageFaults,
                sequenceIndex: i,
                explanation: `Page Hit: ${page} already in frame ${pageIndex + 1}`
            });
        }
    });
}

function visualizeLRU(sequence, frameCount) {
    animationSteps = [];
    const frames = new Array(frameCount).fill(-1);
    const lastUsed = new Array(frameCount).fill(-1);
    let pageFaults = 0;
    
    sequence.forEach((page, time) => {
        const pageIndex = frames.indexOf(page);
        if (pageIndex === -1) {
            pageFaults++;
            let replaceIndex = 0;
            let oldestTime = Infinity;
            
            for (let i = 0; i < frameCount; i++) {
                if (frames[i] === -1) {
                    replaceIndex = i;
                    break;
                }
                if (lastUsed[i] < oldestTime) {
                    oldestTime = lastUsed[i];
                    replaceIndex = i;
                }
            }
            
            const replacedPage = frames[replaceIndex];
            frames[replaceIndex] = page;
            lastUsed[replaceIndex] = time;
            
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: true,
                replacedPage,
                faultCount: pageFaults,
                sequenceIndex: time,
                explanation: `Page Fault: ${page} replaces ${replacedPage !== -1 ? replacedPage : 'empty frame'} (least recently used)`
            });
        } else {
            lastUsed[pageIndex] = time;
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: false,
                faultCount: pageFaults,
                sequenceIndex: time,
                explanation: `Page Hit: ${page} already in frame ${pageIndex + 1}`
            });
        }
    });
}

function visualizeOptimal(sequence, frameCount) {
    animationSteps = [];
    const frames = new Array(frameCount).fill(-1);
    let pageFaults = 0;
    
    sequence.forEach((page, currentIndex) => {
        const pageIndex = frames.indexOf(page);
        if (pageIndex === -1) {
            pageFaults++;
            let replaceIndex = 0;
            let farthestUse = -1;
            
            // Find empty frame
            const emptyIndex = frames.indexOf(-1);
            if (emptyIndex !== -1) {
                replaceIndex = emptyIndex;
            } else {
                // Find page that won't be used for longest time
                for (let i = 0; i < frameCount; i++) {
                    const nextUse = sequence.slice(currentIndex + 1).indexOf(frames[i]);
                    if (nextUse === -1) {
                        replaceIndex = i;
                        break;
                    }
                    if (nextUse > farthestUse) {
                        farthestUse = nextUse;
                        replaceIndex = i;
                    }
                }
            }
            
            const replacedPage = frames[replaceIndex];
            frames[replaceIndex] = page;
            
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: true,
                replacedPage,
                faultCount: pageFaults,
                sequenceIndex: currentIndex,
                explanation: `Page Fault: ${page} replaces ${replacedPage !== -1 ? replacedPage : 'empty frame'} (optimal replacement)`
            });
        } else {
            animationSteps.push({
                frames: [...frames],
                currentPage: page,
                fault: false,
                faultCount: pageFaults,
                sequenceIndex: currentIndex,
                explanation: `Page Hit: ${page} already in frame ${pageIndex + 1}`
            });
        }
    });
}

function drawVisualization(steps) {
    const step = steps[steps.length - 1];
    const frameCount = step.frames.length;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions
    const cellSize = 50;
    const cellSpacing = 10;
    const startX = 100;
    let startY = 50;
    
    // Draw page reference sequence header
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Page Reference Sequence', canvas.width / 2, startY - 20);
    
    // Draw all reference strings
    pageSequence.forEach((page, seqIndex) => {
        const x = startX + seqIndex * (cellSize + cellSpacing);
        const y = startY;
        
        // Highlight current step
        if (seqIndex === step.sequenceIndex) {
            ctx.fillStyle = '#e3f2fd';
            ctx.fillRect(x - 2, y - 2, cellSize + 4, cellSize + 4);
        }
        
        // Draw reference string cell
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
        
        // Draw page number
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(page.toString(), x + cellSize / 2, y + cellSize / 2 + 6);
    });
    
    // Move down for hit/fault indicators
    startY += cellSize + 20;
    
    // Draw hit/fault indicators below reference strings
    pageSequence.forEach((page, seqIndex) => {
        const x = startX + seqIndex * (cellSize + cellSpacing);
        const y = startY;
        
        const stepForThisSeq = steps.find(s => s.sequenceIndex === seqIndex);
        if (stepForThisSeq) {
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            if (stepForThisSeq.fault) {
                ctx.fillStyle = '#f44336';
                ctx.fillText('F', x + cellSize / 2, y + 15);
            } else {
                ctx.fillStyle = '#4CAF50';
                ctx.fillText('H', x + cellSize / 2, y + 15);
            }
        }
    });
    
    // Move down for frames
    startY += 40;
    
    // Draw frames and their states at each step
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        const frameY = startY + frameIndex * (cellSize + 20);
        
        // Draw frame label
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Frame ${frameIndex + 1}:`, startX - 10, frameY + cellSize / 2 + 6);
        
        // Draw frame state for each reference string
        pageSequence.forEach((page, seqIndex) => {
            const x = startX + seqIndex * (cellSize + cellSpacing);
            
            // Find the step where this frame was updated
            let frameValue = -1;
            let isCurrent = false;
            let isFault = false;
            
            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                if (s.sequenceIndex === seqIndex) {
                    frameValue = s.frames[frameIndex];
                    isCurrent = (i === steps.length - 1);
                    isFault = s.fault && (s.frames[frameIndex] === s.currentPage);
                    break;
                } else if (s.sequenceIndex > seqIndex) {
                    break;
                } else {
                    frameValue = s.frames[frameIndex];
                }
            }
            
            // Draw cell
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, frameY, cellSize, cellSize);
            
            // Fill cell if page is present
            if (frameValue !== -1) {
                ctx.fillStyle = isCurrent ? 
                    (isFault ? '#ffcdd2' : '#c8e6c9') : 
                    '#ffffff';
                ctx.fillRect(x, frameY, cellSize, cellSize);
                
                // Draw page number
                ctx.fillStyle = '#333';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(frameValue.toString(), x + cellSize / 2, frameY + cellSize / 2 + 6);
            }
        });
    }
    
    // Update results and step-by-step explanation
    updateResults(steps);
}

function updateResults(steps) {
    if (steps.length === 0) return;
    
    const step = steps[steps.length - 1];
    const results = document.getElementById('results');
    results.innerHTML = `
        <div class="results-card">
            <h3>Results</h3>
            <div class="result-item">
                <span class="result-label">Total Page Faults:</span>
                <span class="result-value">${step.faultCount}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Hit Ratio:</span>
                <span class="result-value">${((steps.length - step.faultCount) / steps.length * 100).toFixed(2)}%</span>
            </div>
        </div>
    `;
    
    // Update step-by-step explanation
    const stepByStep = document.getElementById('step-by-step');
    stepByStep.innerHTML = `
        <h3>Execution Steps</h3>
        <div class="steps-list">
            ${steps.map((s, i) => `
                <div class="step ${s.fault ? 'fault-step' : 'hit-step'}">
                    <span class="step-number">${i + 1}</span>
                    <span class="step-details">${s.explanation}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function animate() {
    if (!isPlaying) return;
    
    if (currentStep < animationSteps.length) {
        drawVisualization(animationSteps.slice(0, currentStep + 1));
        currentStep++;
        setTimeout(() => {
            requestAnimationFrame(animate);
        }, animationSpeed);
    } else {
        isPlaying = false;
        document.getElementById('play-pause-btn').textContent = 'Play';
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    document.getElementById('play-pause-btn').textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) {
        animate();
    }
}

function resetAnimation() {
    currentStep = 0;
    isPlaying = false;
    document.getElementById('play-pause-btn').textContent = 'Play';
    if (animationSteps.length > 0) {
        drawVisualization([animationSteps[0]]);
    }
}