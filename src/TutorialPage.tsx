import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

export default function TutorialPage() {
  const { id } = useParams();
  const [markdown, setMarkdown] = useState<string>("");

  useEffect(() => {
    (async () => {
      const markdownContent = await import(`./tutorials/${id}.md`);
      setMarkdown(markdown);
    })();
  }, [id]);

  return <div>{markdown}</div>;
}
