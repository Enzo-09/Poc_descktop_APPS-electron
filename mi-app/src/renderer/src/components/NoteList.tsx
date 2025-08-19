import React from "react";
import { Note } from "../App";

interface NoteListProps {
  notes: Note[];
  onDeleteNote: (id: number) => void;
  onEditNote: (note: Note) => void;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  onDeleteNote,
  onEditNote,
}) => {
  return (
    <div className="note-list">
      {notes.map((note) => (
        <div key={note.id} className="note">
          <h3>{note.title}</h3>
          <p>{note.content}</p>
          <div className="note-actions">
            <button onClick={() => onEditNote(note)}>✏️ Editar</button>
            <button onClick={() => onDeleteNote(note.id)}>🗑️ Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoteList;
