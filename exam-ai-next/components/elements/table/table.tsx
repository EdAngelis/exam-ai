import React from "react";
import styles from "./table.module.css";

interface TableProps {
  head: string[];
  body: (string | number)[][];
  onDelete: (rowIndex: number) => void;
  deleteEnabled?: boolean;
}

const Table: React.FC<TableProps> = ({
  head,
  body,
  onDelete,
  deleteEnabled,
}) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {head.map((heading, index) => (
            <th key={index}>{heading}</th>
          ))}
          {deleteEnabled && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {body.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
            {deleteEnabled && (
              <td>
                <button
                  className={styles.button}
                  onClick={() => onDelete && onDelete(rowIndex)}
                >
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
