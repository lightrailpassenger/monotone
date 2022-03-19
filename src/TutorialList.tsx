import React from "react";

import TutorialRow from "./TutorialRow";

import index from "./tutorials";

export default function TutorialList() {
  return (
    <div>
      {index.map((entry) => (
        <TutorialRow key={entry.id} {...entry} />
      ))}
    </div>
  );
}
