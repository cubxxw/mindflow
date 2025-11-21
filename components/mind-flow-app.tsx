"use client"

import { useState, useEffect, useRef } from "react"
import {
  MessageSquare,
  CheckCircle,
  Circle,
  Plus,
  Sparkles,
  ArrowRight,
  Layout,
  Brain,
  Wand2,
  Trash2,
  X,
} from "lucide-react"

// --- Mock Data & Constants ---

const PLAZA_CASES = [
  {
    id: 1,
    title: "高效早晨流程",
    tags: ["生活", "习惯"],
    description: "冥想 10 分钟 -> 深度阅读 30 分钟 -> 制定今日计划",
  },
  {
    id: 2,
    title: "深度工作冲刺",
    tags: ["工作", "效率"],
    description: "关闭通知 -> 设置 90 分钟番茄钟 -> 专注核心难点",
  },
  {
    id: 3,
    title: "周五复盘模板",
    tags: ["反思", "成长"],
    description: "回顾本周成就 -> 分析未完成原因 -> 规划下周重点",
  },
]

const INITIAL_CHAT_OPTIONS = ["感觉有些焦虑，事情太多", "有一个模糊的目标，不知从何下手", "只是想找点灵感"]

const MOCK_AI_BREAKDOWN = ["调研竞品现有的解决方案", "列出核心功能点 (MVP)", "绘制草图或线框图"]

// --- Components ---

const Button = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseStyle =
    "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
  const variants = {
    primary: "bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-200",
    secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300",
    ghost: "bg-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100",
    accent: "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200",
  }

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

const TaskItem = ({ task, onToggle, onBreakdown, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group bg-white border border-stone-100 rounded-2xl p-4 mb-3 hover:shadow-md transition-all duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Memory/Context Tag (The "Soul" of the task) */}
      {task.context && (
        <div className="absolute top-0 right-0 bg-stone-100 text-stone-400 text-[10px] px-2 py-1 rounded-bl-lg flex items-center gap-1">
          <Brain size={10} />
          <span>来自: {task.context}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-1 transition-colors ${task.completed ? "text-green-500" : "text-stone-300 hover:text-stone-400"}`}
        >
          {task.completed ? <CheckCircle size={22} className="fill-green-50" /> : <Circle size={22} />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-lg font-medium text-stone-800 break-words ${task.completed ? "line-through text-stone-400" : ""}`}
          >
            {task.title}
          </p>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 pl-2 border-l-2 border-stone-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
              {task.subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 text-stone-600 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div
            className={`mt-3 flex items-center justify-between transition-opacity duration-200 ${isHovered || "md:opacity-0"} opacity-100`}
          >
            <div className="flex gap-2">
              {!task.completed && !task.subtasks && (
                <button
                  onClick={() => onBreakdown(task.id)}
                  className="text-xs flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  <Wand2 size={12} /> AI 拆解
                </button>
              )}
            </div>

            <button
              onClick={() => onDelete(task.id)}
              className="text-stone-300 hover:text-red-400 transition-colors p-1"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main App ---

export default function MindFlowApp() {
  // States: 'entry', 'discovery', 'dashboard'
  const [view, setView] = useState("entry")

  // Discovery Chat State
  const [messages, setMessages] = useState([])
  const [chatOptions, setChatOptions] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [discoveryStep, setDiscoveryStep] = useState(0)

  // Dashboard State
  // Load from localStorage if available
  const [tasks, setTasks] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mindflow-tasks")
      if (saved) return JSON.parse(saved)
    }
    return [{ id: "init-1", title: "阅读 30 分钟", completed: false, context: "晨间习惯" }]
  })

  const [showConfetti, setShowConfetti] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Persist tasks
  useEffect(() => {
    localStorage.setItem("mindflow-tasks", JSON.stringify(tasks))
  }, [tasks])

  // Focus input when adding task
  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingTask])

  // --- Logic: Discovery Flow ---

  const startDiscovery = () => {
    setView("discovery")
    setMessages([{ type: "ai", text: "Hi，今天感觉如何？有些什么想法想聊聊吗？" }])
    setChatOptions(INITIAL_CHAT_OPTIONS)
    setDiscoveryStep(0)
  }

  const handleOptionClick = (optionText) => {
    // User message
    setMessages((prev) => [...prev, { type: "user", text: optionText }])
    setChatOptions([]) // Hide options while thinking
    setIsTyping(true)

    // Simulate AI thinking & "Digging Deeper"
    setTimeout(() => {
      setIsTyping(false)
      let nextAiMsg = ""
      let nextOptions = []

      if (discoveryStep === 0) {
        nextAiMsg = "听起来你需要一些梳理。这件事是关于工作项目，还是个人成长方面的？"
        nextOptions = ["工作项目", "个人成长", "两者都有关联"]
        setDiscoveryStep(1)
      } else if (discoveryStep === 1) {
        nextAiMsg = "明白了。如果用一句话描述完成后的理想状态，你会怎么说？"
        nextOptions = ["毫无压力，按部就班", "充满成就感，搞定难题", "理清思绪，知道下一步"]
        setDiscoveryStep(2)
      } else {
        // Final Step: Suggest Action
        nextAiMsg = "我感觉已经很清晰了。这件事的核心在于“开始第一步”。我为你整理了一个行动卡片，要放入今日计划吗？"
        nextOptions = [{ isAction: true, text: "生成今日任务卡片", taskTitle: "梳理项目启动清单", context: "探索对话" }]
      }

      setMessages((prev) => [...prev, { type: "ai", text: nextAiMsg }])
      setChatOptions(nextOptions)

      // Scroll to bottom
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }, 1000)
  }

  const handleGenerateTask = (title, context) => {
    const newTask = {
      id: Date.now(),
      title: title,
      completed: false,
      context: context,
    }
    setTasks((prev) => [newTask, ...prev])
    setView("dashboard")
    triggerConfetti()
  }

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
  }

  // --- Logic: Dashboard ---

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const breakdownTask = (id) => {
    // Simulate AI breakdown
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, subtasks: MOCK_AI_BREAKDOWN } : t)))
  }

  const handleQuickAdd = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      context: "快速添加",
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTaskTitle("")
    setIsAddingTask(false)
    triggerConfetti()
  }

  // --- Views ---

  const EntryView = () => (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-200 rounded-full blur-[100px] animate-pulse duration-[10000ms]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200 rounded-full blur-[100px] animate-pulse duration-[8000ms]"></div>
      </div>

      <div className="z-10 max-w-md w-full animate-in fade-in zoom-in duration-700">
        <h1 className="text-5xl font-serif font-bold text-stone-800 mb-3 tracking-tight">MindFlow</h1>
        <p className="text-stone-500 mb-12 text-lg">记录是为了遗忘，计划是为了当下。</p>

        <div className="space-y-4">
          <button
            onClick={() => setView("dashboard")}
            className="w-full bg-white border-2 border-stone-100 hover:border-stone-300 text-stone-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">我很清晰</span>
              <ArrowRight className="text-stone-300 group-hover:text-stone-800 transition-colors" />
            </div>
            <p className="text-stone-400 text-sm">直达今日看板，开始专注。</p>
          </button>

          <button
            onClick={startDiscovery}
            className="w-full bg-stone-900 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={80} />
            </div>
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="font-bold text-lg">有些模糊...</span>
              <MessageSquare className="text-stone-400 group-hover:text-white transition-colors" />
            </div>
            <p className="text-stone-400 text-sm relative z-10">通过对话探索思绪，生成行动。</p>
          </button>
        </div>
      </div>
    </div>
  )

  const DiscoveryView = () => (
    <div className="h-screen flex flex-col bg-stone-50 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <header className="bg-white p-4 border-b border-stone-100 flex items-center justify-between shrink-0 shadow-sm z-10">
        <button onClick={() => setView("entry")} className="text-stone-400 hover:text-stone-800 transition-colors">
          关闭
        </button>
        <span className="font-medium text-stone-800">思维探索</span>
        <div className="w-8"></div>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {/* Chat History */}
        <div className="space-y-4 pb-40">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.type === "user"
                    ? "bg-stone-800 text-white rounded-tr-sm"
                    : "bg-white text-stone-700 border border-stone-100 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-stone-100 flex gap-1">
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Bottom Interaction Area (Fixed) */}
      <div className="bg-gradient-to-t from-stone-50 via-stone-50 to-transparent pt-10 pb-6 px-4 fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-md mx-auto space-y-3">
          {chatOptions.map((opt, idx) =>
            opt.isAction ? (
              <button
                key={idx}
                onClick={() => handleGenerateTask(opt.taskTitle, opt.context)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-medium shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all animate-in fade-in slide-in-from-bottom-4 active:scale-95"
              >
                <Sparkles size={18} />
                {opt.text}
              </button>
            ) : (
              <button
                key={idx}
                onClick={() => handleOptionClick(opt)}
                className="w-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 p-3 rounded-xl text-sm font-medium transition-all shadow-sm text-left animate-in fade-in slide-in-from-bottom-2 hover:border-stone-300 active:scale-[0.98]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {opt}
              </button>
            ),
          )}

          {/* Fallback / Plaza Trigger */}
          {discoveryStep < 2 && !isTyping && chatOptions.length > 0 && (
            <div className="pt-4 border-t border-stone-200/50 mt-4 animate-in fade-in duration-700">
              <p className="text-xs text-stone-400 text-center mb-3">或者，看看别人在做什么</p>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                {PLAZA_CASES.map((c) => (
                  <div
                    key={c.id}
                    className="snap-center shrink-0 w-48 bg-white p-3 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleGenerateTask(c.title, "灵感广场")}
                  >
                    <h4 className="font-bold text-stone-700 text-sm">{c.title}</h4>
                    <div className="flex gap-1 mt-1 mb-2">
                      {c.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-blue-500 font-medium">使用此模板</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const DashboardView = () => (
    <div className="min-h-screen bg-[#F5F5F4] relative text-stone-800 animate-in fade-in duration-500">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="text-6xl animate-bounce duration-1000">✨</div>
          <div className="absolute top-1/4 left-1/4 text-4xl animate-ping delay-100">🎉</div>
          <div className="absolute top-1/3 right-1/4 text-5xl animate-ping delay-200">🚀</div>
        </div>
      )}

      {/* Top Nav */}
      <div className="sticky top-0 z-30 bg-[#F5F5F4]/90 backdrop-blur-md px-6 py-4 flex justify-between items-end border-b border-stone-200/50">
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-widest font-semibold mb-1">
            {new Date().toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}
          </p>
          <h2 className="text-2xl font-serif font-bold text-stone-800">今日行动</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("entry")}
            className="p-2 bg-white rounded-full shadow-sm border border-stone-200 text-stone-400 hover:text-stone-800 transition-colors"
            title="返回首页"
          >
            <Layout size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 pb-32">
        {/* The Daily Card - Elevated and Central */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 mb-8 border border-white ring-1 ring-stone-100 relative overflow-hidden min-h-[300px]">
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-stone-700 flex items-center gap-2">
              <Layout size={18} className="text-orange-400" />
              核心计划
            </h3>
            <span className="text-xs bg-stone-100 px-2 py-1 rounded-full text-stone-500 font-medium">
              {tasks.filter((t) => t.completed).length} / {tasks.length}
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            {tasks.length === 0 && !isAddingTask ? (
              <div className="text-center py-12 text-stone-400 animate-in fade-in duration-500">
                <Sparkles className="mx-auto mb-3 opacity-50" size={32} />
                <p>今天还是空白的</p>
                <button
                  onClick={startDiscovery}
                  className="text-sm text-stone-800 font-medium underline mt-2 hover:text-stone-600"
                >
                  去探索一下?
                </button>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onBreakdown={breakdownTask}
                  onDelete={deleteTask}
                />
              ))
            )}

            {/* Quick Add Input */}
            {isAddingTask && (
              <form onSubmit={handleQuickAdd} className="animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white border-2 border-stone-800 rounded-2xl p-4 shadow-md flex items-center gap-3">
                  <Circle size={22} className="text-stone-300" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="输入任务名称..."
                    className="flex-1 outline-none text-lg font-medium text-stone-800 placeholder:text-stone-300"
                    onBlur={() => !newTaskTitle && setIsAddingTask(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Add Placeholder */}
          {!isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-sm hover:border-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" /> 添加一个新想法
            </button>
          )}
        </div>

        {/* Floating Action Button for Discovery (When confused) */}
        <div className="fixed bottom-8 right-6 z-40">
          <button
            onClick={startDiscovery}
            className="bg-stone-900 text-white p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 hover:shadow-2xl transition-all flex items-center gap-2 pr-6 group"
          >
            <Sparkles size={20} className="text-yellow-300 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">我很迷茫</span>
          </button>
        </div>

        {/* Footer Tip */}
        <div className="text-center pb-8">
          <p className="text-xs text-stone-400">专注当下。过去已去，未来未来。</p>
        </div>
      </div>
    </div>
  )

  // Render Switch
  switch (view) {
    case "discovery":
      return <DiscoveryView />
    case "dashboard":
      return <DashboardView />
    default:
      return <EntryView />
  }
}
