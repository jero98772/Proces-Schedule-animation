class Visualizer {
    constructor() {
        this.frames = [];
        this.idx = 0;
        this.playing = false;
        this.timer = null;
        this.speed = 4;
        this.quantum = 3;

        this.$ = id => document.getElementById(id);
        this.bind();
    }

    bind() {
        this.$("startBtn").onclick = () => this.start();
        this.$("pauseBtn").onclick = () => this.pause();
        this.$("resetBtn").onclick = () => this.reset();
        this.$("speed").oninput = e => {
            this.speed = +e.target.value;
            this.$("speedVal").textContent = this.speed + "x";
            if (this.playing) { this.pause(); this.play(); }
        };
    }

    async start() {
        const n = +this.$("numProc").value || 6;
        this.quantum = +this.$("quantum").value || 3;
        this.$("qVal").textContent = this.quantum;

        this.$("startBtn").disabled = true;
        this.$("startBtn").textContent = "Loading…";

        try {
            const res = await fetch(`/simulate?num_processes=${n}&quantum=${this.quantum}`);
            const data = await res.json();
            this.frames = data.frames;
            this.metrics = data.metrics;

            this.$("total").textContent = this.frames.length;
            this.$("avgWait").textContent = data.metrics.avg_waiting;
            this.$("avgTurn").textContent = data.metrics.avg_turnaround;
            this.$("totalTime").textContent = data.metrics.total_time;

            this.reset();
            this.play();
        } catch (e) {
            console.error(e);
            alert("Failed to run simulation");
        } finally {
            this.$("startBtn").textContent = "Start Simulation";
            this.$("startBtn").disabled = false;
            this.$("pauseBtn").disabled = false;
            this.$("resetBtn").disabled = false;
        }
    }

    play() {
        if (!this.frames.length) return;
        this.playing = true;
        this.$("startBtn").disabled = true;
        this.$("pauseBtn").disabled = false;

        const delay = Math.max(80, 900 - this.speed * 80);
        this.timer = setInterval(() => {
            if (this.idx >= this.frames.length) {
                this.pause();
                return;
            }
            this.render(this.frames[this.idx]);
            this.idx++;
            this.$("frame").textContent = this.idx;
        }, delay);
    }

    pause() {
        this.playing = false;
        clearInterval(this.timer);
        this.$("startBtn").disabled = false;
        this.$("pauseBtn").disabled = true;
    }

    reset() {
        this.pause();
        this.idx = 0;
        this.$("frame").textContent = "0";
        this.$("time").textContent = "0";
        this.$("procBody").innerHTML = "";
        this.$("readyQueue").innerHTML = "";
        this.$("blockedQueue").innerHTML = "";
        this.$("gantt").innerHTML = "";
        this.$("cpu").classList.remove("active");
        this.$("cpu").querySelector(".cpu-label").textContent = "IDLE";
        this.$("progressBar").style.width = "0%";
        this.$("qLeft").textContent = "–";
    }

    render(f) {
        this.$("time").textContent = f.time;

        // Process Table
        const tbody = this.$("procBody");
        tbody.innerHTML = "";
        f.processes.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${p.pid}</strong></td>
                <td><span class="state-badge state-${p.state}">${p.state}</span></td>
                <td>${p.arrival}</td>
                <td>${p.burst}</td>
                <td>${p.remaining}</td>
            `;
            tbody.appendChild(tr);
        });

        // Ready Queue
        const rq = this.$("readyQueue");
        rq.innerHTML = "";
        f.ready.forEach(p => {
            const chip = document.createElement("div");
            chip.className = "proc-chip";
            chip.textContent = p.pid;
            rq.appendChild(chip);
        });

        // Blocked
        const bq = this.$("blockedQueue");
        bq.innerHTML = "";
        f.blocked.forEach(p => {
            const chip = document.createElement("div");
            chip.className = "proc-chip blocked";
            chip.textContent = p.pid;
            bq.appendChild(chip);
        });

        // CPU
        const cpuEl = this.$("cpu");
        const label = cpuEl.querySelector(".cpu-label");
        if (f.cpu) {
            cpuEl.classList.add("active");
            label.textContent = f.cpu.pid;
            const pct = (f.quantum_left / this.quantum) * 100;
            this.$("progressBar").style.width = pct + "%";
            this.$("qLeft").textContent = f.quantum_left;
        } else {
            cpuEl.classList.remove("active");
            label.textContent = "IDLE";
            this.$("progressBar").style.width = "0%";
            this.$("qLeft").textContent = "–";
        }

        // Live Gantt (append only new cells)
        const gantt = this.$("gantt");
        // rebuild for simplicity & correctness
        gantt.innerHTML = "";
        f.timeline.forEach(pid => {
            const cell = document.createElement("div");
            cell.className = "gantt-cell" + (pid ? "" : " idle");
            cell.textContent = pid || "–";
            if (pid) {
                // simple color by pid hash
                const colors = ["#1f6feb","#238636","#9e6a03","#8957e5","#da3633","#2da44e","#bf8700"];
                const idx = parseInt(pid.replace("P","")) % colors.length;
                cell.style.background = colors[idx];
            }
            gantt.appendChild(cell);
        });
        gantt.scrollTop = gantt.scrollHeight;
    }
}

document.addEventListener("DOMContentLoaded", () => new Visualizer());