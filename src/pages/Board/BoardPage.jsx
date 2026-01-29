import { useState } from 'react'
import '../../styles/BoardPage.css'

function BoardPage() {
  const [todos, setTodos] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  const toggleTodo = (id) => {
    if (editingId) return
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id, e) => {
    e.stopPropagation()
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const addTodo = () => {
    if (!inputValue.trim()) return

    const newTodo = {
      id: Date.now(),
      title: inputValue.trim(),
      completed: false,
      dueDate: dueDate || null,
    }
    setTodos([...todos, newTodo])
    setInputValue('')
    setDueDate('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const startEdit = (todo, e) => {
    e.stopPropagation()
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDueDate(todo.dueDate || '')
  }

  const saveEdit = (id) => {
    if (!editTitle.trim()) return

    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, title: editTitle.trim(), dueDate: editDueDate || null }
        : todo
    ))
    setEditingId(null)
    setEditTitle('')
    setEditDueDate('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDueDate('')
  }

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const isOverdue = (dateStr) => {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateStr) < today
  }

  const completedCount = todos.filter(todo => todo.completed).length

  return (
    <div className="board-page">
      <div className="todo-header">
        <h1>TODO LIST</h1>
        <span className="todo-count">
          {completedCount} / {todos.length} 완료
        </span>
      </div>

      <div className="todo-input-wrap">
        <input
          type="text"
          className="todo-input"
          placeholder="할일을 입력하세요"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          type="date"
          className="todo-date-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="todo-add-btn" onClick={addTodo}>
          추가
        </button>
      </div>

      <ul className="todo-list">
        {todos.map(todo => (
          <li
            key={todo.id}
            className={`todo-item ${todo.completed ? 'completed' : ''} ${editingId === todo.id ? 'editing' : ''}`}
            onClick={() => toggleTodo(todo.id)}
          >
            {editingId === todo.id ? (
              <>
                <input
                  type="text"
                  className="todo-edit-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <input
                  type="date"
                  className="todo-edit-date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="todo-save-btn"
                  onClick={(e) => { e.stopPropagation(); saveEdit(todo.id) }}
                >
                  저장
                </button>
                <button
                  className="todo-cancel-btn"
                  onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span className="todo-checkbox">
                  {todo.completed ? '✓' : ''}
                </span>
                <span className="todo-title">{todo.title}</span>
                {todo.dueDate && (
                  <span className={`todo-due-date ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}`}>
                    {formatDate(todo.dueDate)}
                  </span>
                )}
                <button
                  className="todo-edit-btn"
                  onClick={(e) => startEdit(todo, e)}
                >
                  ✎
                </button>
                <button
                  className="todo-delete-btn"
                  onClick={(e) => deleteTodo(todo.id, e)}
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BoardPage
