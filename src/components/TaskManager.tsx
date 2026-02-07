import React, { useState } from 'react';
import { Task, Priority, EnergyLevel, CustomReminder } from '../lib/types';
import { CATEGORY_ICONS, ENERGY_LEVEL_ICONS, CATEGORIES } from '../lib/constants';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (newTaskData: Omit<Task, 'id' | 'creationDate' | 'completed' | 'user_id'>) => void;
  onComplete: (id: string) => void;
  onViewTask: (task: Task) => void;
  onStruggle: (task: Task) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, 
  onAddTask,
  onComplete,
  onViewTask,
  onStruggle
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>(Priority.REGULAR);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('medium');
  const [selectedCategory, setSelectedCategory] = useState<Task['category']>('אישי');
  const [dueDateTime, setDueDateTime] = useState('');
  const [customReminderValue, setCustomReminderValue] = useState('');
  const [customReminderUnit, setCustomReminderUnit] = useState<CustomReminder['unit']>('minutes');
  const [categoryFilter, setCategoryFilter] = useState<Task['category'] | 'all'>('all');
  
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const numValue = parseInt(customReminderValue, 10);
    const customReminder = !isNaN(numValue) && numValue > 0 ? { value: numValue, unit: customReminderUnit } : null;

    const newTaskData = {
      title: newTaskTitle,
      description: '',
      priority: selectedPriority,
      dueDate: dueDateTime ? new Date(dueDateTime) : new Date(),
      subTasks: [],
      category: selectedCategory,
      reminders: {
        dayBefore: !customReminder,
        hourBefore: !customReminder,
        fifteenMinBefore: !customReminder,
        custom: customReminder,
      },
      energyLevel: selectedEnergy,
    };
    onAddTask(newTaskData);
    setNewTaskTitle('');
    setDueDateTime('');
    setCustomReminderValue('');
    setIsAdding(false);
  };
  
  const getPriorityButtonStyle = (p: Priority) => {
    if (selectedPriority === p) {
      const colorVar = `var(--${p.toLowerCase()}-color)`;
      return {
        backgroundColor: colorVar,
        borderColor: colorVar,
        color: 'white',
      };
    }
    return {};
  };

  const filteredTasks = tasks.filter(task => {
    if (categoryFilter === 'all') return true;
    return task.category === categoryFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-xl font-bold text-slate-800">המשימות שלי</h2>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
              + הוסף
            </button>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
          <button onClick={() => setCategoryFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>הכל</button>
          {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                  {CATEGORY_ICONS[cat]} {cat}
              </button>
          ))}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
          <input type="text" placeholder="מה המשימה שלך?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="w-full text-lg font-bold border-b-2 border-slate-100 focus:border-indigo-600 outline-none pb-2" autoFocus />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">תאריך יעד</label>
              <input type="datetime-local" value={dueDateTime} onChange={(e) => setDueDateTime(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

           <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 block">קטגוריה</label>
            <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1 ${ selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-100 text-slate-400' }`}>
                      <span>{CATEGORY_ICONS[cat]}</span>
                      {cat}
                    </button>
                ))}
            </div>
           </div>

          <div className="flex gap-2">
            {[Priority.URGENT, Priority.IMPORTANT, Priority.REGULAR].map(p => (
              <button key={p} onClick={() => setSelectedPriority(p)} style={getPriorityButtonStyle(p)} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all border-slate-100 text-slate-400`}>
                {p === Priority.URGENT ? 'דחוף' : p === Priority.IMPORTANT ? 'חשוב' : 'רגיל'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={handleAddTask} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200">שמור משימה</button>
            <button onClick={() => setIsAdding(false)} className="px-6 bg-slate-50 text-slate-400 py-3 rounded-2xl font-bold">ביטול</button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {filteredTasks.filter(t => !t.completed).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => {
          const completedSubTasks = task.subTasks.filter(st => st.completed).length;
          const totalSubTasks = task.subTasks.length;
          return (
            <button key={task.id} onClick={() => onViewTask(task)} className={`w-full text-start bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-start gap-4 transition-all hover:shadow-sm group`}>
              <div 
                  onClick={(e) => { e.stopPropagation(); onComplete(task.id); }} 
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${ task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 group-hover:border-indigo-400' }`}
              >
                {task.completed && '✓'}
              </div>
              <div className="overflow-hidden flex-grow">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 truncate">{task.title}</h3>
                    <span className="text-xs shrink-0">{CATEGORY_ICONS[task.category]}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                      <span>⏰</span>
                      <span>{new Date(task.dueDate).toLocaleString('he-IL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase shrink-0`}
                      style={{
                        backgroundColor: `var(--${task.priority.toLowerCase()}-color-light)`,
                        color: `var(--${task.priority.toLowerCase()}-color)`,
                      }}>
                      {task.priority === Priority.URGENT ? 'דחוף' : task.priority === Priority.IMPORTANT ? 'חשוב' : 'רגיל'}
                    </span>
                  </div>
                  {totalSubTasks > 0 && (
                    <div className="flex items-center justify-start gap-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-400">{completedSubTasks}/{totalSubTasks} הושלמו</span>
                      <progress className="w-24 h-1.5 rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-400 [&::-moz-progress-bar]:bg-indigo-400" value={completedSubTasks} max={totalSubTasks} />
                    </div>
                  )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onStruggle(task); }} className="p-2 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity" title="מצב התמודדות">
                  🆘
              </button>
            </button>
          )
        })}
        {filteredTasks.filter(t => t.completed).length > 0 && (
            <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 mb-2 text-center">משימות שהושלמו ✔️</h3>
                {filteredTasks.filter(t => t.completed).map(task => (
                      <button key={task.id} className={`w-full text-start bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-start gap-4 transition-all hover:shadow-sm group opacity-50 my-2`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer bg-emerald-500 border-emerald-500 text-white`}>✓</div>
                        <p className="text-slate-500 line-through truncate">{task.title}</p>
                    </button>
                ))}
            </div>
        )}
        {tasks.length === 0 && !isAdding && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">אין משימות עדיין. זמן להוסיף משהו!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;