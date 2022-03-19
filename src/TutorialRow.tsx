import React, { useCallback } from "react";

import { useNavigate } from "react-router-dom";

import styles from "./TutorialRow.module.scss";

interface TutorialRowProps {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
}

export default function TutorialRow({
  id,
  title,
  description,
  createdAt,
}: TutorialRowProps) {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(`/tutorial/${id}`);
  }, [navigate, id]);

  return (
    <a className={styles.row} onClick={handleClick}>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
      <p className={styles.createdAt}>Created: {`${createdAt}`}</p>
    </a>
  );
}
