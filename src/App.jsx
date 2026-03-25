import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { 
  StickyNote, 
  Link, 
  CheckSquare, 
  Square, 
  Layout, 
  Columns, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Upload, 
  PenTool, 
  Trash2, 
  Undo2, 
  Redo2, 
  Search, 
  Bell, 
  Settings,
  HelpCircle,
  Share2
} from 'lucide-react';
import { db, seedDatabase } from './db';

const SidebarItem = ({ icon: Icon, label, onClick }) => (
  <button className="sidebar-item" onClick={onClick}>
    <Icon className="sidebar-item-icon" />
    <span className="sidebar-item-label">{label}</span>
  </button>
);

const Card = ({ id, type, x, y, title, content, onConnect, onDelete, onEnter }) => {
  const handleDragEnd = async (e, info) => {
    const newX = x + info.offset.x;
    const newY = y + info.offset.y;
    await db.elements.update(id, { x: newX, y: newY });
  };

  const handleTitleChange = async (e) => {
    await db.elements.update(id, { title: e.target.innerText });
  };

  const handleContentChange = async (e) => {
    await db.elements.update(id, { content: e.target.innerText });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x, y }}
      onDragEnd={handleDragEnd}
      onDoubleClick={() => type === 'board' && onEnter(id)}
      className={`card card-${type}`}
      style={{ top: 0, left: 0 }}
    >
      <div className="card-controls">
        <button className="card-icon-btn" onClick={() => onConnect(id)}>
          <Share2 size={12} />
        </button>
        <button className="card-icon-btn danger" onClick={() => onDelete(id)}>
          <Trash2 size={12} />
        </button>
      </div>
      <div 
        className="card-title" 
        contentEditable 
        suppressContentEditableWarning
        onBlur={handleTitleChange}
      >
        {title}
      </div>
      {type !== 'column' ? (
        <div 
          className="card-content"
          contentEditable 
          suppressContentEditableWarning
          onBlur={handleContentChange}
        >
          {content}
        </div>
      ) : (
        <div className="column-placeholder">Drop items here</div>
      )}
      {type === 'todo' && (
        <div className="todo-check">
           <input type="checkbox" />
        </div>
      )}
    </motion.div>
  );
};

const Connections = ({ elements, connections }) => {
  return (
    <svg className="connections-layer">
      {connections.map((conn) => {
        const from = elements.find(el => el.id === conn.fromId);
        const to = elements.find(el => el.id === conn.toId);
        if (!from || !to) return null;
        
        // Simple center-to-center line
        // Assuming cards are ~200px wide and have dynamic height
        // This is a simplification, but good for a start
        return (
          <line
            key={conn.id}
            x1={from.x + 100}
            y1={from.y + 50}
            x2={to.x + 100}
            y2={to.y + 50}
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
  );
};

const App = () => {
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const currentBoard = useLiveQuery(() => 
    currentBoardId ? db.elements.get(currentBoardId) : null,
    [currentBoardId]
  );
  const elements = useLiveQuery(() => 
    db.elements.where('parentId').equals(currentBoardId || 0).toArray(), 
    [currentBoardId]
  );
  const connections = useLiveQuery(() => db.connections.toArray(), []);
  const [connectingFrom, setConnectingFrom] = useState(null);

  useEffect(() => {
    seedDatabase();
  }, []);

  const handleConnect = (id) => {
    if (connectingFrom) {
      if (connectingFrom !== id) {
        addConnection(connectingFrom, id);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(id);
    }
  };

  const addNote = async () => {
    const newNote = {
      type: 'note',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      title: 'New Note',
      content: 'Click to edit',
      parentId: currentBoardId || 0
    };
    await db.elements.add(newNote);
  };

  const addBoard = async () => {
    const newBoard = {
      type: 'board',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      title: 'New Board',
      content: 'Double click to enter',
      parentId: currentBoardId || 0
    };
    await db.elements.add(newBoard);
  };

  const deleteElement = async (id) => {
    await db.elements.delete(id);
    // Also delete connections
    await db.connections.where('fromId').equals(id).or('toId').equals(id).delete();
  };

  const addColumn = async () => {
    const newCol = {
      type: 'column',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      title: 'New Column',
      content: ''
    };
    await db.elements.add(newCol);
  };

  const addConnection = async (fromId, toId) => {
    await db.connections.add({ fromId, toId });
  };

  const addTodo = async () => {
    const newTodo = {
      type: 'todo',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      title: 'To-do item',
      content: 'Task description'
    };
    await db.elements.add(newTodo);
  };

  const addLink = async () => {
    const newLink = {
      type: 'link',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      title: 'New Link',
      content: 'https://example.com'
    };
    await db.elements.add(newLink);
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to clear all notes?')) {
      await db.elements.clear();
    }
  };

  if (!elements) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <SidebarItem icon={StickyNote} label="Note" onClick={addNote} />
        <SidebarItem icon={Link} label="Link" onClick={addLink} />
        <SidebarItem icon={CheckSquare} label="To-do" onClick={addTodo} />
        <SidebarItem icon={Square} label="Board" onClick={addBoard} />
        <SidebarItem icon={Columns} label="Column" onClick={addColumn} />
        <SidebarItem icon={MoreHorizontal} label="..." />
        <div style={{ flexGrow: 1 }} />
        <SidebarItem icon={ImageIcon} label="Image" />
        <SidebarItem icon={Upload} label="Upload" />
        <SidebarItem icon={PenTool} label="Draw" />
        <SidebarItem icon={Trash2} label="Trash" onClick={clearAll} />
      </aside>

      <main className="canvas-container">
        {connectingFrom && (
          <div className="connection-overlay">
            Click another card to connect...
          </div>
        )}
        <header className="header">
          <div className="header-left">
            <div className="breadcrumbs">
              <span onClick={() => setCurrentBoardId(null)} className="breadcrumb-item">Home</span>
              {currentBoardId && <span className="breadcrumb-separator">/</span>}
              {currentBoardId && (
                <span className="breadcrumb-item active">
                  {currentBoard?.title || 'Loading Board...'}
                </span>
              )}
            </div>
          </div>
          <div className="header-right">
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="icon-btn"><Undo2 size={18} /></button>
              <button className="icon-btn"><Redo2 size={18} /></button>
            </div>
            <button className="icon-btn"><Search size={18} /></button>
            <button className="icon-btn"><Bell size={18} /></button>
            <button className="icon-btn"><Settings size={18} /></button>
            <button className="btn btn-primary">Share</button>
          </div>
        </header>

        <div className="canvas">
          <Connections elements={elements || []} connections={connections || []} />
          {elements && elements.map(el => (
            <Card 
              key={el.id} 
              {...el} 
              onConnect={handleConnect}
              onDelete={deleteElement}
              onEnter={setCurrentBoardId}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
