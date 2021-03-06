import React, { useCallback } from "react";
import SidebarComponent from "./sidebar/sidebar";
import EditorComponent from "./editor/editor";
import "./App.css";

const firebase = require("firebase");

class App extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      selectedNoteIndex: null,
      selectedNote: null,
      notes: null
    };
    this.selectNote = this.selectNote.bind(this);
    this.noteUpdate = this.noteUpdate.bind(this);
  }

  componentDidUpdate = () => {
    console.log("App componentDidUpdate");
  };

  render() {
    return (
      <div className="app-container">
        <SidebarComponent
          selectedNoteIndex={this.state.selectedNoteIndex}
          notes={this.state.notes}
          deleteNote={this.deleteNote}
          selectNote={this.selectNote}
          newNote={this.newNote}
        ></SidebarComponent>
        {this.state.selectedNote ? (
          <EditorComponent
            selectedNote={this.state.selectedNote}
            selectedNoteIndex={this.state.selectedNoteIndex}
            noteUpdate={this.noteUpdate}
          ></EditorComponent>
        ) : null}
      </div>
    );
  }

  componentDidMount = () => {
    firebase
      .firestore()
      .collection("notes")
      .onSnapshot(serverUpdate => {
        const notes = serverUpdate.docs.map(_doc => {
          const data = _doc.data();
          data["id"] = _doc.id;
          return data;
        });
        console.log("App Firebase is setting state");
        //console.log(notes);
        this.setState({ notes: notes });
      });
  };

  selectNote(note, index) {
    this.setState({ selectedNoteIndex: index, selectedNote: note });
  }

  noteUpdate({ id, title, body }) {
    let obj = { timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (title !== null) {
      obj.title = title;
    }
    if (body !== null) {
      obj.body = body;
    }

    firebase
      .firestore()
      .collection("notes")
      .doc(id)
      .update(obj);
  }

  newNote = async title => {
    const note = {
      title: title,
      body: ""
    };
    const newFromDB = await firebase
      .firestore()
      .collection("notes")
      .add({
        title: note.title,
        body: note.body,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    const newID = newFromDB.id;
    // await this.setState({ notes: [...this.state.notes, note] });
    const newNotes = [...this.state.notes, note];
    const newNoteIndex = newNotes.indexOf(
      newNotes.filter(_note => _note.id === newID)[0]
    );
    this.setState({
      selectedNote: this.state.notes[newNoteIndex],
      selectedNoteIndex: newNoteIndex,
      notes: newNotes
    });
  };
  deleteNote = async note => {
    const noteIndex = this.state.notes.indexOf(note);
    await this.setState({
      notes: this.state.notes.filter(_note => _note !== note)
    });
    if (this.state.selectedNoteIndex === noteIndex) {
      this.setState({ selectedNoteIndex: null, selectedNote: null });
    } else {
      this.state.notes.length > 1
        ? this.selectNote(
            this.state.notes[this.state.selectedNoteIndex - 1],
            this.state.selectedNoteIndex - 1
          )
        : this.setState({ selectedNoteIndex: null, selectedNote: null });
    }

    firebase
      .firestore()
      .collection("notes")
      .doc(note.id)
      .delete();
  };
}

export default App;
