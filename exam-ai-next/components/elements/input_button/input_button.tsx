import React, { useState } from 'react';
import styles from './input_button.module.css';

export default function InputButton({ onClick }: { onClick: (inputValue: string) => void }) {
	const [inputValue, setInputValue] = useState('');

	return (
		<div className={styles.container}>
			<input 
				type="text" 
				className={styles.input} 
				value={inputValue} 
				onChange={(e) => setInputValue(e.target.value)} 
			/>
			<button 
				className={styles.button} 
				onClick={() => {
					onClick(inputValue);
					setInputValue('');
				}}
			>
				Submit
			</button>
		</div>
	);
}

