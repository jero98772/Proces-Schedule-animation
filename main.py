import heapq
from collections import deque
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import random

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class Process:
    def __init__(self, pid, arrival, burst, io_chance=0.15):
        self.pid = pid
        self.arrival = arrival
        self.burst = burst
        self.remaining = burst
        self.state = "NEW"
        self.start_time = None
        self.finish_time = None
        self.waiting_time = 0
        self.io_chance = io_chance
        self.io_remaining = 0

    def to_dict(self):
        return {
            "pid": self.pid,
            "arrival": self.arrival,
            "burst": self.burst,
            "remaining": self.remaining,
            "state": self.state,
            "start_time": self.start_time,
            "finish_time": self.finish_time,
            "waiting_time": self.waiting_time,
        }


class RRSimulator:
    def __init__(self, quantum=3):
        self.quantum = quantum
        self.time = 0
        self.ready = deque()
        self.blocked = []
        self.cpu = None  # currently running process
        self.quantum_left = 0
        self.finished = []
        self.all_processes = []
        self.timeline = []  # for Gantt chart
        self.frames = []

    def capture(self):
        self.frames.append(
            {
                "time": self.time,
                "cpu": self.cpu.to_dict() if self.cpu else None,
                "quantum_left": self.quantum_left,
                "ready": [p.to_dict() for p in self.ready],
                "blocked": [p.to_dict() for p in self.blocked],
                "finished": [p.to_dict() for p in self.finished],
                "processes": [p.to_dict() for p in self.all_processes],
                "timeline": list(self.timeline),
            }
        )

    def run(self, processes):
        self.all_processes = sorted(processes, key=lambda p: p.arrival)
        pending = list(self.all_processes)
        idx = 0

        self.capture()

        while pending or self.ready or self.cpu or self.blocked:
            # Arrive new processes
            while idx < len(pending) and pending[idx].arrival <= self.time:
                p = pending[idx]
                p.state = "READY"
                self.ready.append(p)
                idx += 1

            # Unblock finished I/O
            still_blocked = []
            for p in self.blocked:
                p.io_remaining -= 1
                if p.io_remaining <= 0:
                    p.state = "READY"
                    self.ready.append(p)
                else:
                    still_blocked.append(p)
            self.blocked = still_blocked

            # CPU scheduling
            if self.cpu is None and self.ready:
                self.cpu = self.ready.popleft()
                self.cpu.state = "RUNNING"
                if self.cpu.start_time is None:
                    self.cpu.start_time = self.time
                self.quantum_left = self.quantum

            if self.cpu:
                self.cpu.remaining -= 1
                self.quantum_left -= 1
                self.timeline.append(self.cpu.pid)

                # Finished?
                if self.cpu.remaining <= 0:
                    self.cpu.state = "EXIT"
                    self.cpu.finish_time = self.time + 1
                    self.finished.append(self.cpu)
                    self.cpu = None
                    self.quantum_left = 0
                # Quantum expired?
                elif self.quantum_left <= 0:
                    self.cpu.state = "READY"
                    self.ready.append(self.cpu)
                    self.cpu = None
                # Random I/O request
                elif random.random() < self.cpu.io_chance and self.cpu.remaining > 1:
                    self.cpu.state = "BLOCKED"
                    self.cpu.io_remaining = random.randint(2, 5)
                    self.blocked.append(self.cpu)
                    self.cpu = None
                    self.quantum_left = 0
            else:
                self.timeline.append(None)  # idle

            # Update waiting times
            for p in self.ready:
                p.waiting_time += 1

            self.time += 1
            self.capture()

            if self.time > 500:  # safety
                break

        return self.frames


def generate_processes(n=6):
    procs = []
    t = 0
    for i in range(1, n + 1):
        arrival = t
        burst = random.randint(4, 12)
        procs.append(Process(f"P{i}", arrival, burst))
        t += random.randint(0, 3)
    return procs


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/simulate")
def simulate(
    num_processes: int = Query(6, ge=3, le=12),
    quantum: int = Query(3, ge=1, le=10),
):
    sim = RRSimulator(quantum=quantum)
    procs = generate_processes(num_processes)
    frames = sim.run(procs)

    # metrics
    finished = [p for p in sim.all_processes if p.finish_time is not None]
    avg_wait = sum(p.waiting_time for p in finished) / len(finished) if finished else 0
    avg_turn = (
        sum(p.finish_time - p.arrival for p in finished) / len(finished)
        if finished
        else 0
    )

    return {
        "frames": frames,
        "quantum": quantum,
        "metrics": {
            "avg_waiting": round(avg_wait, 2),
            "avg_turnaround": round(avg_turn, 2),
            "total_time": sim.time,
        },
    }
