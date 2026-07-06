import React from "react";
import styles from "./table.module.css";

interface TableProps {
  head: string[];
  body: (string | number)[][];
  onDelete?: (rowIndex: number) => void;
  deleteEnabled?: boolean;
  selectable?: boolean;
  selectedRows?: boolean[];
  onToggleRow?: (rowIndex: number) => void;
}

const Table: React.FC<TableProps> = ({
  head,
  body,
  onDelete,
  deleteEnabled,
  selectable,
  selectedRows,
  onToggleRow,
}) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {selectable && <th></th>}
          {head.map((heading, index) => (
            <th key={index}>{heading}</th>
          ))}
          {deleteEnabled && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {body.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {selectable && (
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows?.[rowIndex] ?? false}
                  onChange={() => onToggleRow && onToggleRow(rowIndex)}
                />
              </td>
            )}
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
