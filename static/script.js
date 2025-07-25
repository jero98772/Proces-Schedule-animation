class SchedulerAnimation {
    constructor() {
        this.animationData = [];
        this.currentFrame = 0;
        this.isPlaying = false;
        this.animationSpeed = 5;
        this.animationInterval = null;
        this.currentTasks = new Map();
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.currentTimeEl = document.getElementById('currentTime');
        this.currentFrameEl = document.getElementById('currentFrame');
        this.totalFramesEl = document.getElementById('totalFrames');
        
        // Metrics elements
        this.completedTasksEl = document.getElementById('completedTasks');
        this.stealAttemptsEl = document.getElementById('stealAttempts');
        this.throughputEl = document.getElementById('throughput');
        this.avgWaitingTimeEl = document.getElementById('avgWaitingTime');
        this.avgTurnaroundTimeEl = document.getElementById('avgTurnaroundTime');
    }
    
    getCoreWrappers() {
        return document.querySelectorAll('.core-wrapper');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSimulation());
        this.pauseBtn.addEventListener('click', () => this.pauseAnimation());
        this.resetBtn.addEventListener('click', () => this.resetAnimation());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            this.speedValue.textContent = `${this.animationSpeed}x`;
            if (this.isPlaying) {
                this.pauseAnimation();
                this.playAnimation();
            }
        });
    }
    
    async startSimulation() {
        this.startBtn.disabled = true;
        this.startBtn.textContent = 'Loading...';
        
        // Get parameters from form inputs
        const numCores = document.getElementById('core-input')?.value || 4;
        const numTasks = document.getElementById('task-input')?.value || 10;
        const forkProb = document.getElementById('fork-input')?.value || 0.3;
        
        // For demo purposes, generate mock animation data
        this.generateMockAnimationData(numCores, numTasks);
        
        this.updateMetrics();
        this.resetAnimation();
        this.playAnimation();
        
        this.startBtn.textContent = 'Start Simulation';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = false;
        this.resetBtn.disabled = false;
    }
    
    generateMockAnimationData(numCores, numTasks) {
        // Generate mock animation data for demonstration
        this.animationData = [];
        this.metrics = {
            completed_tasks: 0,
            steal_attempts: 0,
            throughput: 0,
            avg_waiting_time: 0,
            avg_turnaround_time: 0
        };
        
        for (let frame = 0; frame < 100; frame++) {
            const frameData = {
                time: frame * 0.1,
                cores: []
            };
            
            for (let coreId = 0; coreId < numCores; coreId++) {
                const core = {
                    id: coreId,
                    idle: Math.random() > 0.6,
                    queue_size: Math.floor(Math.random() * 5),
                    tasks: []
                };
                
                // Add some random tasks
                if (!core.idle) {
                    core.tasks.push({
                        id: `T${Math.floor(Math.random() * 1000)}`,
                        state: 'running'
                    });
                }
                
                frameData.cores.push(core);
            }
            
            this.animationData.push(frameData);
        }
        
        this.totalFramesEl.textContent = this.animationData.length;
        
        // Mock metrics
        this.metrics = {
            completed_tasks: Math.floor(Math.random() * 50),
            steal_attempts: Math.floor(Math.random() * 20),
            throughput: (Math.random() * 10).toFixed(2),
            avg_waiting_time: (Math.random() * 5).toFixed(2),
            avg_turnaround_time: (Math.random() * 8).toFixed(2)
        };
    }
    
    playAnimation() {
        if (this.animationData.length === 0) return;
        
        this.isPlaying = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        const frameDelay = Math.max(100, 1000 - (this.animationSpeed * 90));
        
        this.animationInterval = setInterval(() => {
            if (this.currentFrame >= this.animationData.length) {
                this.pauseAnimation();
                return;
            }
            
            this.renderFrame(this.animationData[this.currentFrame]);
            this.currentFrame++;
            if (this.currentFrameEl) {
                this.currentFrameEl.textContent = this.currentFrame;
            }
        }, frameDelay);
    }
    
    pauseAnimation() {
        this.isPlaying = false;
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    resetAnimation() {
        this.pauseAnimation();
        this.currentFrame = 0;
        if (this.currentFrameEl) this.currentFrameEl.textContent = '0';
        if (this.currentTimeEl) this.currentTimeEl.textContent = '0';
        this.currentTasks.clear();
        
        // Get current core wrappers
        const coreWrappers = this.getCoreWrappers();
        
        // Reset all cores to initial state
        coreWrappers.forEach((wrapper, index) => {
            this.updateCoreDisplay(wrapper, {
                id: index,
                idle: true,
                queue_size: 0,
                tasks: []
            }, null);
        });
    }
    
    renderFrame(frame) {
        if (this.currentTimeEl) {
            this.currentTimeEl.textContent = frame.time.toFixed(2);
        }
        
        // Get current core wrappers
        const coreWrappers = this.getCoreWrappers();
        
        frame.cores.forEach((core, index) => {
            if (index >= coreWrappers.length) {
                console.error(`Core index ${index} is out of bounds. Only ${coreWrappers.length} cores exist.`);
                return;
            }
            
            const wrapper = coreWrappers[index];
            const runningTask = this.findRunningTask(core);
            this.updateCoreDisplay(wrapper, core, runningTask);
        });
    }
    
    findRunningTask(core) {
        // In this simulation, we need to determine the running task
        // based on the core's idle state and queue
        if (core.idle || core.tasks.length === 0) {
            return null;
        }
        
        // Find a task that should be running
        const runningTask = core.tasks.find(task => task.state === 'running');
        return runningTask || null;
    }
    
    updateCoreDisplay(wrapper, core, runningTask) {
        const coreId = core.id;
        
        // Update core info
        const statusEl = wrapper.querySelector('.core-status');
        const queueCountEl = wrapper.querySelector('.queue-count');
        const taskIdEl = wrapper.querySelector('.task-id');
        
        if (statusEl) {
            statusEl.textContent = core.idle ? 'Idle' : 'Busy';
            statusEl.className = core.idle ? 'core-status idle' : 'core-status busy';
        }
        
        if (queueCountEl) {
            queueCountEl.textContent = core.queue_size;
        }
        
        if (taskIdEl) {
            if (runningTask) {
                taskIdEl.textContent = runningTask.id;
            } else {
                taskIdEl.textContent = 'None';
            }
        }
        
        // Update process state diagram
        this.updateProcessDiagram(wrapper, core, runningTask);
    }
    
    updateProcessDiagram(wrapper, core, runningTask) {
    const stateCircles = wrapper.querySelectorAll('.state-circle');
    const arrowPaths = wrapper.querySelectorAll('.arrow-path');
    
    // Reset all states
    stateCircles.forEach(circle => circle.classList.remove('active'));
    arrowPaths.forEach(arrow => {
        arrow.classList.remove('active');
        arrow.setAttribute('marker-end', 'url(#arrowhead)');
    });
    
    // Determine active states based on core status and tasks
    if (core.idle && core.queue_size === 0) {
        // Core is completely idle - show start state (waiting for new processes)
        const startCircle = wrapper.querySelector('.state-circle.start, .state-circle.new');
        if (startCircle) startCircle.classList.add('active');
        return;
    }
    
    if (core.queue_size > 0) {
        // There are tasks in ready state
        const readyCircle = wrapper.querySelector('.state-circle.ready');
        if (readyCircle) readyCircle.classList.add('active');
        
        // Show start-to-ready transition if there are new tasks
        if (Math.random() < 0.3) { // 30% chance to show admission
            const startCircle = wrapper.querySelector('.state-circle.start, .state-circle.new');
            if (startCircle) startCircle.classList.add('active');
            
            // Animate start-to-ready arrow (first arrow path)
            const startToReadyArrow = arrowPaths[0];
            if (startToReadyArrow) {
                startToReadyArrow.classList.add('active');
                startToReadyArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
            }
        }
    }
    
    if (runningTask) {
        // There's a running task
        const runningCircle = wrapper.querySelector('.state-circle.running');
        if (runningCircle) runningCircle.classList.add('active');
        
        // Animate ready-to-running arrow (second arrow path)
        const readyToRunningArrow = arrowPaths[1];
        if (readyToRunningArrow) {
            readyToRunningArrow.classList.add('active');
            readyToRunningArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
        }
        
        // Check if task is about to finish (simulate terminated state)
        if (Math.random() < 0.1) { // 10% chance to show terminated state
            const terminatedCircle = wrapper.querySelector('.state-circle.terminated');
            if (terminatedCircle) terminatedCircle.classList.add('active');
            
            // Running to terminated arrow (sixth arrow path)
            const runningToTerminatedArrow = arrowPaths[5];
            if (runningToTerminatedArrow) {
                runningToTerminatedArrow.classList.add('active');
                runningToTerminatedArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
            }
        }
    }
    
    // Simulate blocked state occasionally (I/O wait)
    if (!core.idle && Math.random() < 0.15) { // 15% chance
        const blockedCircle = wrapper.querySelector('.state-circle.blocked, .state-circle.waiting');
        if (blockedCircle) blockedCircle.classList.add('active');
        
        // Running to blocked arrow (fourth arrow path)
        const runningToBlockedArrow = arrowPaths[3];
        if (runningToBlockedArrow) {
            runningToBlockedArrow.classList.add('active');
            runningToBlockedArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
        }
        
        // Blocked to ready arrow (fifth arrow path)
        const blockedToReadyArrow = arrowPaths[4];
        if (blockedToReadyArrow) {
            blockedToReadyArrow.classList.add('active');
            blockedToReadyArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
        }
    }
    
    // Simulate preemption/interrupt occasionally
    if (runningTask && Math.random() < 0.12) { // 12% chance
        // Running to ready (preemption) arrow (third arrow path)
        const runningToReadyArrow = arrowPaths[2];
        if (runningToReadyArrow) {
            runningToReadyArrow.classList.add('active');
            runningToReadyArrow.setAttribute('marker-end', 'url(#arrowhead-active)');
        }
    }
}
    
    updateMetrics() {
        if (!this.metrics) return;
        
        if (this.completedTasksEl) this.completedTasksEl.textContent = this.metrics.completed_tasks;
        if (this.stealAttemptsEl) this.stealAttemptsEl.textContent = this.metrics.steal_attempts;
        if (this.throughputEl) this.throughputEl.textContent = this.metrics.throughput;
        if (this.avgWaitingTimeEl) this.avgWaitingTimeEl.textContent = this.metrics.avg_waiting_time;
        if (this.avgTurnaroundTimeEl) this.avgTurnaroundTimeEl.textContent = this.metrics.avg_turnaround_time;
    }
}

// Enhanced animation effects for PCB style
class AnimationEffects {
    static addTaskTransition(fromCore, toCore) {
        // Create a visual effect for task stealing with PCB style
        const fromElement = document.querySelector(`[data-core="${fromCore}"]`);
        const toElement = document.querySelector(`[data-core="${toCore}"]`);
        
        if (fromElement && toElement) {
            const effect = document.createElement('div');
            effect.className = 'steal-effect pcb-effect';
            effect.style.cssText = `
                position: absolute;
                width: 12px;
                height: 12px;
                background: linear-gradient(45deg, #ff0040, #ff6600);
                border-radius: 50%;
                border: 2px solid #ff0040;
                z-index: 1000;
                pointer-events: none;
                box-shadow: 0 0 15px #ff0040;
                animation: pcbStealAnimation 1s ease-in-out;
            `;
            
            document.body.appendChild(effect);
            
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 1000);
        }
    }
    
    static addCompletionEffect(coreElement) {
        // Add a PCB-style completion burst effect
        const burst = document.createElement('div');
        burst.className = 'completion-burst pcb-burst';
        burst.style.cssText = `
            position: absolute;
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, rgba(0, 255, 65, 0.6) 0%, transparent 70%);
            border-radius: 50%;
            border: 2px solid rgba(0, 255, 65, 0.8);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            pointer-events: none;
            box-shadow: 0 0 30px rgba(0, 255, 65, 0.6);
            animation: pcbBurstAnimation 0.8s ease-out;
        `;
        
        coreElement.style.position = 'relative';
        coreElement.appendChild(burst);
        
        setTimeout(() => {
            if (burst.parentNode) {
                burst.parentNode.removeChild(burst);
            }
        }, 800);
    }
    
    static addElectricalSpark(element) {
        // Add electrical spark effect
        const spark = document.createElement('div');
        spark.className = 'electrical-spark';
        spark.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #00ff41;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 0 20px #00ff41;
            animation: sparkAnimation 0.3s ease-out;
        `;
        
        element.appendChild(spark);
        
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 300);
    }
}

// PCB-styled core creation function with corrected state diagram
function createCoreElement(coreId) {
    const coreWrapper = document.createElement('div');
    coreWrapper.className = 'core-wrapper electronic-component';
    coreWrapper.dataset.core = coreId;
    coreWrapper.innerHTML = `
        <h3>Core ${coreId}</h3>
        <div class="process-diagram">
            <!-- States positioned to match the arrow paths -->
            <div class="state-circle start solder-joint" style="position: absolute; top: 20px; left: 10px;">start</div>
            <div class="state-circle ready solder-joint" style="position: absolute; top: 120px; left: 50px;">ready</div>
            <div class="state-circle running solder-joint" style="position: absolute; top: 120px; right: 50px;">running</div>
            <div class="state-circle blocked solder-joint" style="position: absolute; top: 220px; left: 150px;">blocked</div>
            <div class="state-circle terminated solder-joint" style="position: absolute; top: 20px; right: 10px;">terminated</div>
            
            <svg class="arrow-container" width="100%" height="100%">
                <!-- Start to Ready -->
                <path class="arrow-path" d="M 60 70 Q 50 100 100 120" marker-end="url(#arrowhead)" />
                
                <!-- Ready to Running -->
                <path class="arrow-path" d="M 120 130 Q 180 100 240 130" marker-end="url(#arrowhead)" />
                
                <!-- Running to Ready (Preemption/Interrupt) -->
                <path class="arrow-path" d="M 280 150 Q 350 130 340 80" marker-end="url(#arrowhead)" />
                
                <!-- Running to Blocked -->
                <path class="arrow-path" d="M 275 180 Q 285 200 250 250" marker-end="url(#arrowhead)" />
                
                <!-- Blocked to Ready -->
                <path class="arrow-path" d="M 150 250 Q 100 215 90 180" marker-end="url(#arrowhead)" />
                
            </svg>
            
            <!-- Arrow Labels with corrected positioning >
            <div class="arrow-label" style="position: absolute; top: 75px; left: 160px;">admitted</div>
            <div class="arrow-label" style="position: absolute; top: 130px; left: 320px;">scheduler dispatch</div>
            <div class="arrow-label" style="position: absolute; top: 200px; left: 320px;">preemption</div>
            <div class="arrow-label" style="position: absolute; top: 200px; left: 380px;">I/O or event wait</div>
            <div class="arrow-label" style="position: absolute; top: 200px; left: 220px;">I/O completion</div>
            <div class="arrow-label" style="position: absolute; top: 75px; right: 120px;">exit</div-->
        </div>
        <div class="core-info microchip">
            <div class="status">Status: <span class="core-status idle">Idle</span><span class="status-led"></span></div>
            <div class="queue-size">Queue: <span class="queue-count">0</span> tasks</div>
            <div class="current-task">Current: <span class="task-id pcb-connector">None</span></div>
        </div>
    `;
    return coreWrapper;
}

// Function to initialize cores based on user input
function initializeCores(numCores) {
    const coresContainer = document.getElementById('cores-container');
    if (!coresContainer) {
        console.error('cores-container element not found');
        return;
    }
    
    coresContainer.innerHTML = ''; // Clear existing cores
    
    for (let i = 0; i < numCores; i++) {
        const coreElement = createCoreElement(i);
        coresContainer.appendChild(coreElement);
    }
    
    // Add SVG markers for arrows
    addSVGMarkers();
}

// Add SVG markers for arrow heads
function addSVGMarkers() {
    const existingSvg = document.getElementById('arrow-markers');
    if (existingSvg) return; // Already exists
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'arrow-markers';
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    svg.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#00ff41" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ff0040" />
            </marker>
        </defs>
    `;
    
    document.body.appendChild(svg);
}

// Add enhanced CSS animations for PCB effects
const style = document.createElement('style');
style.textContent = `
    @keyframes pcbStealAnimation {
        0% { transform: scale(1) translateX(0); opacity: 1; box-shadow: 0 0 15px #ff0040; }
        50% { transform: scale(1.3) translateX(50px); opacity: 0.8; box-shadow: 0 0 25px #ff0040; }
        100% { transform: scale(0.7) translateX(100px); opacity: 0; box-shadow: 0 0 35px #ff0040; }
    }
    
    @keyframes pcbBurstAnimation {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
    }
    
    @keyframes sparkAnimation {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(3); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
    }
    
    .pcb-effect {
        filter: drop-shadow(0 0 8px currentColor);
    }
    
    .state-circle:hover {
        transform: scale(1.05) !important;
        transition: transform 0.2s ease;
    }
    
    .arrow-path.active {
        filter: drop-shadow(0 0 8px #ff0040) !important;
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with default 4 cores
    initializeCores(4);
    
    const scheduler = new SchedulerAnimation();
    
    // Add input event listener to regenerate cores when core count changes
    const coreInput = document.getElementById('core-input');
    if (coreInput) {
        coreInput.addEventListener('change', function() {
            const numCores = parseInt(this.value) || 4;
            initializeCores(numCores);
        });
    }
    
    // Add interactive hover effects with PCB styling
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('state-circle')) {
            e.target.style.transform = 'scale(1.1)';
            AnimationEffects.addElectricalSpark(e.target);
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('state-circle')) {
            e.target.style.transform = 'scale(1)';
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ': // Spacebar
                e.preventDefault();
                if (scheduler.isPlaying) {
                    scheduler.pauseAnimation();
                } else {
                    scheduler.playAnimation();
                }
                break;
            case 'r':
            case 'R':
                scheduler.resetAnimation();
                break;
        }
    });
    
    // Add periodic electrical effects
    setInterval(() => {
        const activeCircles = document.querySelectorAll('.state-circle.active');
        activeCircles.forEach(circle => {
            if (Math.random() < 0.3) {
                AnimationEffects.addElectricalSpark(circle);
            }
        });
    }, 2000);
});

const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);