import styles from './error.module.css';

interface ErrorProps {
    message: string | undefined;
}

const ErrorToast: React.FC<ErrorProps> = ({ message }) => {

    return (
        <p className={styles.error}>{message}</p>
    );

}

export default ErrorToast;