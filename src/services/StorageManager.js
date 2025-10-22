class StorageManager {
    static setItem(key, value) {
        try {
            // Validate the key and value
            if (typeof key !== 'string' || key.length === 0) {
                throw new Error('Invalid key: must be a non-empty string');
            }
            if (value === undefined) {
                throw new Error('Invalid value: cannot be undefined');
            }

            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Please free up some space.');
            } else {
                console.error('Error setting item in localStorage:', error.message);
            }
        }
    }

    static getItem(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error getting item from localStorage:', error.message);
            return null;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing item from localStorage:', error.message);
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error.message);
        }
    }
}