import React from "react";

import { HashRouter, Link, Routes, Route } from "react-router-dom";

import TutorialList from "./TutorialList";
import TutorialPage from "./TutorialPage";

import styles from "./App.module.scss";

function App() {
  return (
    <div className={styles.app}>
      <HashRouter>
        <Link className={styles.titleLink} to="/">
          <h1 className={styles.title}>Monotone</h1>
        </Link>
        <h2 className={styles.description}>Miscellaneous tutorials</h2>
        <Routes>
          <Route path="/" element={<TutorialList />} />
          <Route path="/tutorial/:id" element={<TutorialPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;
