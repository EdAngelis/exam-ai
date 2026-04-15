import React from 'react';
import { FaChevronDown } from 'react-icons/fa'; // Import icon from react-icons
import style from './dropdown.module.css';

interface DropdownProps {
    options: string[];
    selectedValue: string;
    onChange: (value: string) => void;
    width?: string; // Add width prop
    disabled?: boolean; // Add disabled prop
}

const Dropdown: React.FC<DropdownProps> = ({ options = [], selectedValue, onChange, width = '200px', disabled = false }) => { // Default disabled to false
    return (
        <div className={style.dropdown} style={{ width }}> {/* Apply width */}
            <FaChevronDown className={style.icon} /> {/* Use icon from react-icons */}
            <select className={style.select} value={selectedValue} onChange={(e) => onChange(e.target.value)} disabled={disabled}> {/* Apply disabled */}
                { options.length ? options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                )) : null }
            </select>
        </div>
    );
};

export default Dropdown;
