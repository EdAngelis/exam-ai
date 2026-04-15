import styles from './error.module.css';

interface SuccessProps {
    message: string | undefined;
}

const SuccessToast: React.FC<SuccessProps> = ({ message }) => {

    return (
        <p className={styles.success}>{message}</p>
    );

}

export default SuccessToast;