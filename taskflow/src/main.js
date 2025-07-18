import './style.css'
 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskForm = document.getElementById('task-form');
            const taskInput = document.getElementById('task-input');
            const prioritySelect = document.getElementById('priority-select');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const clearCompletedBtn = document.getElementById('clear-completed');
            const themeToggle = document.getElementById('theme-toggle');
            const totalTasksEl = document.getElementById('total-tasks');
            const completedTasksEl = document.getElementById('completed-tasks');
            const mobileTotalTasksEl = document.getElementById('mobile-total-tasks');
            const mobileCompletedTasksEl = document.getElementById('mobile-completed-tasks');
            
            // State
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            
            // Initialize
            renderTasks();
            updateStats();
            
            // Event Listeners
            taskForm.addEventListener('submit', addTask);
            clearCompletedBtn.addEventListener('click', clearCompletedTasks);
            themeToggle.addEventListener('click', toggleTheme);
            
            // Filter buttons
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active', 'bg-indigo-600', 'text-white'));
                    button.classList.add('active', 'bg-indigo-600', 'text-white');
                    currentFilter = button.dataset.filter;
                    renderTasks();
                });
            });
            
            // Functions
            function addTask(e) {
                e.preventDefault();
                
                if (!taskInput.value.trim()) return;
                
                const newTask = {
                    id: Date.now(),
                    text: taskInput.value.trim(),
                    completed: false,
                    priority: prioritySelect.value,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                taskInput.value = '';
                renderTasks();
                updateStats();
                
                // Focus back to input
                taskInput.focus();
            }
            
            function renderTasks() {
                // Filter tasks based on current filter
                let filteredTasks = [...tasks];
                
                switch(currentFilter) {
                    case 'active':
                        filteredTasks = tasks.filter(task => !task.completed);
                        break;
                    case 'completed':
                        filteredTasks = tasks.filter(task => task.completed);
                        break;
                    case 'high':
                        filteredTasks = tasks.filter(task => task.priority === 'high');
                        break;
                    case 'medium':
                        filteredTasks = tasks.filter(task => task.priority === 'medium');
                        break;
                    case 'low':
                        filteredTasks = tasks.filter(task => task.priority === 'low');
                        break;
                }
                
                if (filteredTasks.length === 0) {
                    emptyState.style.display = 'flex';
                    taskList.innerHTML = '';
                    taskList.appendChild(emptyState);
                    return;
                }
                
                emptyState.style.display = 'none';
                taskList.innerHTML = '';
                
                filteredTasks.forEach(task => {
                    const taskEl = document.createElement('div');
                    taskEl.className = `task-item relative border-b border-slate-200 last:border-0 transition-all duration-200 hover:bg-slate-50 priority-${task.priority}`;
                    taskEl.dataset.id = task.id;
                    
                    taskEl.innerHTML = `
                        <div class="flex items-center p-4">
                            <div class="flex items-center flex-grow">
                                <input 
                                    type="checkbox" 
                                    class="custom-checkbox mr-3" 
                                    ${task.completed ? 'checked' : ''}
                                >
                                <span class="${task.completed ? 'line-through text-slate-400' : 'text-slate-700'} flex-grow">
                                    ${task.text}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full ${getPriorityClass(task.priority)} ml-2">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                            </div>
                            <button class="delete-btn p-2 text-slate-400 hover:text-red-500 rounded-full">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners to the new elements
                    const checkbox = taskEl.querySelector('input[type="checkbox"]');
                    const deleteBtn = taskEl.querySelector('.delete-btn');
                    
                    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
                    deleteBtn.addEventListener('click', () => deleteTask(task.id));
                    
                    // Double click to edit
                    const taskText = taskEl.querySelector('span:not(.text-xs)');
                    taskText.addEventListener('dblclick', () => editTask(task.id, taskText));
                    
                    taskList.appendChild(taskEl);
                });
            }
            
            function toggleTaskComplete(id) {
                tasks = tasks.map(task => 
                    task.id === id ? { ...task, completed: !task.completed } : task
                );
                saveTasks();
                updateStats();
                
                // Re-render if we're on completed/active filter
                if (currentFilter === 'active' || currentFilter === 'completed') {
                    renderTasks();
                }
            }
            
            function deleteTask(id) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
                updateStats();
            }
            
            function editTask(id, element) {
                const currentText = element.textContent.trim();
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow';
                
                element.replaceWith(input);
                input.focus();
                
                const saveEdit = () => {
                    const newText = input.value.trim();
                    if (newText && newText !== currentText) {
                        tasks = tasks.map(task => 
                            task.id === id ? { ...task, text: newText } : task
                        );
                        saveTasks();
                    }
                    
                    // Revert back to span
                    const newSpan = document.createElement('span');
                    newSpan.className = `${tasks.find(t => t.id === id).completed ? 'line-through text-slate-400' : 'text-slate-700'} flex-grow`;
                    newSpan.textContent = newText || currentText;
                    newSpan.addEventListener('dblclick', () => editTask(id, newSpan));
                    input.replaceWith(newSpan);
                };
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    }
                });
            }
            
            function clearCompletedTasks() {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                updateStats();
            }
            
            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(task => task.completed).length;
                
                totalTasksEl.textContent = total;
                completedTasksEl.textContent = completed;
                mobileTotalTasksEl.textContent = total;
                mobileCompletedTasksEl.textContent = completed;
                
                // Hide stats if no tasks
                document.getElementById('stats').style.display = total > 0 ? 'flex' : 'none';
            }
            
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            function getPriorityClass(priority) {
                switch(priority) {
                    case 'high': return 'bg-red-100 text-red-800';
                    case 'medium': return 'bg-yellow-100 text-yellow-800';
                    case 'low': return 'bg-green-100 text-green-800';
                    default: return 'bg-slate-100 text-slate-800';
                }
            }
            
            function toggleTheme() {
                const icon = themeToggle.querySelector('i');
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    icon.classList.replace('fa-sun', 'fa-moon');
                    themeToggle.classList.remove('text-yellow-400');
                    themeToggle.classList.add('text-indigo-600');
                } else {
                    document.documentElement.classList.add('dark');
                    icon.classList.replace('fa-moon', 'fa-sun');
                    themeToggle.classList.remove('text-indigo-600');
                    themeToggle.classList.add('text-yellow-400');
                }
            }
            
            // Drag and drop functionality
            let draggedItem = null;
            
            taskList.addEventListener('dragstart', function(e) {
                if (e.target.classList.contains('task-item')) {
                    draggedItem = e.target;
                    e.target.style.opacity = '0.5';
                    
                    // Set a custom drag image (optional)
                    const dragImage = e.target.cloneNode(true);
                    dragImage.style.width = e.target.offsetWidth + 'px';
                    dragImage.style.opacity = '0.8';
                    dragImage.style.position = 'absolute';
                    dragImage.style.top = '-9999px';
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImage, 0, 0);
                    setTimeout(() => document.body.removeChild(dragImage), 0);
                }
            });
            
            taskList.addEventListener('dragend', function(e) {
                if (draggedItem) {
                    draggedItem.style.opacity = '1';
                    draggedItem = null;
                }
            });
            
            taskList.addEventListener('dragover', function(e) {
                e.preventDefault();
                const afterElement = getDragAfterElement(taskList, e.clientY);
                if (afterElement == null) {
                    taskList.appendChild(draggedItem);
                } else {
                    taskList.insertBefore(draggedItem, afterElement);
                }
            });
            
            function getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }
            
            // Make tasks draggable
            function makeTasksDraggable() {
                document.querySelectorAll('.task-item').forEach(item => {
                    item.setAttribute('draggable', 'true');
                });
            }
            
            // Initialize draggable items
            makeTasksDraggable();
            
            // Reinitialize draggable items after rendering
            const originalRenderTasks = renderTasks;
            renderTasks = function() {
                originalRenderTasks.apply(this, arguments);
                makeTasksDraggable();
            };
        });