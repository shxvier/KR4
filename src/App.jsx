// src/App.jsx
import { useState, useEffect } from "react";

const STORAGE_KEY = "mini-kanban-columns-v1";

const defaultColumns = {
  todo: {
    id: "todo",
    title: "Backlog",
    color: "#ffb3c1",
    tasks: [
      { id: "t1", title: "Продумать структуру проекта" },
      { id: "t2", title: "Сверстать макет доски" },
    ],
  },
  inProgress: {
    id: "inProgress",
    title: "In Progress",
    color: "#b9e6ff",
    tasks: [{ id: "t3", title: "Реализовать перенос задач" }],
  },
  done: {
    id: "done",
    title: "Done",
    color: "#c9f7d5",
    tasks: [{ id: "t4", title: "Создать React-проект" }],
  },
};

function App() {
  // загрузка из localStorage
  const [columns, setColumns] = useState(() => {
    if (typeof window === "undefined") return defaultColumns;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultColumns;

    try {
      const parsed = JSON.parse(saved);
      return parsed || defaultColumns;
    } catch {
      return defaultColumns;
    }
  });

  const [dragData, setDragData] = useState(null);
  const [activeDropColumn, setActiveDropColumn] = useState(null);

  // контролируемые инпуты для добавления задач
  const [newTaskTitles, setNewTaskTitles] = useState({
    todo: "",
    inProgress: "",
    done: "",
  });

  // сохранение в localStorage при каждом изменении
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const handleDragStart = (columnId, taskId) => {
    setDragData({ fromColumn: columnId, taskId });
  };

  const handleDragOver = (event, columnId) => {
    event.preventDefault();
    setActiveDropColumn(columnId);
  };

  const handleDrop = (toColumnId) => {
    if (!dragData) return;

    const { fromColumn, taskId } = dragData;

    if (fromColumn === toColumnId) {
      setDragData(null);
      setActiveDropColumn(null);
      return;
    }

    setColumns((prev) => {
      const next = structuredClone(prev);

      const fromTasks = next[fromColumn].tasks;
      const taskIndex = fromTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = fromTasks.splice(taskIndex, 1);
      next[toColumnId].tasks.push(task);

      return next;
    });

    setDragData(null);
    setActiveDropColumn(null);
  };

  const handleDragLeave = (columnId) => {
    // немного снисходительно относимся к событиям,
    // чтобы не мигало при перетаскивании внутри одной колонки
    if (activeDropColumn === columnId) {
      setActiveDropColumn(null);
    }
  };

  const handleNewTaskChange = (columnId, value) => {
    setNewTaskTitles((prev) => ({
      ...prev,
      [columnId]: value,
    }));
  };

  const handleAddTask = (event, columnId) => {
    event.preventDefault();
    const title = newTaskTitles[columnId].trim();
    if (!title) return;

    const newTask = {
      id: `${columnId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
    };

    setColumns((prev) => {
      const next = structuredClone(prev);
      next[columnId].tasks.push(newTask);
      return next;
    });

    setNewTaskTitles((prev) => ({
      ...prev,
      [columnId]: "",
    }));
  };

  const handleDeleteTask = (columnId, taskId) => {
    setColumns((prev) => {
      const next = structuredClone(prev);
      next[columnId].tasks = next[columnId].tasks.filter(
        (task) => task.id !== taskId
      );
      return next;
    });
  };

  const totalTasks =
    columns.todo.tasks.length +
    columns.inProgress.tasks.length +
    columns.done.tasks.length;

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="app-shell">
      <div className="board">
        <header className="board__top">
          <div>
            <h1 className="board__title">Mini Kanban</h1>
            <p className="board__subtitle">
              Управляй задачами: перетаскивай, добавляй и удаляй карточки.
            </p>
          </div>

          <div className="board__meta">
            <div className="board__chip">
              <span className="board__chip-dot" />
              {totalTasks} задач
            </div>
            <div className="board__date">{today}</div>
            <div className="board__avatar">A</div>
          </div>
        </header>

        <div className="board__columns">
          {Object.values(columns).map((column) => {
            const isActiveDrop = activeDropColumn === column.id;

            return (
              <div
                key={column.id}
                className={
                  "column" + (isActiveDrop ? " column--active-drop" : "")
                }
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={() => handleDrop(column.id)}
                onDragLeave={() => handleDragLeave(column.id)}
              >
                <div
                  className="column__header"
                  style={{ backgroundColor: column.color }}
                >
                  <h2 className="column__title">{column.title}</h2>
                  <span className="column__count">{column.tasks.length}</span>
                </div>

                <div className="column__body">
                  <form
                    className="column__form"
                    onSubmit={(e) => handleAddTask(e, column.id)}
                  >
                    <input
                      className="column__input"
                      type="text"
                      placeholder="Новая задача..."
                      value={newTaskTitles[column.id] || ""}
                      onChange={(e) =>
                        handleNewTaskChange(column.id, e.target.value)
                      }
                    />
                    <button className="column__button" type="submit">
                      +
                    </button>
                  </form>

                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="task"
                      draggable
                      onDragStart={() =>
                        handleDragStart(column.id, task.id)
                      }
                    >
                      <span className="task__title">{task.title}</span>
                      <button
                        className="task__delete"
                        type="button"
                        onClick={() =>
                          handleDeleteTask(column.id, task.id)
                        }
                        aria-label="Удалить задачу"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {column.tasks.length === 0 && (
                    <div className="column__empty">
                      Перетащи задачу сюда или создай новую
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
