// Navigation Functions
function navigateToAlgorithm(type) {
    document.querySelector('.algorithms').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('algorithm-view').classList.remove('hidden');
    
    const titles = {
        'cpu': 'CPU Scheduling Algorithms',
        'disk': 'Disk Scheduling Algorithms',
        'page': 'Page Replacement Algorithms'
    };
    
    document.getElementById('algo-title').textContent = titles[type];
    initializeVisualization(type);
}

function backToHome() {
    document.querySelector('.algorithms').style.display = 'grid';
    document.querySelector('.hero').style.display = 'block';
    document.getElementById('algorithm-view').classList.add('hidden');
}

// Visualization Functions
function initializeVisualization(type) {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 400;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Initialize based on algorithm type
    switch(type) {
        case 'cpu':
            initCPUScheduling(ctx);
            break;
        case 'disk':
            initDiskScheduling(ctx);
            break;
        case 'page':
            initPageReplacement(ctx);
            break;
    }
}

function runVisualization() {
    const input = document.getElementById('input-data').value;
    // Process input and update visualization based on current algorithm
    // This is where you'll implement the specific algorithm logic
}

// Algorithm-specific initializations
function initCPUScheduling(ctx) {
    // Set up CPU scheduling visualization
    ctx.font = '16px Arial';
    ctx.fillStyle = '#4a90e2';
    ctx.fillText('CPU Scheduling Visualization', 10, 30);
}

function initDiskScheduling(ctx) {
    // Set up disk scheduling visualization
    ctx.font = '16px Arial';
    ctx.fillStyle = '#50c878';
    ctx.fillText('Disk Scheduling Visualization', 10, 30);
}

function initPageReplacement(ctx) {
    // Set up page replacement visualization
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('Page Replacement Visualization', 10, 30);
}

// Window resize handler
window.addEventListener('resize', () => {
    const canvas = document.getElementById('visualizer');
    if (!canvas.classList.contains('hidden')) {
        canvas.width = canvas.parentElement.clientWidth - 40;
        // Redraw visualization
    }
});