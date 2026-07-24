let animationSpeed = 1500;
let isPlaying = false;
let currentStep = 0;
let animationFrame;
let animationSteps = [];
let requests = [];
let currentTime = 0;
let currentHeadPosition = 50;
let requestStatus = {};

function setAnimationSpeed(value) {
    animationSpeed = 3000 / value;
    document.getElementById('speed-value').textContent = value + 'x';
}

function parseRequests() {
    const requestInput = document.getElementById('requests').value;
    requests = requestInput.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
    return requests.length > 0;
}

function calculateCanvasHeight() {
    const baseHeight = 600;
    const extraHeightPerRequest = 35;
    const calculatedHeight = baseHeight + (requests.length * extraHeightPerRequest);
    return Math.min(calculatedHeight, 1200);
}

function runVisualization() {
    if (!parseRequests()) {
        alert('Please enter valid disk requests');
        return;
    }

    const algorithm = document.getElementById('algorithm-select').value;
    const diskSize = parseInt(document.getElementById('disk-size').value);
    const headStart = parseInt(document.getElementById('head-position').value);
    
    if (isNaN(diskSize)) {
        alert('Please enter valid disk size');
        return;
    }
    
    if (isNaN(headStart) || headStart < 0 || headStart >= diskSize) {
        alert('Please enter valid head position (0 to disk size - 1)');
        return;
    }

    // Reset animation state
    animationSteps = [];
    currentStep = 0;
    currentTime = 0;
    currentHeadPosition = headStart;
    isPlaying = true;
    
    // Initialize request status
    requestStatus = {};
    requests.forEach(req => {
        if (req >= 0 && req < diskSize) {
            requestStatus[req] = {
                completed: false,
                completionTime: 0,
                seekTime: 0,
                waitTime: 0
            };
        }
    });
    
    // Filter out invalid requests (outside disk range)
    requests = requests.filter(req => req >= 0 && req < diskSize);
    
    // Calculate sequence based on algorithm
    let sequence = calculateSequence(algorithm, headStart, diskSize);
    
    // Generate animation steps
    animationSteps = generateAnimationSteps(sequence, diskSize);
    
    // Adjust canvas size based on number of requests
    const canvas = document.getElementById('visualization-canvas');
    canvas.height = calculateCanvasHeight();
    
    // Start animation
    document.getElementById('play-pause-btn').textContent = 'Pause';
    updateStatusDisplay();
    updateResultsTable();
    drawVisualization();
    
    // Cancel any existing animation frame before starting new one
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    animate();
    
    // Show explanation
    generateStepByStepExplanation(algorithm, sequence, headStart, diskSize);
}

function calculateSequence(algorithm, headStart, diskSize) {
    let sequence = [headStart];
    
    switch (algorithm) {
        case 'fcfs':
            sequence = sequence.concat(requests);
            break;
            
        case 'scan':
            const sortedScan = [...requests].sort((a, b) => a - b);
            // Move right
            sortedScan.forEach(req => {
                if (req >= headStart) sequence.push(req);
            });
            sequence.push(diskSize - 1);
            // Move left
            sortedScan.reverse().forEach(req => {
                if (req < headStart) sequence.push(req);
            });
            break;
            
        case 'cscan':
            const sortedCScan = [...requests].sort((a, b) => a - b);
            // Move right
            sortedCScan.forEach(req => {
                if (req >= headStart) sequence.push(req);
            });
            sequence.push(diskSize - 1);
            sequence.push(0);
            // Continue from start
            sortedCScan.forEach(req => {
                if (req < headStart) sequence.push(req);
            });
            break;
            
        case 'look':
            const sortedLook = [...requests].sort((a, b) => a - b);
            // Move right
            sortedLook.forEach(req => {
                if (req >= headStart) sequence.push(req);
            });
            // Move left
            sortedLook.reverse().forEach(req => {
                if (req < headStart) sequence.push(req);
            });
            break;
    }
    
    return sequence;
}

function generateAnimationSteps(sequence, diskSize) {
    const steps = [];
    
    for (let i = 0; i < sequence.length - 1; i++) {
        const start = sequence[i];
        const end = sequence[i + 1];
        steps.push({
            from: start,
            to: end,
            progress: 0,
            completed: false,
            stepNumber: i + 1,
            distance: Math.abs(end - start)
        });
    }
    
    return steps;
}

function updateStatusDisplay() {
    document.getElementById('current-time').textContent = currentTime;
    document.getElementById('current-position').textContent = currentHeadPosition;
    
    let statusText = "Idle";
    if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep];
        if (!step.completed) {
            statusText = `Moving from ${step.from} to ${step.to}`;
        } else {
            statusText = `Completed move to ${step.to}`;
        }
    }
    document.getElementById('current-status').textContent = statusText;
}

function updateResultsTable() {
    const tbody = document.getElementById('results-body');
    tbody.innerHTML = '';
    
    let totalSeekTime = 0;
    let totalWaitTime = 0;
    let completedCount = 0;
    let totalSeekDistance = animationSteps.reduce((sum, step) => sum + step.distance, 0);
    
    requests.forEach(req => {
        const status = requestStatus[req];
        if (!status) return;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${req}</td>
            <td>${status.completed ? status.completionTime : '-'}</td>
            <td>${status.completed ? status.seekTime : '-'}</td>
            <td>${status.completed ? status.waitTime : '-'}</td>
        `;
        
        tbody.appendChild(row);
        
        if (status.completed) {
            totalSeekTime += status.seekTime;
            totalWaitTime += status.waitTime;
            completedCount++;
        }
    });
    
    // Update results display
    document.getElementById('total-seek').textContent = totalSeekDistance;
    document.getElementById('avg-seek').textContent = completedCount > 0 ? (totalSeekTime / completedCount).toFixed(2) : '0.00';
    document.getElementById('avg-wait').textContent = completedCount > 0 ? (totalWaitTime / completedCount).toFixed(2) : '0.00';
}

function animate() {
    if (!isPlaying) return;
    
    const now = Date.now();
    if (!animate.lastTime) animate.lastTime = now;
    
    if (now - animate.lastTime > animationSpeed) {
        currentTime++;
        
        if (currentStep < animationSteps.length) {
            const step = animationSteps[currentStep];
            step.progress = Math.min(1, step.progress + 0.1);
            
            // Update current head position
            currentHeadPosition = Math.round(step.from + (step.to - step.from) * step.progress);
            
            // Check if any requests were fulfilled
            requests.forEach(req => {
                const status = requestStatus[req];
                if (!status.completed && Math.abs(currentHeadPosition - req) < 2) {
                    status.completed = true;
                    status.completionTime = currentTime;
                    
                    // Calculate actual seek time (distance from previous position)
                    if (currentStep > 0) {
                        const prevStep = animationSteps[currentStep - 1];
                        status.seekTime = Math.abs(req - prevStep.to);
                    } else {
                        status.seekTime = Math.abs(req - step.from);
                    }
                    
                    // Wait time is completion time - 1 (since time starts at 1)
                    status.waitTime = currentTime - 1;
                }
            });
            
            if (step.progress >= 1) {
                step.completed = true;
                if (currentStep < animationSteps.length - 1) {
                    currentStep++;
                }
            }
            
            updateStatusDisplay();
            updateResultsTable();
            drawVisualization();
            animate.lastTime = now;
            highlightCurrentStep();
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
}

function drawVisualization() {
    const canvas = document.getElementById('visualization-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up dimensions
    const margin = 60;
    const width = canvas.width - 2 * margin;
    const height = canvas.height - 2 * margin;
    const diskSize = parseInt(document.getElementById('disk-size').value);
    
    // Draw disk track
    drawDiskTrack(ctx, margin, width, diskSize);
    
    // Draw request points and labels
    drawRequestPoints(ctx, margin, width, diskSize);
    
    // Draw movement path
    drawMovementPath(ctx, margin, width, height, diskSize);
    
    // Draw current head position
    drawHeadPosition(ctx, margin, width, diskSize);
    
    // Draw step counter
    drawStepCounter(ctx);
}

function drawDiskTrack(ctx, margin, width, diskSize) {
    // Draw main track line
    ctx.beginPath();
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 4;
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin + width, margin);
    ctx.stroke();
    
    // Draw scale markers
    ctx.lineWidth = 1;
    for (let i = 0; i <= diskSize; i += 20) {
        const x = margin + (i * width / diskSize);
        ctx.beginPath();
        ctx.moveTo(x, margin - 10);
        ctx.lineTo(x, margin + 10);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x, margin - 15);
    }
}

function drawRequestPoints(ctx, margin, width, diskSize) {
    const pointRadius = 6;
    requests.forEach(req => {
        const x = margin + (req * width / diskSize);
        const status = requestStatus[req];
        if (!status) return;
        
        // Draw request point
        ctx.beginPath();
        ctx.arc(x, margin, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = status.completed ? '#4CAF50' : '#FF9800';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw request value
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(req.toString(), x, margin + 20);
    });
}

function drawMovementPath(ctx, margin, width, height, diskSize) {
    let y = margin + 40;
    const yStep = 35;
    
    for (let i = 0; i <= currentStep; i++) {
        const step = animationSteps[i];
        const startX = margin + (step.from * width / diskSize);
        const endX = margin + (step.to * width / diskSize);
        const currentX = startX + (endX - startX) * step.progress;
        
        // Draw movement line
        ctx.beginPath();
        ctx.strokeStyle = step.completed ? '#4CAF50' : '#E91E63';
        ctx.lineWidth = 2;
        ctx.moveTo(startX, y);
        ctx.lineTo(currentX, y + yStep);
        ctx.stroke();
        
        // Draw points and labels
        ctx.beginPath();
        ctx.arc(startX, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        
        if (step.completed) {
            ctx.beginPath();
            ctx.arc(endX, y + yStep, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw step number and cylinder
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Step ${step.stepNumber}: ${step.from} → ${step.to}`, endX + 10, y + yStep + 4);
        }
        
        y += yStep;
    }
}

function drawHeadPosition(ctx, margin, width, diskSize) {
    if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep];
        const x = margin + ((step.from + (step.to - step.from) * step.progress) * width / diskSize);
        
        // Draw head indicator
        ctx.beginPath();
        ctx.moveTo(x, margin - 20);
        ctx.lineTo(x - 10, margin - 30);
        ctx.lineTo(x + 10, margin - 30);
        ctx.closePath();
        ctx.fillStyle = '#E91E63';
        ctx.fill();
        
        // Draw current position value
        const currentPos = Math.round(step.from + (step.to - step.from) * step.progress);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(`Current: ${currentPos}`, x, margin - 35);
    }
}

function drawStepCounter(ctx) {
    if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep];
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.fillText(`Step ${step.stepNumber} of ${animationSteps.length}`, 10, 30);
    }
}

function highlightCurrentStep() {
    const steps = document.querySelectorAll('.steps-list li');
    steps.forEach((step, index) => {
        if (index === currentStep) {
            step.classList.add('current-step');
        } else {
            step.classList.remove('current-step');
        }
    });
}

function generateStepByStepExplanation(algorithm, sequence, headStart, diskSize) {
    const stepByStep = document.getElementById('step-by-step');
    
    // Get values from the results display (which are already calculated correctly)
    const totalSeekDistance = parseInt(document.getElementById('total-seek').textContent) || 0;
    const avgSeek = parseFloat(document.getElementById('avg-seek').textContent) || 0;
    const avgWait = parseFloat(document.getElementById('avg-wait').textContent) || 0;
    
    let html = `
        <div class="solution-steps">
            <h2>Solution Steps</h2>
            <div class="step-by-step-execution">
                <h3>Step-by-Step Execution</h3>
                <ol class="steps-list">
    `;
    
    // Generate the steps for the specific algorithm
    switch (algorithm) {
        case 'fcfs':
            // FCFS steps are just the requests in order
            for (let i = 0; i < requests.length; i++) {
                const req = requests[i];
                const from = i === 0 ? headStart : requests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            break;
            
        case 'scan':
            // SCAN steps - first right then left
            html += `<li class="step-item">
                        <div class="step-details">
                            Sorted requests in ascending order: ${[...requests].sort((a,b) => a-b).join(', ')}
                        </div>
                    </li>`;
            
            // Moving right
            const rightRequests = requests.filter(req => req >= headStart).sort((a,b) => a-b);
            for (let i = 0; i < rightRequests.length; i++) {
                const req = rightRequests[i];
                const from = i === 0 ? headStart : rightRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            
            // Reached end of disk
            if (rightRequests.length > 0) {
                const lastRight = rightRequests[rightRequests.length-1];
                const distance = Math.abs((diskSize-1) - lastRight);
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Reached end of disk at cylinder ${diskSize-1} (distance: ${distance})
                        </div>
                    </li>
                `;
            }
            
            // Moving left
            const leftRequests = requests.filter(req => req < headStart).sort((a,b) => b-a);
            for (let i = 0; i < leftRequests.length; i++) {
                const req = leftRequests[i];
                const from = i === 0 ? (rightRequests.length > 0 ? diskSize-1 : headStart) : leftRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            break;
            
        case 'cscan':
            // C-SCAN steps - right then jump to start
            html += `<li class="step-item">
                        <div class="step-details">
                            Sorted requests in ascending order: ${[...requests].sort((a,b) => a-b).join(', ')}
                        </div>
                    </li>`;
            
            // Moving right
            const cscanRightRequests = requests.filter(req => req >= headStart).sort((a,b) => a-b);
            for (let i = 0; i < cscanRightRequests.length; i++) {
                const req = cscanRightRequests[i];
                const from = i === 0 ? headStart : cscanRightRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            
            // Reached end of disk and jump to start
            if (cscanRightRequests.length > 0) {
                const lastRight = cscanRightRequests[cscanRightRequests.length-1];
                const distance1 = Math.abs((diskSize-1) - lastRight);
                const distance2 = diskSize-1; // distance from 0 to end
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Reached end of disk at cylinder ${diskSize-1} (distance: ${distance1})
                        </div>
                    </li>
                    <li class="step-item">
                        <div class="step-details">
                            Jump to cylinder 0 (distance: ${diskSize-1})
                        </div>
                    </li>
                `;
            }
            
            // Moving right again from start
            const cscanLeftRequests = requests.filter(req => req < headStart).sort((a,b) => a-b);
            for (let i = 0; i < cscanLeftRequests.length; i++) {
                const req = cscanLeftRequests[i];
                const from = i === 0 ? 0 : cscanLeftRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            break;
            
        case 'look':
            // LOOK steps - right then left without going to end
            html += `<li class="step-item">
                        <div class="step-details">
                            Sorted requests in ascending order: ${[...requests].sort((a,b) => a-b).join(', ')}
                        </div>
                    </li>`;
            
            // Moving right to highest request
            const lookRightRequests = requests.filter(req => req >= headStart).sort((a,b) => a-b);
            for (let i = 0; i < lookRightRequests.length; i++) {
                const req = lookRightRequests[i];
                const from = i === 0 ? headStart : lookRightRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            
            // Moving left to lowest request
            const lookLeftRequests = requests.filter(req => req < headStart).sort((a,b) => b-a);
            for (let i = 0; i < lookLeftRequests.length; i++) {
                const req = lookLeftRequests[i];
                const from = i === 0 ? (lookRightRequests.length > 0 ? lookRightRequests[lookRightRequests.length-1] : headStart) : lookLeftRequests[i-1];
                const to = req;
                const distance = Math.abs(to - from);
                const status = requestStatus[req];
                const waitTime = status ? status.waitTime : 0;
                
                html += `
                    <li class="step-item">
                        <div class="step-details">
                            Move to cylinder ${req} (distance: ${distance}, wait time: ${waitTime})
                        </div>
                    </li>
                `;
            }
            break;
    }
    
    html += `
                </ol>
            </div>
            <div class="summary-section">
                <h3>Summary</h3>
                <div class="summary-item">
                    <span class="summary-label">Total Seek Distance:</span>
                    <span class="summary-value">${totalSeekDistance} cylinders</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Requests:</span>
                    <span class="summary-value">${requests.length}</span>
                </div>
            </div>
        </div>
    `;
    
    stepByStep.innerHTML = html;
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    document.getElementById('play-pause-btn').textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) animate();
}

function resetAnimation() {
    currentStep = 0;
    currentTime = 0;
    currentHeadPosition = parseInt(document.getElementById('head-position').value);
    
    animationSteps.forEach(step => {
        step.progress = 0;
        step.completed = false;
    });
    
    requests.forEach(req => {
        requestStatus[req] = {
            completed: false,
            completionTime: 0,
            seekTime: 0,
            waitTime: 0
        };
    });
    
    isPlaying = false;
    document.getElementById('play-pause-btn').textContent = 'Play';
    updateStatusDisplay();
    updateResultsTable();
    drawVisualization();
    
    const steps = document.querySelectorAll('.steps-list li');
    steps.forEach(step => step.classList.remove('current-step'));
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('visualization-canvas');
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 600;
    
    const playPauseBtn = document.getElementById('play-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const speedControl = document.getElementById('animation-speed');
    const visualizeBtn = document.getElementById('visualize-btn');
    
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (resetBtn) resetBtn.addEventListener('click', resetAnimation);
    if (visualizeBtn) visualizeBtn.addEventListener('click', runVisualization);
    if (speedControl) {
        speedControl.addEventListener('input', (e) => {
            setAnimationSpeed(parseFloat(e.target.value));
        });
    }
});

window.addEventListener('resize', () => {
    const canvas = document.getElementById('visualization-canvas');
    canvas.width = canvas.parentElement.clientWidth - 40;
    drawVisualization();
});