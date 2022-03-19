import React, { useEffect, useState } from "react";

import { Remarkable } from "remarkable";
import { useParams } from "react-router-dom";

const renderer = new Remarkable();

export default function TutorialPage() {
  const { id } = useParams();
  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { default: markdownContent } = await import(
          `./tutorials/${id}.md`
        );

        setMarkdown(markdownContent);
      } catch {
        setMarkdown("");
      }
    })();
  }, [id]);

  return (
    <div dangerouslySetInnerHTML={{ __html: renderer.render(markdown) }} />
  );
}
