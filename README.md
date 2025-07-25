# 🧠 Proces-Schedule-animation

A web-based multicore task scheduling simulator built with **FastAPI**. This project visualizes **process scheduling**, **work stealing**, and **task forking** across multiple CPU cores in real-time.

📍 Live server (when hosted locally):
[http://127.0.0.1:8000](http://127.0.0.1:8000)

📁 GitHub repository:
[https://github.com/jero98772/Proces-Schedule-animation](https://github.com/jero98772/Proces-Schedule-animation)

---

## 📦 Features

* ⚙️ Simulate task scheduling on multiple CPU cores
* 🔄 Dynamic task forking
* 🤝 Work stealing between cores
* 📈 Real-time animation of scheduling events
* 📊 Performance metrics: waiting time, turnaround time, throughput
* 🖼️ Web interface for input parameters and viewing animations

---

## 🧪 What is Process Scheduling?

**Process scheduling** is a key component of any multitasking operating system. It refers to the way the system selects which process or task runs on which CPU core and when. In a multicore environment:

* **Work stealing** allows idle cores to "steal" tasks from busier cores.
* **Forking** lets one task spawn child tasks.
* Schedulers try to optimize **waiting time**, **turnaround**, and **throughput**.

This simulator visualizes these behaviors using **event-driven simulation** and **work-stealing deques**, ideal for understanding scheduling in parallel computing.

---

## 🚀 Getting Started

### 🖥️ Requirements

* Python 3.8+
* FastAPI
* Uvicorn

Install dependencies:

```bash
pip install -r requirements.txt
```

### 📥 Clone the repository

```bash
git clone https://github.com/jero98772/Proces-Schedule-animation
cd Proces-Schedule-animation
```

### ▶️ Run the server

```bash
uvicorn main:app --reload
```

Then open your browser at:
[http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📸 Screenshots & Visualization

### 1. Web UI

![UI](static/screenshots/1.png)
![UI](static/screenshots/2.png)

## 📜 License

GPLv3 License. Feel free to fork and contribute to this educational project!

