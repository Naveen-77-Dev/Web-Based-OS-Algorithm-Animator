// Global variables for animation
let animationSpeed = 1500; // Default speed (1.5s)
let isPlaying = true;
let currentStep = 0;
let animationFrame;
let animationSteps = [];
let solutionSteps = [];
let processCompletionTimes = {};

function generateProcessInputs() {
    const processCount = parseInt(document.getElementById('process-count').value) || 0;
    const processInputs = document.getElementById('process-inputs');
    const errorElement = document.getElementById('process-count-error');
    
    if (processCount < 1 || processCount > 10) {
        errorElement.style.display = 'block';
        return;
    } else {
        errorElement.style.display = 'none';
    }
    
    let html = '';
    for (let i = 0; i < processCount; i++) {
        html += `
            <div class="process-input">
                <h4>Process ${i + 1}</h4>
                <div class="form-group">
                    <label>Arrival Time</label>
                    <input type="number" id="arrival-${i}" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>Burst Time</label>
                    <input type="number" id="burst-${i}" min="1" value="1">
                </div>
                <div class="form-group priority-input" style="display: none;">
                    <label>Priority</label>
                    <input type="number" id="priority-${i}" min="1" value="1">
                </div>
            </div>
        `;
    }
    
    processInputs.innerHTML = html;
    
    // Show/hide priority inputs based on selected algorithm
    const algorithm = document.getElementById('algorithm-select').value;
    const priorityInputs = document.querySelectorAll('.priority-input');
    priorityInputs.forEach(input => {
        input.style.display = algorithm === 'priority' ? 'block' : 'none';
    });
}

function getProcesses() {
    const processCount = parseInt(document.getElementById('process-count').value) || 0;
    const processes = [];
    
    for (let i = 0; i < processCount; i++) {
        processes.push({
            id: i + 1,
            arrivalTime: parseInt(document.getElementById(`arrival-${i}`).value) || 0,
            burstTime: parseInt(document.getElementById(`burst-${i}`).value) || 1,
            priority: parseInt(document.getElementById(`priority-${i}`).value) || 1,
            remainingTime: parseInt(document.getElementById(`burst-${i}`).value) || 1,
            waitingTime: 0,
            turnaroundTime: 0,
            completionTime: 0
        });
    }
    
    return processes;
}

function runVisualization() {
    const algorithm = document.getElementById('algorithm-select').value;
    const schedulingType = document.getElementById('scheduling-type').value;
    const processes = getProcesses();
    
    if (processes.length === 0 || processes.length > 10) {
        alert('Please enter between 1 and 10 processes');
        return;
    }
    
    // Reset animation state
    currentStep = 0;
    isPlaying = true;
    animationSteps = [];
    solutionSteps = [];
    processCompletionTimes = {};
    
    // Initialize completion times
    processes.forEach(p => {
        processCompletionTimes[p.id] = 0;
    });
    
    // Run selected algorithm
    switch (algorithm) {
        case 'fcfs':
            visualizeFCFS(processes);
            break;
        case 'sjf':
            if (schedulingType === 'preemptive') {
                visualizeSRTF(processes);
            } else {
                visualizeSJF(processes);
            }
            break;
        case 'rr':
            const timeQuantum = parseInt(document.getElementById('time-quantum').value) || 2;
            visualizeRR(processes, timeQuantum);
            break;
        case 'priority':
            if (schedulingType === 'preemptive') {
                visualizePreemptivePriority(processes);
            } else {
                visualizePriority(processes);
            }
            break;
    }
    
    // Start animation
    document.getElementById('pause-btn').textContent = 'Pause';
    updateSolutionSteps();
    animate();
}

function visualizeFCFS(processes) {
    // Sort by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    solutionSteps.push({
        text: "Step 1: Sort processes by arrival time (FCFS)",
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    
    while (completed < totalProcesses) {
        let selectedProcess = null;
        
        // Find the first process that has arrived
        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime) {
                selectedProcess = process;
                break;
            }
        }
        
        if (selectedProcess) {
            // Execute process until completion
            while (selectedProcess.remainingTime > 0) {
                animationSteps.push({
                    time: currentTime,
                    processId: selectedProcess.id,
                    remainingTime: selectedProcess.remainingTime,
                    explanation: `Executing Process ${selectedProcess.id} (Remaining Time: ${selectedProcess.remainingTime})`,
                    type: "execution"
                });
                
                selectedProcess.remainingTime--;
                currentTime++;
            }
            
            // Process completed
            selectedProcess.completionTime = currentTime;
            processCompletionTimes[selectedProcess.id] = currentTime;
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Process ${selectedProcess.id} completed at time ${currentTime}`,
                type: "completion"
            });
            completed++;
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function visualizeSJF(processes) {
    // Sort by arrival time initially
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    solutionSteps.push({
        text: "Step 1: Sort processes by arrival time (SJF Non-Preemptive)",
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    
    while (completed < totalProcesses) {
        let selectedProcess = null;
        let shortestBurst = Infinity;
        
        // Find process with shortest burst time that has arrived
        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime && process.remainingTime < shortestBurst) {
                shortestBurst = process.remainingTime;
                selectedProcess = process;
            }
        }
        
        if (selectedProcess) {
            // Execute process until completion (non-preemptive)
            const executionStart = currentTime;
            const executionEnd = executionStart + selectedProcess.remainingTime;
            
            for (let t = executionStart; t < executionEnd; t++) {
                animationSteps.push({
                    time: t,
                    processId: selectedProcess.id,
                    remainingTime: executionEnd - t,
                    explanation: `Executing Process ${selectedProcess.id} (Shortest Job: ${selectedProcess.burstTime})`,
                    type: "execution"
                });
            }
            
            currentTime = executionEnd;
            selectedProcess.remainingTime = 0;
            selectedProcess.completionTime = currentTime;
            processCompletionTimes[selectedProcess.id] = currentTime;
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Process ${selectedProcess.id} completed at time ${currentTime}`,
                type: "completion"
            });
            completed++;
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function visualizeSRTF(processes) {
    // Sort by arrival time initially
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    solutionSteps.push({
        text: "Step 1: Sort processes by arrival time (SRTF - Preemptive SJF)",
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    let currentProcess = null;
    
    while (completed < totalProcesses) {
        // Check for new arrivals
        for (const process of processes) {
            if (process.arrivalTime === currentTime && process.remainingTime > 0) {
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${process.id} arrived at time ${currentTime}`,
                    type: "arrival"
                });
            }
        }
        
        // Find process with shortest remaining time
        let shortestProcess = null;
        let shortestTime = Infinity;
        
        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime) {
                if (process.remainingTime < shortestTime) {
                    shortestTime = process.remainingTime;
                    shortestProcess = process;
                }
            }
        }
        
        // Check if we need to preempt
        if (currentProcess && shortestProcess && shortestProcess.id !== currentProcess.id) {
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Preempting Process ${currentProcess.id} for Process ${shortestProcess.id} (Shorter remaining time)`,
                type: "preemption"
            });
        }
        
        currentProcess = shortestProcess;
        
        if (currentProcess) {
            // Execute process for 1 time unit
            animationSteps.push({
                time: currentTime,
                processId: currentProcess.id,
                remainingTime: currentProcess.remainingTime - 1,
                explanation: `Executing Process ${currentProcess.id} (Shortest Remaining Time: ${currentProcess.remainingTime})`,
                type: "execution"
            });
            
            currentProcess.remainingTime--;
            currentTime++;
            
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                processCompletionTimes[currentProcess.id] = currentTime;
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${currentProcess.id} completed at time ${currentTime}`,
                    type: "completion"
                });
                completed++;
            }
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function visualizeRR(processes, timeQuantum) {
    solutionSteps.push({
        text: `Step 1: Initialize Round Robin with time quantum = ${timeQuantum}`,
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    let queue = [];
    let lastExecutionTime = {};
    
    // Initialize last execution time
    processes.forEach(p => {
        lastExecutionTime[p.id] = -1;
    });
    
    while (completed < totalProcesses) {
        // Add newly arrived processes to queue
        for (const process of processes) {
            if (process.arrivalTime === currentTime && process.remainingTime > 0) {
                queue.push(process);
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${process.id} arrived at time ${currentTime} and added to queue`,
                    type: "arrival"
                });
            }
        }
        
        if (queue.length > 0) {
            const currentProcess = queue.shift();
            const executeTime = Math.min(timeQuantum, currentProcess.remainingTime);
            
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Executing Process ${currentProcess.id} for ${executeTime} units (Remaining: ${currentProcess.remainingTime})`,
                type: "execution"
            });
            
            // Execute process for time quantum or remaining time
            for (let i = 0; i < executeTime; i++) {
                animationSteps.push({
                    time: currentTime + i,
                    processId: currentProcess.id,
                    remainingTime: currentProcess.remainingTime - i,
                    explanation: `Executing Process ${currentProcess.id} (Remaining Time: ${currentProcess.remainingTime - i})`,
                    type: "execution"
                });
            }
            
            currentProcess.remainingTime -= executeTime;
            currentTime += executeTime;
            
            // Add processes that arrived during execution
            for (const process of processes) {
                if (process.arrivalTime > currentTime - executeTime && 
                    process.arrivalTime <= currentTime && 
                    process.remainingTime > 0 &&
                    !queue.includes(process) &&
                    process.id !== currentProcess.id) {
                    queue.push(process);
                    solutionSteps.push({
                        text: `Step ${solutionSteps.length + 1}: Process ${process.id} arrived during execution and added to queue`,
                        type: "arrival"
                    });
                }
            }
            
            // Check if process is completed
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                processCompletionTimes[currentProcess.id] = currentTime;
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${currentProcess.id} completed at time ${currentTime}`,
                    type: "completion"
                });
                completed++;
            } else {
                // Add back to queue if not completed
                queue.push(currentProcess);
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${currentProcess.id} preempted and added back to queue (Remaining: ${currentProcess.remainingTime})`,
                    type: "preemption"
                });
            }
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function visualizePriority(processes) {
    solutionSteps.push({
        text: "Step 1: Sort processes by priority (lower number = higher priority, Non-Preemptive)",
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    
    while (completed < totalProcesses) {
        let selectedProcess = null;
        let highestPriority = Infinity;
        
        // Find process with highest priority (lower number = higher priority)
        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime) {
                if (process.priority < highestPriority) {
                    highestPriority = process.priority;
                    selectedProcess = process;
                }
            }
        }
        
        if (selectedProcess) {
            // Execute process until completion (non-preemptive)
            const executionStart = currentTime;
            const executionEnd = executionStart + selectedProcess.remainingTime;
            
            for (let t = executionStart; t < executionEnd; t++) {
                animationSteps.push({
                    time: t,
                    processId: selectedProcess.id,
                    remainingTime: executionEnd - t,
                    explanation: `Executing Process ${selectedProcess.id} (Priority: ${selectedProcess.priority})`,
                    type: "execution"
                });
            }
            
            currentTime = executionEnd;
            selectedProcess.remainingTime = 0;
            selectedProcess.completionTime = currentTime;
            processCompletionTimes[selectedProcess.id] = currentTime;
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Process ${selectedProcess.id} completed at time ${currentTime}`,
                type: "completion"
            });
            completed++;
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function visualizePreemptivePriority(processes) {
    solutionSteps.push({
        text: "Step 1: Initialize Preemptive Priority Scheduling (lower number = higher priority)",
        type: "info"
    });
    
    let currentTime = 0;
    let completed = 0;
    const totalProcesses = processes.length;
    let currentProcess = null;
    
    while (completed < totalProcesses) {
        // Check for new arrivals
        for (const process of processes) {
            if (process.arrivalTime === currentTime && process.remainingTime > 0) {
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${process.id} arrived at time ${currentTime}`,
                    type: "arrival"
                });
            }
        }
        
        // Find process with highest priority (lowest priority number)
        let highestPriorityProcess = null;
        let highestPriority = Infinity;
        
        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime) {
                if (process.priority < highestPriority) {
                    highestPriority = process.priority;
                    highestPriorityProcess = process;
                }
            }
        }
        
        // Check if we need to preempt
        if (currentProcess && highestPriorityProcess && highestPriorityProcess.id !== currentProcess.id) {
            solutionSteps.push({
                text: `Step ${solutionSteps.length + 1}: Preempting Process ${currentProcess.id} for Process ${highestPriorityProcess.id} (Higher priority: ${highestPriorityProcess.priority} < ${currentProcess.priority})`,
                type: "preemption"
            });
        }
        
        currentProcess = highestPriorityProcess;
        
        if (currentProcess) {
            // Execute process for 1 time unit
            animationSteps.push({
                time: currentTime,
                processId: currentProcess.id,
                remainingTime: currentProcess.remainingTime - 1,
                explanation: `Executing Process ${currentProcess.id} (Priority: ${currentProcess.priority}, Remaining: ${currentProcess.remainingTime})`,
                type: "execution"
            });
            
            currentProcess.remainingTime--;
            currentTime++;
            
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                processCompletionTimes[currentProcess.id] = currentTime;
                solutionSteps.push({
                    text: `Step ${solutionSteps.length + 1}: Process ${currentProcess.id} completed at time ${currentTime}`,
                    type: "completion"
                });
                completed++;
            }
        } else {
            // CPU idle
            animationSteps.push({
                time: currentTime,
                processId: null,
                remainingTime: 0,
                explanation: 'CPU Idle - Waiting for process arrival',
                type: "idle"
            });
            currentTime++;
        }
    }
}

function animate() {
    if (!isPlaying) return;
    
    const now = Date.now();
    if (!animate.lastTime) animate.lastTime = now;
    
    if (now - animate.lastTime > animationSpeed) {
        if (currentStep < animationSteps.length) {
            drawVisualization(currentStep);
            updateCurrentStatus(currentStep);
            updateSolutionSteps();
            currentStep++;
            animate.lastTime = now;
        } else {
            isPlaying = false;
            document.getElementById('pause-btn').textContent = 'Play';
            showResults();
            return;
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
}

function drawVisualization(stepIndex) {
    const canvas = document.getElementById('visualization-canvas');
    const ctx = canvas.getContext('2d');
    
    const processes = getProcesses();
    const numProcesses = processes.length;
    
    // Calculate dynamic dimensions
    const processHeight = 30;
    const processSpacing = 10;
    const margin = 50;
    const topMargin = 30;
    const bottomMargin = 60;
    const sideMargin = 80;
    
    // Calculate required canvas height
    const requiredHeight = topMargin + (numProcesses * (processHeight + processSpacing)) + bottomMargin;
    const minHeight = 300;
    const maxHeight = window.innerHeight * 0.6;
    
    // Set canvas dimensions
    canvas.width = Math.min(canvas.parentElement.clientWidth - 40, 1200);
    canvas.height = Math.min(Math.max(requiredHeight, minHeight), maxHeight);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw timeline
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.moveTo(margin, canvas.height - bottomMargin);
    ctx.lineTo(canvas.width - margin, canvas.height - bottomMargin);
    ctx.stroke();
    
    // Draw time markers
    const maxTime = Math.max(animationSteps.length, 10);
    const timeScale = (canvas.width - 2 * margin) / maxTime;
    
    for (let i = 0; i <= maxTime; i++) {
        const x = margin + (i * timeScale);
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - bottomMargin - 5);
        ctx.lineTo(x, canvas.height - bottomMargin + 5);
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i, x, canvas.height - bottomMargin + 20);
    }
    
    // Draw process lanes
    processes.forEach((process, index) => {
        const y = topMargin + (index * (processHeight + processSpacing));
        
        // Draw process label
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`P${process.id}`, margin - 10, y + processHeight/2 + 5);
        
        // Draw process timeline
        ctx.strokeStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(margin, y + processHeight/2);
        ctx.lineTo(canvas.width - margin, y + processHeight/2);
        ctx.stroke();
    });
    
    // Draw execution blocks
    for (let i = 0; i <= stepIndex; i++) {
        const step = animationSteps[i];
        if (step.processId) {
            const process = processes.find(p => p.id === step.processId);
            if (process) {
                const x = margin + (i * timeScale);
                const y = topMargin + ((process.id - 1) * (processHeight + processSpacing));
                
                ctx.fillStyle = getProcessColor(process.id);
                ctx.fillRect(x, y, timeScale, processHeight);
                
                // Draw remaining time
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(step.remainingTime.toString(), x + timeScale/2, y + processHeight/2 + 4);
            }
        }
    }
    
    // Draw current time marker
    if (stepIndex < animationSteps.length) {
        const currentX = margin + (stepIndex * timeScale);
        ctx.strokeStyle = '#E91E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, topMargin - 10);
        ctx.lineTo(currentX, canvas.height - bottomMargin);
        ctx.stroke();
    }
}

function updateSolutionSteps() {
    const solutionContent = document.getElementById('solution-steps-content');
    if (!solutionContent) return;
    
    const stepsToShow = Math.min(currentStep + 1, solutionSteps.length);
    
    let html = `
        <h3>Step-by-Step Execution</h3>
        <div class="steps-container">
    `;
    
    for (let i = 0; i < stepsToShow; i++) {
        const step = solutionSteps[i];
        html += `
            <div class="step ${step.type}">
                <div class="step-number">${i + 1}</div>
                <div class="step-text">${step.text}</div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    solutionContent.innerHTML = html;
    solutionContent.scrollTop = solutionContent.scrollHeight;
}

function getProcessColor(processId) {
    const colors = [
        '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63',
        '#00BCD4', '#FFC107', '#3F51B5', '#CDDC39', '#795548',
        '#607D8B', '#009688', '#673AB7', '#FF5722', '#8BC34A'
    ];
    return colors[(processId - 1) % colors.length];
}

function updateCurrentStatus(stepIndex) {
    const step = animationSteps[stepIndex];
    const statusContent = document.getElementById('current-status-content');
    
    if (statusContent) {
        statusContent.innerHTML = `
            <div class="status-container ${step.type}">
                <h3>Current Status</h3>
                <p><strong>Time:</strong> ${step.time}</p>
                <p><strong>Current Process:</strong> ${step.processId ? 'P' + step.processId : 'None'}</p>
                <p><strong>Status:</strong> ${step.explanation}</p>
            </div>
        `;
    }
}

function showResults() {
    const results = document.getElementById('results');
    const processes = getProcesses();
    
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let resultDetails = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Process</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Completion</th>
                    <th>Turnaround</th>
                    <th>Waiting</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    processes.forEach(process => {
        const completionTime = processCompletionTimes[process.id] || 0;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        
        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;
        
        resultDetails += `
            <tr>
                <td>P${process.id}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td>${completionTime}</td>
                <td>${turnaroundTime}</td>
                <td>${waitingTime}</td>
            </tr>
        `;
    });
    
    const avgWaitingTime = totalWaitingTime / processes.length;
    const avgTurnaroundTime = totalTurnaroundTime / processes.length;
    
    resultDetails += `
            </tbody>
        </table>
        <div class="summary">
            <p><strong>Average Waiting Time:</strong> ${avgWaitingTime.toFixed(2)} units</p>
            <p><strong>Average Turnaround Time:</strong> ${avgTurnaroundTime.toFixed(2)} units</p>
        </div>
    `;
    
    results.innerHTML = `
        <div class="results-content">
            <h3>Scheduling Results</h3>
            ${resultDetails}
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('visualization-canvas');
    if (canvas) {
        canvas.width = canvas.parentElement.clientWidth - 40;
        canvas.height = 300;
    }
    
    // Algorithm selection change handler
    const algorithmSelect = document.getElementById('algorithm-select');
    if (algorithmSelect) {
        algorithmSelect.addEventListener('change', function() {
            const priorityInputs = document.querySelectorAll('.priority-input');
            priorityInputs.forEach(input => {
                input.style.display = this.value === 'priority' ? 'block' : 'none';
            });
            
            // Show/hide quantum input for Round Robin
            const quantumInput = document.getElementById('quantum-input');
            quantumInput.style.display = this.value === 'rr' ? 'block' : 'none';
            
            // Show/hide scheduling type for SJF and Priority
            const schedulingType = document.getElementById('scheduling-type');
            schedulingType.style.display = (this.value === 'sjf' || this.value === 'priority') ? 'block' : 'none';
        });
    }
    
    // Animation control handlers
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            isPlaying = !isPlaying;
            this.textContent = isPlaying ? 'Pause' : 'Play';
            if (isPlaying) animate();
        });
    }
    
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            cancelAnimationFrame(animationFrame);
            currentStep = 0;
            isPlaying = false;
            if (pauseBtn) pauseBtn.textContent = 'Play';
            if (animationSteps.length > 0) {
                drawVisualization(0);
                updateCurrentStatus(0);
                updateSolutionSteps();
            }
        });
    }
    
    const speedControl = document.getElementById('speed-control');
    if (speedControl) {
        // Set initial value to middle (1500)
        speedControl.value = 1500;
        
        speedControl.addEventListener('input', function(e) {
            // Map the slider value (100-3000) to animation speed (100-3000ms)
            // Lower values = faster animation
            animationSpeed = 3100 - e.target.value;
            
            const speedValue = document.getElementById('speed-value');
            if (speedValue) {
                // Display in seconds (0.1s to 3.0s)
                const speedInSeconds = (parseFloat(e.target.value) / 1000).toFixed(1);
                speedValue.textContent = speedInSeconds + 's';
            }
        });
        
        // Initialize speed value display
        const speedValue = document.getElementById('speed-value');
        if (speedValue) {
            speedValue.textContent = '1.5s';
        }
    }
    
    // Initialize UI elements
    const quantumInput = document.getElementById('quantum-input');
    quantumInput.style.display = 'none';
    
    const schedulingType = document.getElementById('scheduling-type');
    schedulingType.style.display = 'none';
});

// Handle window resize
window.addEventListener('resize', function() {
    const canvas = document.getElementById('visualization-canvas');
    if (canvas) {
        canvas.width = canvas.parentElement.clientWidth - 40;
        if (animationSteps.length > 0) {
            drawVisualization(currentStep - 1);
        }
    }
});