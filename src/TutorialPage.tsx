import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

export default function TutorialPage() {
  const { id } = useParams();
  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { default: markdownContent } = await import(
          `./tutorials/${id}.md`
        );

        // TODO: Render markdown
        setMarkdown(markdownContent);
      } catch {
        setMarkdown("Error");
      }
    })();
  }, [id]);

  return <div>{markdown}</div>;
}
