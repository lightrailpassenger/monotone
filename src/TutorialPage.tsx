import React, { useEffect, useState } from "react";

import { Remarkable } from "remarkable";
import { useParams } from "react-router-dom";

const renderer = new Remarkable();

export default function TutorialPage() {
  const { id } = useParams();
  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    let isIgnored = false;
    const load = async () => {
      try {
        const { default: markdownContent } = await import(
          `./tutorials/${id}.md`
        );

        if (!isIgnored) {
          setMarkdown(markdownContent);
        }
      } catch {
        if (!isIgnored) {
          setMarkdown("");
        }
      }
    };
    load();

    return () => {
      isIgnored = true;
    };
  }, [id]);

  return (
    <div dangerouslySetInnerHTML={{ __html: renderer.render(markdown) }} />
  );
}
